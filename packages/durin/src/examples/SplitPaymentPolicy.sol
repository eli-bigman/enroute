// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SplitPaymentPolicy
 * @notice Policy contract for splitting payments among multiple recipients with flexible rules
 * @dev Supports percentage-based splits, fixed amounts, tiered distributions, and conditional payments
 */
contract SplitPaymentPolicy is Initializable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    
    // Split type enumeration
    enum SplitType {
        Percentage,     // Split by percentage
        FixedAmount,    // Fixed amount per recipient
        Tiered,         // Different percentages based on amount ranges
        Conditional     // Split based on conditions
    }
    
    // Split rule structure
    struct SplitRule {
        address payable recipient;
        uint256 percentage;    // Basis points (10000 = 100%)
        uint256 fixedAmount;   // Fixed amount (used for FixedAmount type)
        uint256 minAmount;     // Minimum amount to trigger this split
        uint256 maxAmount;     // Maximum amount for this split (0 = no max)
        bool active;
        string label;          // Description of the recipient
        bytes32 condition;     // Condition hash for conditional splits
    }
    
    // Tier structure for tiered splits
    struct Tier {
        uint256 threshold;     // Amount threshold
        uint256 percentage;    // Percentage for this tier
        bool active;
    }
    
    // Payment record
    struct Payment {
        uint256 totalAmount;
        uint256 timestamp;
        address payer;
        address token;
        SplitType splitType;
        uint256 splitCount;    // Number of recipients that received funds
        string memo;
    }
    
    // Split distribution record
    struct Distribution {
        address recipient;
        uint256 amount;
        uint256 paymentIndex;
        uint256 timestamp;
        address token;
    }
    
    // State variables
    address public owner;
    address public manager; // Can update splits but not withdraw
    string public policyName;
    string public description;
    
    // Split configuration
    SplitType public defaultSplitType;
    SplitRule[] public splitRules;
    mapping(address => uint256) public recipientIndex; // recipient => index in splitRules
    
    // Tiered splits
    Tier[] public tiers;
    mapping(uint256 => uint256) public tierPercentages; // tier index => percentage
    
    // Payment tracking
    Payment[] public payments;
    Distribution[] public distributions;
    
    // Balances and limits
    mapping(address => uint256) public totalReceived; // token => total amount received
    mapping(address => mapping(address => uint256)) public recipientBalances; // recipient => token => balance
    mapping(address => bool) public acceptedTokens;
    
    // Settings
    uint256 public minimumPayment;
    uint256 public maximumPayment; // 0 = no limit
    bool public autoDistribute;
    uint256 public distributionGas; // Gas limit for distributions
    address public fallbackRecipient; // Receives remainder if splits don't add to 100%
    
    // Fees
    uint256 public processingFee; // Basis points
    address public feeRecipient;
    
    // Events
    event PaymentReceived(
        uint256 indexed paymentIndex,
        address indexed payer,
        uint256 totalAmount,
        address token,
        SplitType splitType
    );
    
    event PaymentDistributed(
        uint256 indexed paymentIndex,
        address indexed recipient,
        uint256 amount,
        address token,
        string label
    );
    
    event SplitRuleAdded(
        address indexed recipient,
        uint256 percentage,
        uint256 fixedAmount,
        string label
    );
    
    event SplitRuleUpdated(
        address indexed recipient,
        uint256 newPercentage,
        uint256 newFixedAmount,
        bool active
    );
    
    event TierAdded(uint256 threshold, uint256 percentage);
    event TierUpdated(uint256 indexed tierIndex, uint256 newThreshold, uint256 newPercentage);
    
    event SettingsUpdated(
        uint256 minimumPayment,
        uint256 maximumPayment,
        bool autoDistribute
    );
    
    // Errors
    error Unauthorized();
    error InvalidAmount();
    error InvalidSplitRule();
    error PaymentTooSmall();
    error PaymentTooLarge();
    error TokenNotAccepted();
    error DistributionFailed();
    error InvalidPercentage();
    error RecipientAlreadyExists();
    error RecipientNotFound();
    error InsufficientBalance();
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    modifier onlyOwnerOrManager() {
        if (msg.sender != owner && msg.sender != manager) revert Unauthorized();
        _;
    }
    
    modifier validToken(address token) {
        if (token != address(0) && !acceptedTokens[token]) revert TokenNotAccepted();
        _;
    }
    
    modifier validAmount(uint256 amount) {
        if (amount < minimumPayment) revert PaymentTooSmall();
        if (maximumPayment > 0 && amount > maximumPayment) revert PaymentTooLarge();
        _;
    }
    
    /**
     * @notice Initialize the split payment policy contract
     * @param _owner The owner's wallet address
     * @param _manager The manager's wallet address (can be same as owner)
     * @param _policyName The name of this split payment policy
     * @param _description Description of the split purpose
     * @param _defaultSplitType The default split type to use
     */
    function initialize(
        address _owner,
        address _manager,
        string memory _policyName,
        string memory _description,
        SplitType _defaultSplitType
    ) external initializer {
        __ReentrancyGuard_init();
        
        owner = _owner;
        manager = _manager;
        policyName = _policyName;
        description = _description;
        defaultSplitType = _defaultSplitType;
        
        minimumPayment = 0.001 ether; // Default minimum
        autoDistribute = true;
        distributionGas = 200000; // Default gas limit per distribution
        processingFee = 0; // No default fee
    }
    
    /**
     * @notice Make a payment to be split among recipients
     * @param token The token address (address(0) for ETH)
     * @param amount The payment amount
     * @param splitType The split type to use for this payment
     * @param memo Payment reference/memo
     */
    function makePayment(
        address token,
        uint256 amount,
        SplitType splitType,
        string calldata memo
    ) external payable validToken(token) validAmount(amount) nonReentrant {
        // Handle payment transfer
        if (token == address(0)) {
            if (msg.value != amount) revert InvalidAmount();
        } else {
            if (msg.value != 0) revert InvalidAmount();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Deduct processing fee if applicable
        uint256 distributionAmount = amount;
        if (processingFee > 0 && feeRecipient != address(0)) {
            uint256 fee = (amount * processingFee) / 10000;
            distributionAmount = amount - fee;
            
            // Transfer fee
            if (token == address(0)) {
                (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
            } else {
                IERC20(token).safeTransfer(feeRecipient, fee);
            }
        }
        
        // Record payment
        uint256 paymentIndex = payments.length;
        payments.push(Payment({
            totalAmount: amount,
            timestamp: block.timestamp,
            payer: msg.sender,
            token: token,
            splitType: splitType,
            splitCount: 0,
            memo: memo
        }));
        
        totalReceived[token] += amount;
        
        emit PaymentReceived(paymentIndex, msg.sender, amount, token, splitType);
        
        // Auto-distribute if enabled
        if (autoDistribute) {
            _distributePayment(paymentIndex, distributionAmount, token, splitType);
        }
    }
    
    /**
     * @notice Manually distribute a payment
     * @param paymentIndex The payment index to distribute
     */
    function distributePayment(uint256 paymentIndex) external onlyOwnerOrManager {
        require(paymentIndex < payments.length, "Invalid payment index");
        
        Payment storage payment = payments[paymentIndex];
        require(payment.splitCount == 0, "Payment already distributed");
        
        uint256 distributionAmount = payment.totalAmount;
        
        // Deduct processing fee if not already deducted
        if (processingFee > 0 && feeRecipient != address(0)) {
            uint256 fee = (payment.totalAmount * processingFee) / 10000;
            distributionAmount = payment.totalAmount - fee;
        }
        
        _distributePayment(paymentIndex, distributionAmount, payment.token, payment.splitType);
    }
    
    /**
     * @notice Add a new split rule
     * @param recipient The recipient address
     * @param percentage The percentage (basis points)
     * @param fixedAmount The fixed amount (for FixedAmount type)
     * @param minAmount Minimum payment amount to trigger this split
     * @param maxAmount Maximum payment amount for this split
     * @param label Description of the recipient
     */
    function addSplitRule(
        address payable recipient,
        uint256 percentage,
        uint256 fixedAmount,
        uint256 minAmount,
        uint256 maxAmount,
        string calldata label
    ) external onlyOwnerOrManager {
        if (recipient == address(0)) revert InvalidSplitRule();
        if (percentage > 10000) revert InvalidPercentage();
        
        // Check if recipient already exists
        if (recipientIndex[recipient] != 0 || (splitRules.length > 0 && splitRules[0].recipient == recipient)) {
            revert RecipientAlreadyExists();
        }
        
        splitRules.push(SplitRule({
            recipient: recipient,
            percentage: percentage,
            fixedAmount: fixedAmount,
            minAmount: minAmount,
            maxAmount: maxAmount,
            active: true,
            label: label,
            condition: bytes32(0)
        }));
        
        recipientIndex[recipient] = splitRules.length - 1;
        
        emit SplitRuleAdded(recipient, percentage, fixedAmount, label);
    }
    
    /**
     * @notice Update an existing split rule
     * @param recipient The recipient to update
     * @param newPercentage New percentage
     * @param newFixedAmount New fixed amount
     * @param active Whether the rule is active
     */
    function updateSplitRule(
        address recipient,
        uint256 newPercentage,
        uint256 newFixedAmount,
        bool active
    ) external onlyOwnerOrManager {
        uint256 index = recipientIndex[recipient];
        if (index >= splitRules.length || splitRules[index].recipient != recipient) {
            revert RecipientNotFound();
        }
        
        if (newPercentage > 10000) revert InvalidPercentage();
        
        splitRules[index].percentage = newPercentage;
        splitRules[index].fixedAmount = newFixedAmount;
        splitRules[index].active = active;
        
        emit SplitRuleUpdated(recipient, newPercentage, newFixedAmount, active);
    }
    
    /**
     * @notice Add a tier for tiered splits
     * @param threshold The amount threshold for this tier
     * @param percentage The percentage for this tier
     */
    function addTier(uint256 threshold, uint256 percentage) external onlyOwnerOrManager {
        if (percentage > 10000) revert InvalidPercentage();
        
        tiers.push(Tier({
            threshold: threshold,
            percentage: percentage,
            active: true
        }));
        
        emit TierAdded(threshold, percentage);
    }
    
    /**
     * @notice Update a tier
     * @param tierIndex The tier index to update
     * @param newThreshold New threshold
     * @param newPercentage New percentage
     * @param active Whether the tier is active
     */
    function updateTier(
        uint256 tierIndex,
        uint256 newThreshold,
        uint256 newPercentage,
        bool active
    ) external onlyOwnerOrManager {
        require(tierIndex < tiers.length, "Invalid tier index");
        if (newPercentage > 10000) revert InvalidPercentage();
        
        tiers[tierIndex].threshold = newThreshold;
        tiers[tierIndex].percentage = newPercentage;
        tiers[tierIndex].active = active;
        
        emit TierUpdated(tierIndex, newThreshold, newPercentage);
    }
    
    /**
     * @notice Set payment limits and auto-distribute setting
     * @param _minimumPayment Minimum payment amount
     * @param _maximumPayment Maximum payment amount (0 = no limit)
     * @param _autoDistribute Whether to auto-distribute payments
     */
    function updateSettings(
        uint256 _minimumPayment,
        uint256 _maximumPayment,
        bool _autoDistribute
    ) external onlyOwnerOrManager {
        minimumPayment = _minimumPayment;
        maximumPayment = _maximumPayment;
        autoDistribute = _autoDistribute;
        
        emit SettingsUpdated(_minimumPayment, _maximumPayment, _autoDistribute);
    }
    
    /**
     * @notice Set fallback recipient for remainder amounts
     * @param _fallbackRecipient The fallback recipient address
     */
    function setFallbackRecipient(address _fallbackRecipient) external onlyOwner {
        fallbackRecipient = _fallbackRecipient;
    }
    
    /**
     * @notice Set processing fee
     * @param _processingFee The processing fee in basis points
     * @param _feeRecipient The fee recipient address
     */
    function setProcessingFee(uint256 _processingFee, address _feeRecipient) external onlyOwner {
        if (_processingFee > 1000) revert InvalidPercentage(); // Max 10% fee
        processingFee = _processingFee;
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice Set accepted payment tokens
     * @param token The token address
     * @param accepted Whether the token is accepted
     */
    function setAcceptedToken(address token, bool accepted) external onlyOwnerOrManager {
        acceptedTokens[token] = accepted;
    }
    
    // View functions
    
    /**
     * @notice Get split rules
     * @return rules Array of split rules
     */
    function getSplitRules() external view returns (SplitRule[] memory rules) {
        return splitRules;
    }
    
    /**
     * @notice Get active split rules
     * @return activeRules Array of active split rules
     */
    function getActiveSplitRules() external view returns (SplitRule[] memory activeRules) {
        uint256 activeCount = 0;
        
        // Count active rules
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (splitRules[i].active) {
                activeCount++;
            }
        }
        
        // Create array of active rules
        activeRules = new SplitRule[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (splitRules[i].active) {
                activeRules[index] = splitRules[i];
                index++;
            }
        }
        
        return activeRules;
    }
    
    /**
     * @notice Get payment history
     * @return paymentHistory Array of payments
     */
    function getPaymentHistory() external view returns (Payment[] memory paymentHistory) {
        return payments;
    }
    
    /**
     * @notice Get distribution history
     * @return distributionHistory Array of distributions
     */
    function getDistributionHistory() external view returns (Distribution[] memory distributionHistory) {
        return distributions;
    }
    
    /**
     * @notice Get tiers
     * @return tierList Array of tiers
     */
    function getTiers() external view returns (Tier[] memory tierList) {
        return tiers;
    }
    
    /**
     * @notice Calculate split amounts for a given payment
     * @param amount The payment amount
     * @param splitType The split type to use
     * @return recipients Array of recipient addresses
     * @return amounts Array of amounts for each recipient
     */
    function calculateSplit(uint256 amount, SplitType splitType) 
        external 
        view 
        returns (address[] memory recipients, uint256[] memory amounts) 
    {
        return _calculateSplit(amount, splitType);
    }
    
    /**
     * @notice Get recipient balance for a token
     * @param recipient The recipient address
     * @param token The token address
     * @return balance The recipient's balance
     */
    function getRecipientBalance(address recipient, address token) external view returns (uint256 balance) {
        return recipientBalances[recipient][token];
    }
    
    // Internal functions
    
    /**
     * @notice Internal function to distribute a payment
     * @param paymentIndex The payment index
     * @param amount The amount to distribute
     * @param token The token address
     * @param splitType The split type
     */
    function _distributePayment(
        uint256 paymentIndex,
        uint256 amount,
        address token,
        SplitType splitType
    ) internal {
        (address[] memory recipients, uint256[] memory amounts) = _calculateSplit(amount, splitType);
        
        uint256 totalDistributed = 0;
        uint256 splitCount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (amounts[i] == 0) continue;
            
            address recipient = recipients[i];
            uint256 recipientAmount = amounts[i];
            
            // Transfer to recipient
            bool success = false;
            if (token == address(0)) {
                (success, ) = recipient.call{value: recipientAmount, gas: distributionGas}("");
            } else {
                try IERC20(token).transfer(recipient, recipientAmount) {
                    success = true;
                } catch {
                    success = false;
                }
            }
            
            if (success) {
                recipientBalances[recipient][token] += recipientAmount;
                totalDistributed += recipientAmount;
                splitCount++;
                
                // Record distribution
                distributions.push(Distribution({
                    recipient: recipient,
                    amount: recipientAmount,
                    paymentIndex: paymentIndex,
                    timestamp: block.timestamp,
                    token: token
                }));
                
                // Find recipient label
                string memory label = "";
                for (uint256 j = 0; j < splitRules.length; j++) {
                    if (splitRules[j].recipient == recipient) {
                        label = splitRules[j].label;
                        break;
                    }
                }
                
                emit PaymentDistributed(paymentIndex, recipient, recipientAmount, token, label);
            }
        }
        
        // Handle remainder
        uint256 remainder = amount - totalDistributed;
        if (remainder > 0 && fallbackRecipient != address(0)) {
            if (token == address(0)) {
                (bool success, ) = fallbackRecipient.call{value: remainder}("");
                require(success, "Remainder transfer failed");
            } else {
                IERC20(token).safeTransfer(fallbackRecipient, remainder);
            }
            
            recipientBalances[fallbackRecipient][token] += remainder;
        }
        
        // Update payment record
        payments[paymentIndex].splitCount = splitCount;
    }
    
    /**
     * @notice Calculate split amounts for a payment
     * @param amount The payment amount
     * @param splitType The split type
     * @return recipients Array of recipient addresses
     * @return amounts Array of amounts for each recipient
     */
    function _calculateSplit(uint256 amount, SplitType splitType) 
        internal 
        view 
        returns (address[] memory recipients, uint256[] memory amounts) 
    {
        if (splitType == SplitType.Percentage) {
            return _calculatePercentageSplit(amount);
        } else if (splitType == SplitType.FixedAmount) {
            return _calculateFixedAmountSplit(amount);
        } else if (splitType == SplitType.Tiered) {
            return _calculateTieredSplit(amount);
        } else {
            // Default to percentage split
            return _calculatePercentageSplit(amount);
        }
    }
    
    /**
     * @notice Calculate percentage-based split
     * @param amount The payment amount
     * @return recipients Array of recipient addresses
     * @return amounts Array of amounts for each recipient
     */
    function _calculatePercentageSplit(uint256 amount) 
        internal 
        view 
        returns (address[] memory recipients, uint256[] memory amounts) 
    {
        uint256 activeCount = 0;
        
        // Count active rules that apply to this amount
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (_isRuleApplicable(splitRules[i], amount)) {
                activeCount++;
            }
        }
        
        recipients = new address[](activeCount);
        amounts = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (_isRuleApplicable(splitRules[i], amount)) {
                recipients[index] = splitRules[i].recipient;
                amounts[index] = (amount * splitRules[i].percentage) / 10000;
                index++;
            }
        }
        
        return (recipients, amounts);
    }
    
    /**
     * @notice Calculate fixed amount split
     * @param amount The payment amount
     * @return recipients Array of recipient addresses
     * @return amounts Array of amounts for each recipient
     */
    function _calculateFixedAmountSplit(uint256 amount) 
        internal 
        view 
        returns (address[] memory recipients, uint256[] memory amounts) 
    {
        uint256 activeCount = 0;
        uint256 totalFixedAmount = 0;
        
        // Count active rules and calculate total fixed amount
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (_isRuleApplicable(splitRules[i], amount)) {
                activeCount++;
                totalFixedAmount += splitRules[i].fixedAmount;
            }
        }
        
        // If total fixed amount exceeds payment, fall back to percentage split
        if (totalFixedAmount > amount) {
            return _calculatePercentageSplit(amount);
        }
        
        recipients = new address[](activeCount);
        amounts = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (_isRuleApplicable(splitRules[i], amount)) {
                recipients[index] = splitRules[i].recipient;
                amounts[index] = splitRules[i].fixedAmount;
                index++;
            }
        }
        
        return (recipients, amounts);
    }
    
    /**
     * @notice Calculate tiered split based on payment amount
     * @param amount The payment amount
     * @return recipients Array of recipient addresses
     * @return amounts Array of amounts for each recipient
     */
    function _calculateTieredSplit(uint256 amount) 
        internal 
        view 
        returns (address[] memory recipients, uint256[] memory amounts) 
    {
        // Find applicable tier
        uint256 applicableTierPercentage = 0;
        
        for (uint256 i = 0; i < tiers.length; i++) {
            if (tiers[i].active && amount >= tiers[i].threshold) {
                applicableTierPercentage = tiers[i].percentage;
            }
        }
        
        // If no tier applies, use default percentage split
        if (applicableTierPercentage == 0) {
            return _calculatePercentageSplit(amount);
        }
        
        // Apply tier percentage to active rules
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (_isRuleApplicable(splitRules[i], amount)) {
                activeCount++;
            }
        }
        
        recipients = new address[](activeCount);
        amounts = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < splitRules.length; i++) {
            if (_isRuleApplicable(splitRules[i], amount)) {
                recipients[index] = splitRules[i].recipient;
                // Apply tier percentage to rule percentage
                amounts[index] = (amount * splitRules[i].percentage * applicableTierPercentage) / (10000 * 10000);
                index++;
            }
        }
        
        return (recipients, amounts);
    }
    
    /**
     * @notice Check if a split rule is applicable for a given amount
     * @param rule The split rule
     * @param amount The payment amount
     * @return applicable Whether the rule applies
     */
    function _isRuleApplicable(SplitRule memory rule, uint256 amount) internal pure returns (bool applicable) {
        if (!rule.active) return false;
        if (amount < rule.minAmount) return false;
        if (rule.maxAmount > 0 && amount > rule.maxAmount) return false;
        return true;
    }
    
    /**
     * @notice Emergency withdrawal function (owner only)
     * @param token The token to withdraw (address(0) for ETH)
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            if (amount > address(this).balance) revert InsufficientBalance();
            (bool success, ) = owner.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner, amount);
        }
    }
}
