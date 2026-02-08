// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SchoolFeesPolicy
 * @notice Policy contract for managing school fee payments with automatic routing
 * @dev Supports multiple payment methods, installments, and beneficiary management
 */
contract SchoolFeesPolicy is Initializable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    
    // Payment status enum
    enum PaymentStatus {
        Pending,
        Partial,
        Completed,
        Overdue,
        Cancelled
    }
    
    // Fee structure
    struct FeeStructure {
        uint256 totalAmount;
        uint256 paidAmount;
        uint256 installments;
        uint256 installmentAmount;
        uint256 dueDate;
        uint256 lateFeeRate; // Basis points (100 = 1%)
        PaymentStatus status;
        bool allowPartialPayments;
    }
    
    // Payment record
    struct PaymentRecord {
        uint256 amount;
        uint256 timestamp;
        address payer;
        address token; // address(0) for ETH
        string memo;
    }
    
    // Beneficiary information
    struct Beneficiary {
        address payable wallet;
        uint256 percentage; // Basis points (10000 = 100%)
        string role; // e.g., "school", "transport", "meals"
        bool active;
    }
    
    // State variables
    address public student;
    address public guardian;
    string public studentName;
    string public institution;
    string public academicYear;
    
    // Fee management
    FeeStructure public feeStructure;
    PaymentRecord[] public paymentHistory;
    
    // Beneficiaries
    Beneficiary[] public beneficiaries;
    mapping(address => uint256) public beneficiaryIndex;
    
    // Settings
    bool public autoDistribute;
    uint256 public gracePeriod; // Days after due date before late fees apply
    mapping(address => bool) public acceptedTokens;
    
    // Events
    event PaymentReceived(
        address indexed payer,
        uint256 amount,
        address token,
        string memo
    );
    
    event PaymentDistributed(
        address indexed beneficiary,
        uint256 amount,
        address token
    );
    
    event FeeStructureUpdated(
        uint256 totalAmount,
        uint256 installments,
        uint256 dueDate
    );
    
    event BeneficiaryAdded(
        address indexed beneficiary,
        uint256 percentage,
        string role
    );
    
    event BeneficiaryUpdated(
        address indexed beneficiary,
        uint256 newPercentage,
        bool active
    );
    
    event LateFeeApplied(uint256 amount, uint256 newTotal);
    
    // Errors
    error Unauthorized();
    error InvalidAmount();
    error PaymentExceedsRemaining();
    error InvalidBeneficiary();
    error InvalidPercentage();
    error TokenNotAccepted();
    error DistributionFailed();
    error InsufficientBalance();
    
    // Modifiers
    modifier onlyGuardian() {
        if (msg.sender != guardian) revert Unauthorized();
        _;
    }
    
    modifier onlyGuardianOrStudent() {
        if (msg.sender != guardian && msg.sender != student) revert Unauthorized();
        _;
    }
    
    modifier validToken(address token) {
        if (token != address(0) && !acceptedTokens[token]) revert TokenNotAccepted();
        _;
    }
    
    /**
     * @notice Initialize the school fees policy contract
     * @param _student The student's wallet address
     * @param _guardian The guardian's wallet address
     * @param _studentName The student's name
     * @param _institution The educational institution
     * @param _academicYear The academic year (e.g., "2024-2025")
     * @param _totalAmount The total fee amount
     * @param _installments Number of installments (0 = lump sum)
     * @param _dueDate The payment due date
     */
    function initialize(
        address _student,
        address _guardian,
        string memory _studentName,
        string memory _institution,
        string memory _academicYear,
        uint256 _totalAmount,
        uint256 _installments,
        uint256 _dueDate
    ) external initializer {
        __ReentrancyGuard_init();
        
        student = _student;
        guardian = _guardian;
        studentName = _studentName;
        institution = _institution;
        academicYear = _academicYear;
        
        feeStructure = FeeStructure({
            totalAmount: _totalAmount,
            paidAmount: 0,
            installments: _installments,
            installmentAmount: _installments > 0 ? _totalAmount / _installments : _totalAmount,
            dueDate: _dueDate,
            lateFeeRate: 500, // 5% default late fee
            status: PaymentStatus.Pending,
            allowPartialPayments: _installments > 0
        });
        
        autoDistribute = true;
        gracePeriod = 7 days;
    }
    
    /**
     * @notice Make a payment towards school fees
     * @param token The token address (address(0) for ETH)
     * @param amount The payment amount
     * @param memo Payment reference/memo
     */
    function makePayment(
        address token,
        uint256 amount,
        string calldata memo
    ) external payable validToken(token) nonReentrant {
        if (amount == 0) revert InvalidAmount();
        
        // Calculate remaining amount including any late fees
        uint256 remainingAmount = getRemainingAmount();
        if (amount > remainingAmount) revert PaymentExceedsRemaining();
        
        // Handle payment transfer
        if (token == address(0)) {
            // ETH payment
            if (msg.value != amount) revert InvalidAmount();
        } else {
            // ERC20 payment
            if (msg.value != 0) revert InvalidAmount();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Record payment
        paymentHistory.push(PaymentRecord({
            amount: amount,
            timestamp: block.timestamp,
            payer: msg.sender,
            token: token,
            memo: memo
        }));
        
        // Update fee structure
        feeStructure.paidAmount += amount;
        
        // Update status
        if (feeStructure.paidAmount >= feeStructure.totalAmount) {
            feeStructure.status = PaymentStatus.Completed;
        } else if (feeStructure.paidAmount > 0) {
            feeStructure.status = PaymentStatus.Partial;
        }
        
        emit PaymentReceived(msg.sender, amount, token, memo);
        
        // Auto-distribute if enabled
        if (autoDistribute && beneficiaries.length > 0) {
            _distributeFunds(token, amount);
        }
    }
    
    /**
     * @notice Distribute collected funds to beneficiaries
     * @param token The token to distribute
     * @param amount The amount to distribute
     */
    function distributeFunds(address token, uint256 amount) 
        external 
        onlyGuardian 
        validToken(token) 
    {
        _distributeFunds(token, amount);
    }
    
    /**
     * @notice Add a new beneficiary
     * @param beneficiary The beneficiary's wallet address
     * @param percentage The percentage allocation (basis points)
     * @param role The beneficiary's role description
     */
    function addBeneficiary(
        address payable beneficiary,
        uint256 percentage,
        string calldata role
    ) external onlyGuardian {
        if (beneficiary == address(0)) revert InvalidBeneficiary();
        if (percentage == 0 || percentage > 10000) revert InvalidPercentage();
        
        // Check total percentage doesn't exceed 100%
        uint256 totalPercentage = percentage;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i].active) {
                totalPercentage += beneficiaries[i].percentage;
            }
        }
        if (totalPercentage > 10000) revert InvalidPercentage();
        
        beneficiaries.push(Beneficiary({
            wallet: beneficiary,
            percentage: percentage,
            role: role,
            active: true
        }));
        
        beneficiaryIndex[beneficiary] = beneficiaries.length - 1;
        
        emit BeneficiaryAdded(beneficiary, percentage, role);
    }
    
    /**
     * @notice Update beneficiary allocation
     * @param beneficiary The beneficiary to update
     * @param newPercentage New percentage allocation
     * @param active Whether the beneficiary is active
     */
    function updateBeneficiary(
        address beneficiary,
        uint256 newPercentage,
        bool active
    ) external onlyGuardian {
        uint256 index = beneficiaryIndex[beneficiary];
        if (index >= beneficiaries.length || beneficiaries[index].wallet != beneficiary) {
            revert InvalidBeneficiary();
        }
        
        beneficiaries[index].percentage = newPercentage;
        beneficiaries[index].active = active;
        
        emit BeneficiaryUpdated(beneficiary, newPercentage, active);
    }
    
    /**
     * @notice Apply late fees if payment is overdue
     */
    function applyLateFees() external {
        if (block.timestamp <= feeStructure.dueDate + gracePeriod) {
            return; // Not yet overdue
        }
        
        if (feeStructure.status == PaymentStatus.Completed) {
            return; // Already paid
        }
        
        uint256 remainingAmount = feeStructure.totalAmount - feeStructure.paidAmount;
        uint256 lateFee = (remainingAmount * feeStructure.lateFeeRate) / 10000;
        
        feeStructure.totalAmount += lateFee;
        feeStructure.status = PaymentStatus.Overdue;
        
        emit LateFeeApplied(lateFee, feeStructure.totalAmount);
    }
    
    /**
     * @notice Set accepted payment tokens
     * @param token The token address
     * @param accepted Whether the token is accepted
     */
    function setAcceptedToken(address token, bool accepted) external onlyGuardian {
        acceptedTokens[token] = accepted;
    }
    
    /**
     * @notice Update fee structure
     * @param newTotalAmount New total amount
     * @param newInstallments New number of installments
     * @param newDueDate New due date
     */
    function updateFeeStructure(
        uint256 newTotalAmount,
        uint256 newInstallments,
        uint256 newDueDate
    ) external onlyGuardian {
        if (feeStructure.paidAmount > newTotalAmount) revert InvalidAmount();
        
        feeStructure.totalAmount = newTotalAmount;
        feeStructure.installments = newInstallments;
        feeStructure.installmentAmount = newInstallments > 0 ? newTotalAmount / newInstallments : newTotalAmount;
        feeStructure.dueDate = newDueDate;
        feeStructure.allowPartialPayments = newInstallments > 0;
        
        emit FeeStructureUpdated(newTotalAmount, newInstallments, newDueDate);
    }
    
    /**
     * @notice Set auto-distribution preference
     * @param enabled Whether to automatically distribute payments
     */
    function setAutoDistribute(bool enabled) external onlyGuardian {
        autoDistribute = enabled;
    }
    
    // View functions
    
    /**
     * @notice Get remaining amount to be paid including any late fees
     * @return remaining The remaining amount
     */
    function getRemainingAmount() public view returns (uint256 remaining) {
        return feeStructure.totalAmount - feeStructure.paidAmount;
    }
    
    /**
     * @notice Get payment progress percentage
     * @return percentage The payment progress (basis points)
     */
    function getPaymentProgress() external view returns (uint256 percentage) {
        if (feeStructure.totalAmount == 0) return 0;
        return (feeStructure.paidAmount * 10000) / feeStructure.totalAmount;
    }
    
    /**
     * @notice Check if payment is overdue
     * @return overdue Whether the payment is overdue
     */
    function isOverdue() external view returns (bool overdue) {
        return block.timestamp > feeStructure.dueDate + gracePeriod &&
               feeStructure.status != PaymentStatus.Completed;
    }
    
    /**
     * @notice Get payment history
     * @return payments Array of payment records
     */
    function getPaymentHistory() external view returns (PaymentRecord[] memory payments) {
        return paymentHistory;
    }
    
    /**
     * @notice Get all beneficiaries
     * @return beneficiaryList Array of beneficiaries
     */
    function getBeneficiaries() external view returns (Beneficiary[] memory beneficiaryList) {
        return beneficiaries;
    }
    
    /**
     * @notice Get contract balance for a token
     * @param token The token address (address(0) for ETH)
     * @return balance The contract balance
     */
    function getBalance(address token) external view returns (uint256 balance) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }
    
    // Internal functions
    
    /**
     * @notice Internal function to distribute funds to beneficiaries
     * @param token The token to distribute
     * @param amount The amount to distribute
     */
    function _distributeFunds(address token, uint256 amount) internal {
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (!beneficiaries[i].active) continue;
            
            uint256 beneficiaryAmount = (amount * beneficiaries[i].percentage) / 10000;
            if (beneficiaryAmount == 0) continue;
            
            if (token == address(0)) {
                // ETH distribution
                (bool success, ) = beneficiaries[i].wallet.call{value: beneficiaryAmount}("");
                if (!success) revert DistributionFailed();
            } else {
                // ERC20 distribution
                IERC20(token).safeTransfer(beneficiaries[i].wallet, beneficiaryAmount);
            }
            
            totalDistributed += beneficiaryAmount;
            emit PaymentDistributed(beneficiaries[i].wallet, beneficiaryAmount, token);
        }
    }
    
    /**
     * @notice Emergency withdrawal function (guardian only)
     * @param token The token to withdraw (address(0) for ETH)
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyGuardian {
        if (token == address(0)) {
            if (amount > address(this).balance) revert InsufficientBalance();
            (bool success, ) = guardian.call{value: amount}("");
            if (!success) revert DistributionFailed();
        } else {
            IERC20(token).safeTransfer(guardian, amount);
        }
    }
}
