// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SavingsPolicy
 * @notice Policy contract for automated savings with goals, rewards, and withdrawal restrictions
 * @dev Supports multiple savings goals, time-locked withdrawals, and yield farming integration
 */
contract SavingsPolicy is Initializable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    
    // Savings goal status
    enum GoalStatus {
        Active,
        Completed,
        Cancelled,
        Paused
    }
    
    // Withdrawal restriction types
    enum WithdrawalType {
        Unrestricted,
        TimeLocked,
        GoalBased,
        EmergencyOnly
    }
    
    // Savings goal structure
    struct SavingsGoal {
        string name;
        string description;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        uint256 createdAt;
        GoalStatus status;
        WithdrawalType withdrawalType;
        uint256 minimumContribution;
        bool autoDeposit;
        uint256 autoDepositAmount;
        uint256 autoDepositInterval; // in seconds
        uint256 lastAutoDeposit;
    }
    
    // Contribution record
    struct Contribution {
        uint256 amount;
        uint256 timestamp;
        address contributor;
        address token;
        uint256 goalId;
        bool isAutoDeposit;
    }
    
    // Withdrawal record
    struct Withdrawal {
        uint256 amount;
        uint256 timestamp;
        address recipient;
        address token;
        uint256 goalId;
        string reason;
    }
    
    // Reward configuration
    struct RewardConfig {
        uint256 rate; // Basis points per period
        uint256 period; // Time period in seconds
        address rewardToken;
        bool active;
        uint256 lastRewardTime;
        uint256 totalRewardsEarned;
    }
    
    // State variables
    address public owner;
    address public guardian; // Can access in emergencies
    string public savingsName;
    string public description;
    
    // Goals and contributions
    SavingsGoal[] public savingsGoals;
    Contribution[] public contributions;
    Withdrawal[] public withdrawals;
    
    // Balances per token per goal
    mapping(uint256 => mapping(address => uint256)) public goalBalances; // goalId => token => balance
    mapping(address => uint256) public totalBalances; // token => total balance
    
    // Rewards
    mapping(uint256 => RewardConfig) public goalRewards; // goalId => reward config
    mapping(address => bool) public acceptedTokens;
    
    // Settings
    bool public emergencyMode;
    uint256 public emergencyWithdrawalFee; // Basis points
    address public feeRecipient;
    uint256 public globalWithdrawalDelay; // Global time lock in seconds
    
    // Auto-deposit settings
    mapping(uint256 => bool) public autoDepositEnabled;
    uint256 public lastGlobalAutoDeposit;
    
    // Events
    event GoalCreated(
        uint256 indexed goalId,
        string name,
        uint256 targetAmount,
        uint256 deadline
    );
    
    event ContributionMade(
        uint256 indexed goalId,
        address indexed contributor,
        uint256 amount,
        address token,
        bool isAutoDeposit
    );
    
    event WithdrawalMade(
        uint256 indexed goalId,
        address indexed recipient,
        uint256 amount,
        address token,
        string reason
    );
    
    event GoalCompleted(
        uint256 indexed goalId,
        uint256 finalAmount,
        uint256 completedAt
    );
    
    event RewardEarned(
        uint256 indexed goalId,
        uint256 rewardAmount,
        address rewardToken
    );
    
    event AutoDepositExecuted(
        uint256 indexed goalId,
        uint256 amount,
        address token
    );
    
    event EmergencyModeToggled(bool enabled);
    
    // Errors
    error Unauthorized();
    error InvalidGoal();
    error GoalNotActive();
    error InsufficientBalance();
    error WithdrawalRestricted();
    error InvalidAmount();
    error TokenNotAccepted();
    error GoalAlreadyCompleted();
    error DeadlinePassed();
    error EmergencyModeActive();
    error AutoDepositNotReady();
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    modifier onlyOwnerOrGuardian() {
        if (msg.sender != owner && msg.sender != guardian) revert Unauthorized();
        _;
    }
    
    modifier validGoal(uint256 goalId) {
        if (goalId >= savingsGoals.length) revert InvalidGoal();
        _;
    }
    
    modifier activeGoal(uint256 goalId) {
        if (savingsGoals[goalId].status != GoalStatus.Active) revert GoalNotActive();
        _;
    }
    
    modifier validToken(address token) {
        if (token != address(0) && !acceptedTokens[token]) revert TokenNotAccepted();
        _;
    }
    
    modifier notEmergencyMode() {
        if (emergencyMode) revert EmergencyModeActive();
        _;
    }
    
    /**
     * @notice Initialize the savings policy contract
     * @param _owner The owner's wallet address
     * @param _guardian The guardian's wallet address (for emergencies)
     * @param _savingsName The name of this savings policy
     * @param _description Description of the savings purpose
     */
    function initialize(
        address _owner,
        address _guardian,
        string memory _savingsName,
        string memory _description
    ) external initializer {
        __ReentrancyGuard_init();
        
        owner = _owner;
        guardian = _guardian;
        savingsName = _savingsName;
        description = _description;
        
        emergencyWithdrawalFee = 1000; // 10% default emergency fee
        globalWithdrawalDelay = 7 days; // 7 day default time lock
        feeRecipient = _guardian;
    }
    
    /**
     * @notice Create a new savings goal
     * @param name The goal name
     * @param goalDescription The goal description
     * @param targetAmount The target savings amount
     * @param deadline The goal deadline (0 for no deadline)
     * @param withdrawalType The withdrawal restriction type
     * @param minimumContribution Minimum contribution amount
     */
    function createSavingsGoal(
        string calldata name,
        string calldata goalDescription,
        uint256 targetAmount,
        uint256 deadline,
        WithdrawalType withdrawalType,
        uint256 minimumContribution
    ) external onlyOwner notEmergencyMode returns (uint256 goalId) {
        if (targetAmount == 0) revert InvalidAmount();
        if (deadline > 0 && deadline <= block.timestamp) revert DeadlinePassed();
        
        goalId = savingsGoals.length;
        
        savingsGoals.push(SavingsGoal({
            name: name,
            description: goalDescription,
            targetAmount: targetAmount,
            currentAmount: 0,
            deadline: deadline,
            createdAt: block.timestamp,
            status: GoalStatus.Active,
            withdrawalType: withdrawalType,
            minimumContribution: minimumContribution,
            autoDeposit: false,
            autoDepositAmount: 0,
            autoDepositInterval: 0,
            lastAutoDeposit: 0
        }));
        
        emit GoalCreated(goalId, name, targetAmount, deadline);
        return goalId;
    }
    
    /**
     * @notice Contribute to a savings goal
     * @param goalId The goal ID
     * @param token The token address (address(0) for ETH)
     * @param amount The contribution amount
     */
    function contribute(
        uint256 goalId,
        address token,
        uint256 amount
    ) external payable validGoal(goalId) activeGoal(goalId) validToken(token) nonReentrant {
        SavingsGoal storage goal = savingsGoals[goalId];
        
        if (amount < goal.minimumContribution) revert InvalidAmount();
        if (goal.deadline > 0 && block.timestamp > goal.deadline) revert DeadlinePassed();
        
        // Handle payment transfer
        if (token == address(0)) {
            if (msg.value != amount) revert InvalidAmount();
        } else {
            if (msg.value != 0) revert InvalidAmount();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Update balances
        goalBalances[goalId][token] += amount;
        totalBalances[token] += amount;
        goal.currentAmount += amount;
        
        // Record contribution
        contributions.push(Contribution({
            amount: amount,
            timestamp: block.timestamp,
            contributor: msg.sender,
            token: token,
            goalId: goalId,
            isAutoDeposit: false
        }));
        
        emit ContributionMade(goalId, msg.sender, amount, token, false);
        
        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = GoalStatus.Completed;
            emit GoalCompleted(goalId, goal.currentAmount, block.timestamp);
        }
        
        // Calculate and distribute rewards
        _calculateRewards(goalId);
    }
    
    /**
     * @notice Withdraw from a savings goal
     * @param goalId The goal ID
     * @param token The token address
     * @param amount The withdrawal amount
     * @param reason The reason for withdrawal
     */
    function withdraw(
        uint256 goalId,
        address token,
        uint256 amount,
        string calldata reason
    ) external validGoal(goalId) validToken(token) nonReentrant {
        if (msg.sender != owner && msg.sender != guardian) revert Unauthorized();
        
        SavingsGoal storage goal = savingsGoals[goalId];
        
        // Check withdrawal restrictions
        _checkWithdrawalRestrictions(goalId, amount);
        
        if (goalBalances[goalId][token] < amount) revert InsufficientBalance();
        
        // Calculate withdrawal fee for emergency withdrawals
        uint256 withdrawalAmount = amount;
        uint256 fee = 0;
        
        if (emergencyMode || goal.withdrawalType == WithdrawalType.EmergencyOnly) {
            fee = (amount * emergencyWithdrawalFee) / 10000;
            withdrawalAmount = amount - fee;
        }
        
        // Update balances
        goalBalances[goalId][token] -= amount;
        totalBalances[token] -= amount;
        goal.currentAmount -= amount;
        
        // Transfer funds
        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: withdrawalAmount}("");
            require(success, "ETH transfer failed");
            
            if (fee > 0 && feeRecipient != address(0)) {
                (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
            }
        } else {
            IERC20(token).safeTransfer(msg.sender, withdrawalAmount);
            
            if (fee > 0 && feeRecipient != address(0)) {
                IERC20(token).safeTransfer(feeRecipient, fee);
            }
        }
        
        // Record withdrawal
        withdrawals.push(Withdrawal({
            amount: amount,
            timestamp: block.timestamp,
            recipient: msg.sender,
            token: token,
            goalId: goalId,
            reason: reason
        }));
        
        emit WithdrawalMade(goalId, msg.sender, amount, token, reason);
        
        // Update goal status if empty
        if (goal.currentAmount == 0) {
            goal.status = GoalStatus.Cancelled;
        }
    }
    
    /**
     * @notice Set up auto-deposit for a goal
     * @param goalId The goal ID
     * @param enabled Whether auto-deposit is enabled
     * @param amount The auto-deposit amount
     * @param interval The auto-deposit interval in seconds
     */
    function setupAutoDeposit(
        uint256 goalId,
        bool enabled,
        uint256 amount,
        uint256 interval
    ) external onlyOwner validGoal(goalId) {
        SavingsGoal storage goal = savingsGoals[goalId];
        
        goal.autoDeposit = enabled;
        goal.autoDepositAmount = amount;
        goal.autoDepositInterval = interval;
        goal.lastAutoDeposit = block.timestamp;
        
        autoDepositEnabled[goalId] = enabled;
    }
    
    /**
     * @notice Execute auto-deposit for a goal (callable by anyone)
     * @param goalId The goal ID
     * @param token The token to auto-deposit
     */
    function executeAutoDeposit(
        uint256 goalId,
        address token
    ) external payable validGoal(goalId) validToken(token) nonReentrant {
        SavingsGoal storage goal = savingsGoals[goalId];
        
        if (!goal.autoDeposit || !autoDepositEnabled[goalId]) revert AutoDepositNotReady();
        if (block.timestamp < goal.lastAutoDeposit + goal.autoDepositInterval) revert AutoDepositNotReady();
        if (goal.status != GoalStatus.Active) revert GoalNotActive();
        
        uint256 amount = goal.autoDepositAmount;
        
        // Handle payment transfer (must come from owner)
        if (token == address(0)) {
            if (msg.value != amount) revert InvalidAmount();
        } else {
            if (msg.value != 0) revert InvalidAmount();
            IERC20(token).safeTransferFrom(owner, address(this), amount);
        }
        
        // Update balances
        goalBalances[goalId][token] += amount;
        totalBalances[token] += amount;
        goal.currentAmount += amount;
        goal.lastAutoDeposit = block.timestamp;
        
        // Record contribution
        contributions.push(Contribution({
            amount: amount,
            timestamp: block.timestamp,
            contributor: owner,
            token: token,
            goalId: goalId,
            isAutoDeposit: true
        }));
        
        emit AutoDepositExecuted(goalId, amount, token);
        emit ContributionMade(goalId, owner, amount, token, true);
        
        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = GoalStatus.Completed;
            emit GoalCompleted(goalId, goal.currentAmount, block.timestamp);
        }
    }
    
    /**
     * @notice Set up rewards for a goal
     * @param goalId The goal ID
     * @param rate The reward rate (basis points per period)
     * @param period The reward period in seconds
     * @param rewardToken The reward token address
     */
    function setupRewards(
        uint256 goalId,
        uint256 rate,
        uint256 period,
        address rewardToken
    ) external onlyOwner validGoal(goalId) {
        goalRewards[goalId] = RewardConfig({
            rate: rate,
            period: period,
            rewardToken: rewardToken,
            active: true,
            lastRewardTime: block.timestamp,
            totalRewardsEarned: 0
        });
    }
    
    /**
     * @notice Claim accumulated rewards for a goal
     * @param goalId The goal ID
     */
    function claimRewards(uint256 goalId) external onlyOwner validGoal(goalId) nonReentrant {
        _calculateRewards(goalId);
    }
    
    /**
     * @notice Toggle emergency mode
     * @param enabled Whether emergency mode is enabled
     */
    function toggleEmergencyMode(bool enabled) external onlyOwnerOrGuardian {
        emergencyMode = enabled;
        emit EmergencyModeToggled(enabled);
    }
    
    /**
     * @notice Set accepted payment tokens
     * @param token The token address
     * @param accepted Whether the token is accepted
     */
    function setAcceptedToken(address token, bool accepted) external onlyOwner {
        acceptedTokens[token] = accepted;
    }
    
    // View functions
    
    /**
     * @notice Get savings goal details
     * @param goalId The goal ID
     * @return goal The savings goal
     */
    function getSavingsGoal(uint256 goalId) external view validGoal(goalId) returns (SavingsGoal memory goal) {
        return savingsGoals[goalId];
    }
    
    /**
     * @notice Get total number of goals
     * @return count The number of goals
     */
    function getGoalCount() external view returns (uint256 count) {
        return savingsGoals.length;
    }
    
    /**
     * @notice Get goal progress percentage
     * @param goalId The goal ID
     * @return percentage The progress percentage (basis points)
     */
    function getGoalProgress(uint256 goalId) external view validGoal(goalId) returns (uint256 percentage) {
        SavingsGoal memory goal = savingsGoals[goalId];
        if (goal.targetAmount == 0) return 0;
        return (goal.currentAmount * 10000) / goal.targetAmount;
    }
    
    /**
     * @notice Get contribution history
     * @return contributionHistory Array of contributions
     */
    function getContributionHistory() external view returns (Contribution[] memory contributionHistory) {
        return contributions;
    }
    
    /**
     * @notice Get withdrawal history
     * @return withdrawalHistory Array of withdrawals
     */
    function getWithdrawalHistory() external view returns (Withdrawal[] memory withdrawalHistory) {
        return withdrawals;
    }
    
    /**
     * @notice Get goal balance for a specific token
     * @param goalId The goal ID
     * @param token The token address
     * @return balance The goal balance
     */
    function getGoalBalance(uint256 goalId, address token) external view returns (uint256 balance) {
        return goalBalances[goalId][token];
    }
    
    /**
     * @notice Get total balance for a token
     * @param token The token address
     * @return balance The total balance
     */
    function getTotalBalance(address token) external view returns (uint256 balance) {
        return totalBalances[token];
    }
    
    // Internal functions
    
    /**
     * @notice Check withdrawal restrictions for a goal
     * @param goalId The goal ID
     * @param amount The withdrawal amount
     */
    function _checkWithdrawalRestrictions(uint256 goalId, uint256 amount) internal view {
        SavingsGoal memory goal = savingsGoals[goalId];
        
        if (goal.withdrawalType == WithdrawalType.EmergencyOnly && !emergencyMode) {
            revert WithdrawalRestricted();
        }
        
        if (goal.withdrawalType == WithdrawalType.TimeLocked) {
            if (block.timestamp < goal.createdAt + globalWithdrawalDelay) {
                revert WithdrawalRestricted();
            }
        }
        
        if (goal.withdrawalType == WithdrawalType.GoalBased) {
            if (goal.status != GoalStatus.Completed) {
                revert WithdrawalRestricted();
            }
        }
    }
    
    /**
     * @notice Calculate and distribute rewards for a goal
     * @param goalId The goal ID
     */
    function _calculateRewards(uint256 goalId) internal {
        RewardConfig storage rewardConfig = goalRewards[goalId];
        
        if (!rewardConfig.active || rewardConfig.rewardToken == address(0)) {
            return;
        }
        
        uint256 timePassed = block.timestamp - rewardConfig.lastRewardTime;
        uint256 periods = timePassed / rewardConfig.period;
        
        if (periods == 0) return;
        
        SavingsGoal memory goal = savingsGoals[goalId];
        uint256 rewardAmount = (goal.currentAmount * rewardConfig.rate * periods) / 10000;
        
        if (rewardAmount > 0) {
            // Transfer rewards (assumes contract has reward tokens)
            IERC20(rewardConfig.rewardToken).safeTransfer(owner, rewardAmount);
            
            rewardConfig.totalRewardsEarned += rewardAmount;
            rewardConfig.lastRewardTime = block.timestamp;
            
            emit RewardEarned(goalId, rewardAmount, rewardConfig.rewardToken);
        }
    }
}
