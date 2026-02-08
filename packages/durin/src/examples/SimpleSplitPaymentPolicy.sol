// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title SimpleSplitPaymentPolicy
 * @notice Simple payment splitting contract that automatically distributes funds to multiple recipients
 * @dev Receives payments and immediately distributes them based on percentage splits
 */
contract SimpleSplitPaymentPolicy is Initializable, ReentrancyGuardUpgradeable, IERC721Receiver {
    using SafeERC20 for IERC20;
    
    struct Recipient {
        address payable wallet;
        uint256 percentage; // Basis points (10000 = 100%)
        string label;       // Description like "Main Savings", "Emergency Fund", etc.
    }
    
    // State variables
    address public owner;
    string public policyName;
    string public description;
    
    Recipient[] public recipients;
    mapping(address => uint256) public recipientIndex;
    
    // Payment tracking
    uint256 public totalPayments;
    mapping(address => uint256) public totalReceived; // token => total amount
    mapping(address => mapping(address => uint256)) public recipientTotals; // recipient => token => total
    
    // Events
    event PaymentReceived(
        address indexed sender, 
        uint256 amount, 
        address token,
        uint256 timestamp
    );
    
    event FundsDistributed(
        address indexed recipient, 
        uint256 amount, 
        address token, 
        string label,
        uint256 percentage
    );
    
    event RecipientAdded(
        address indexed recipient, 
        uint256 percentage, 
        string label
    );
    
    event RecipientUpdated(
        address indexed recipient, 
        uint256 oldPercentage,
        uint256 newPercentage
    );
    
    event RecipientRemoved(
        address indexed recipient,
        string label
    );
    
    // Errors
    error Unauthorized();
    error InvalidPercentage();
    error PercentagesDoNotEqual100();
    error RecipientAlreadyExists();
    error RecipientNotFound();
    error NoRecipients();
    error TransferFailed();
    error InvalidAddress();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    /**
     * @notice Initialize the split payment policy
     * @param _owner The policy owner
     * @param _policyName Name of the policy
     * @param _description Description of the policy
     * @param _recipients Array of initial recipients
     * @param _percentages Array of percentages (must total 10000)
     * @param _labels Array of labels for recipients
     */
    function initialize(
        address _owner,
        string memory _policyName,
        string memory _description,
        address[] memory _recipients,
        uint256[] memory _percentages,
        string[] memory _labels
    ) external initializer {
        __ReentrancyGuard_init();
        
        if (_owner == address(0)) revert InvalidAddress();
        
        owner = _owner;
        policyName = _policyName;
        description = _description;
        
        // Add initial recipients if provided
        if (_recipients.length > 0) {
            _addMultipleRecipients(_recipients, _percentages, _labels);
        }
    }
    
    /**
     * @notice Receive ETH and automatically distribute
     */
    receive() external payable {
        if (msg.value > 0) {
            _distributePayment(address(0), msg.value);
        }
    }
    
    /**
     * @notice Make a payment with tokens and distribute
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to distribute
     */
    function makePayment(address token, uint256 amount) external payable nonReentrant {
        if (recipients.length == 0) revert NoRecipients();
        
        // Handle payment transfer
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "Cannot send ETH for token payment");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        _distributePayment(token, amount);
    }
    
    /**
     * @notice Add a new recipient
     * @param recipient Recipient address
     * @param percentage Percentage in basis points (10000 = 100%)
     * @param label Description label
     */
    function addRecipient(
        address payable recipient, 
        uint256 percentage, 
        string calldata label
    ) external onlyOwner {
        if (recipient == address(0)) revert InvalidAddress();
        if (percentage == 0 || percentage > 10000) revert InvalidPercentage();
        
        // Check if recipient already exists
        if (_recipientExists(recipient)) revert RecipientAlreadyExists();
        
        recipients.push(Recipient({
            wallet: recipient,
            percentage: percentage,
            label: label
        }));
        
        recipientIndex[recipient] = recipients.length - 1;
        
        // Validate total percentages
        _validatePercentages();
        
        emit RecipientAdded(recipient, percentage, label);
    }
    
    /**
     * @notice Update recipient percentage
     * @param recipient Recipient to update
     * @param newPercentage New percentage
     */
    function updateRecipient(address recipient, uint256 newPercentage) external onlyOwner {
        if (!_recipientExists(recipient)) revert RecipientNotFound();
        if (newPercentage == 0 || newPercentage > 10000) revert InvalidPercentage();
        
        uint256 index = recipientIndex[recipient];
        uint256 oldPercentage = recipients[index].percentage;
        recipients[index].percentage = newPercentage;
        
        _validatePercentages();
        
        emit RecipientUpdated(recipient, oldPercentage, newPercentage);
    }
    
    /**
     * @notice Remove a recipient
     * @param recipient Recipient to remove
     */
    function removeRecipient(address recipient) external onlyOwner {
        if (!_recipientExists(recipient)) revert RecipientNotFound();
        
        uint256 index = recipientIndex[recipient];
        uint256 lastIndex = recipients.length - 1;
        
        string memory label = recipients[index].label;
        
        // Move last recipient to deleted spot
        if (index != lastIndex) {
            recipients[index] = recipients[lastIndex];
            recipientIndex[recipients[index].wallet] = index;
        }
        
        recipients.pop();
        delete recipientIndex[recipient];
        
        emit RecipientRemoved(recipient, label);
    }
    
    /**
     * @notice Get all recipients
     */
    function getRecipients() external view returns (Recipient[] memory) {
        return recipients;
    }
    
    /**
     * @notice Get recipient count
     */
    function getRecipientCount() external view returns (uint256) {
        return recipients.length;
    }
    
    /**
     * @notice Get recipient by address
     */
    function getRecipient(address recipient) external view returns (Recipient memory) {
        if (!_recipientExists(recipient)) revert RecipientNotFound();
        uint256 index = recipientIndex[recipient];
        return recipients[index];
    }
    
    /**
     * @notice Check if recipient exists
     */
    function recipientExists(address recipient) external view returns (bool) {
        return _recipientExists(recipient);
    }
    
    /**
     * @notice Get total received for a token
     */
    function getTotalReceived(address token) external view returns (uint256) {
        return totalReceived[token];
    }
    
    /**
     * @notice Get total received by a recipient for a token
     */
    function getRecipientTotal(address recipient, address token) external view returns (uint256) {
        return recipientTotals[recipient][token];
    }
    
    // Internal functions
    function _distributePayment(address token, uint256 amount) internal {
        if (recipients.length == 0) return;
        
        totalPayments++;
        totalReceived[token] += amount;
        
        emit PaymentReceived(msg.sender, amount, token, block.timestamp);
        
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            Recipient memory recipient = recipients[i];
            uint256 recipientAmount = (amount * recipient.percentage) / 10000;
            
            if (recipientAmount > 0) {
                // Track totals
                recipientTotals[recipient.wallet][token] += recipientAmount;
                totalDistributed += recipientAmount;
                
                // Transfer funds
                if (token == address(0)) {
                    // ETH transfer
                    (bool success, ) = recipient.wallet.call{value: recipientAmount}("");
                    if (!success) revert TransferFailed();
                } else {
                    // Token transfer
                    IERC20(token).safeTransfer(recipient.wallet, recipientAmount);
                }
                
                emit FundsDistributed(
                    recipient.wallet, 
                    recipientAmount, 
                    token, 
                    recipient.label,
                    recipient.percentage
                );
            }
        }
        
        // Handle any remainder due to rounding (send to first recipient)
        uint256 remainder = amount - totalDistributed;
        if (remainder > 0 && recipients.length > 0) {
            address payable firstRecipient = recipients[0].wallet;
            recipientTotals[firstRecipient][token] += remainder;
            
            if (token == address(0)) {
                (bool success, ) = firstRecipient.call{value: remainder}("");
                if (!success) revert TransferFailed();
            } else {
                IERC20(token).safeTransfer(firstRecipient, remainder);
            }
        }
    }
    
    function _addMultipleRecipients(
        address[] memory _recipients,
        uint256[] memory _percentages,
        string[] memory _labels
    ) internal {
        require(_recipients.length == _percentages.length, "Arrays length mismatch");
        require(_recipients.length == _labels.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            if (_recipients[i] == address(0)) revert InvalidAddress();
            if (_percentages[i] == 0) revert InvalidPercentage();
            
            recipients.push(Recipient({
                wallet: payable(_recipients[i]),
                percentage: _percentages[i],
                label: _labels[i]
            }));
            
            recipientIndex[_recipients[i]] = recipients.length - 1;
            
            emit RecipientAdded(_recipients[i], _percentages[i], _labels[i]);
        }
        
        _validatePercentages();
    }
    
    function _validatePercentages() internal view {
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            totalPercentage += recipients[i].percentage;
        }
        if (totalPercentage != 10000) revert PercentagesDoNotEqual100();
    }
    
    function _recipientExists(address recipient) internal view returns (bool) {
        if (recipients.length == 0) return false;
        uint256 index = recipientIndex[recipient];
        return index < recipients.length && recipients[index].wallet == recipient;
    }
    
    /**
     * @notice Emergency withdrawal function (owner only)
     * @param token Token to withdraw (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = payable(owner).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(owner, amount);
        }
    }
    
    /**
     * @notice Handle the receipt of an NFT
     * @dev Required for receiving ENS NFTs from L2Registry
     */
    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /* tokenId */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
