// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EnRouteRegistry} from "./EnRouteRegistry.sol";

/**
 * @title PolicyFactory
 * @notice Factory contract for creating standardized policy contracts
 * @dev Creates clones of policy templates for users through EnRouteRegistry integration
 */
contract PolicyFactory is Ownable, ReentrancyGuard {
    
    // Policy template types
    enum PolicyType {
        SchoolFees,
        Savings,
        SplitPayment,
        Custom
    }
    
    // Policy template information
    struct PolicyTemplate {
        address implementation;
        string name;
        string description;
        bool active;
        uint256 creationFee;
    }
    
    // Policy instance information
    struct PolicyInstance {
        address policyContract;
        address owner;
        PolicyType policyType;
        string name;
        uint256 createdAt;
        bool active;
    }
    
    // State variables
    EnRouteRegistry public immutable enRouteRegistry;
    
    // Policy templates mapping
    mapping(PolicyType => PolicyTemplate) public policyTemplates;
    
    // Policy instances tracking
    mapping(address => PolicyInstance[]) public userPolicies;
    mapping(address => PolicyInstance) public policyInstances;
    
    // Policy creation fees
    uint256 public defaultCreationFee = 0.001 ether;
    address public feeRecipient;
    
    // Events
    event PolicyTemplateAdded(
        PolicyType indexed policyType,
        address indexed implementation,
        string name,
        uint256 creationFee
    );
    
    event PolicyTemplateUpdated(
        PolicyType indexed policyType,
        address indexed newImplementation,
        uint256 newCreationFee
    );
    
    event PolicyCreated(
        address indexed owner,
        address indexed policyContract,
        PolicyType indexed policyType,
        string policyName,
        string username
    );
    
    event PolicyDeactivated(
        address indexed policyContract,
        address indexed owner
    );
    
    event CreationFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    
    // Errors
    error PolicyTemplateNotFound();
    error PolicyTemplateInactive();
    error InsufficientFee();
    error PolicyNotFound();
    error UnauthorizedAccess();
    error InvalidTemplate();
    error UserNotRegistered();
    
    // Modifiers
    modifier onlyPolicyOwner(address policyContract) {
        require(
            policyInstances[policyContract].owner == msg.sender,
            "PolicyFactory: Not policy owner"
        );
        _;
    }
    
    modifier validPolicyType(PolicyType policyType) {
        require(
            policyTemplates[policyType].active && 
            policyTemplates[policyType].implementation != address(0),
            "PolicyFactory: Invalid or inactive policy type"
        );
        _;
    }
    
    constructor(
        address _enRouteRegistry,
        address _feeRecipient,
        address _owner
    ) Ownable(_owner) {
        enRouteRegistry = EnRouteRegistry(_enRouteRegistry);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice Create a new policy contract for a user
     * @param policyType The type of policy to create
     * @param policyName The name for the policy (e.g., "schoolfees", "savings")
     * @param initData Initialization data for the policy contract
     * @return policyContract The address of the created policy contract
     */
    function createPolicy(
        PolicyType policyType,
        string calldata policyName,
        bytes calldata initData
    ) 
        external 
        payable 
        validPolicyType(policyType)
        nonReentrant
        returns (address policyContract) 
    {
        // Check if user is registered in EnRouteRegistry
        bytes32 userNode = enRouteRegistry.getUserNode(msg.sender);
        if (userNode == 0) {
            revert UserNotRegistered();
        }
        
        PolicyTemplate memory template = policyTemplates[policyType];
        
        // Check creation fee
        uint256 requiredFee = template.creationFee > 0 ? template.creationFee : defaultCreationFee;
        if (msg.value < requiredFee) {
            revert InsufficientFee();
        }
        
        // Clone the policy template
        policyContract = Clones.clone(template.implementation);
        
        // Initialize the policy contract
        (bool success, ) = policyContract.call(initData);
        require(success, "PolicyFactory: Policy initialization failed");
        
        // Store policy instance
        PolicyInstance memory instance = PolicyInstance({
            policyContract: policyContract,
            owner: msg.sender,
            policyType: policyType,
            name: policyName,
            createdAt: block.timestamp,
            active: true
        });
        
        policyInstances[policyContract] = instance;
        userPolicies[msg.sender].push(instance);
        
        // Register policy in EnRouteRegistry
        enRouteRegistry.createPolicyFor(msg.sender, policyName, policyContract);
        
        // Transfer fee to recipient
        if (msg.value > 0 && feeRecipient != address(0)) {
            (bool feeSuccess, ) = feeRecipient.call{value: msg.value}("");
            require(feeSuccess, "PolicyFactory: Fee transfer failed");
        }
        
        emit PolicyCreated(
            msg.sender,
            policyContract,
            policyType,
            policyName,
            enRouteRegistry.getUsernameByAddress(msg.sender)
        );
        
        return policyContract;
    }
    
    /**
     * @notice Deactivate a policy contract
     * @param policyContract The address of the policy to deactivate
     */
    function deactivatePolicy(address policyContract) 
        external 
        onlyPolicyOwner(policyContract) 
    {
        policyInstances[policyContract].active = false;
        emit PolicyDeactivated(policyContract, msg.sender);
    }
    
    /**
     * @notice Get user's policy contracts
     * @param user The user's address
     * @return policies Array of user's policy instances
     */
    function getUserPolicies(address user) 
        external 
        view 
        returns (PolicyInstance[] memory policies) 
    {
        return userPolicies[user];
    }
    
    /**
     * @notice Get active policy contracts for a user
     * @param user The user's address
     * @return activePolicies Array of active policy instances
     */
    function getActivePolicies(address user) 
        external 
        view 
        returns (PolicyInstance[] memory activePolicies) 
    {
        PolicyInstance[] memory allPolicies = userPolicies[user];
        uint256 activeCount = 0;
        
        // Count active policies
        for (uint256 i = 0; i < allPolicies.length; i++) {
            if (allPolicies[i].active) {
                activeCount++;
            }
        }
        
        // Create array of active policies
        activePolicies = new PolicyInstance[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPolicies.length; i++) {
            if (allPolicies[i].active) {
                activePolicies[index] = allPolicies[i];
                index++;
            }
        }
        
        return activePolicies;
    }
    
    /**
     * @notice Get policy instance details
     * @param policyContract The policy contract address
     * @return instance The policy instance information
     */
    function getPolicyInstance(address policyContract) 
        external 
        view 
        returns (PolicyInstance memory instance) 
    {
        return policyInstances[policyContract];
    }
    
    /**
     * @notice Check if a policy contract exists and is active
     * @param policyContract The policy contract address
     * @return exists Whether the policy exists and is active
     */
    function isPolicyActive(address policyContract) 
        external 
        view 
        returns (bool exists) 
    {
        return policyInstances[policyContract].active;
    }
    
    /**
     * @notice Get creation fee for a policy type
     * @param policyType The policy type
     * @return fee The creation fee amount
     */
    function getCreationFee(PolicyType policyType) 
        external 
        view 
        returns (uint256 fee) 
    {
        PolicyTemplate memory template = policyTemplates[policyType];
        return template.creationFee > 0 ? template.creationFee : defaultCreationFee;
    }
    
    // Admin functions
    
    /**
     * @notice Add a new policy template
     * @param policyType The policy type enum
     * @param implementation The implementation contract address
     * @param name The template name
     * @param description The template description
     * @param creationFee The fee for creating this policy type (0 = use default)
     */
    function addPolicyTemplate(
        PolicyType policyType,
        address implementation,
        string calldata name,
        string calldata description,
        uint256 creationFee
    ) external onlyOwner {
        require(implementation != address(0), "PolicyFactory: Invalid implementation");
        
        policyTemplates[policyType] = PolicyTemplate({
            implementation: implementation,
            name: name,
            description: description,
            active: true,
            creationFee: creationFee
        });
        
        emit PolicyTemplateAdded(policyType, implementation, name, creationFee);
    }
    
    /**
     * @notice Update an existing policy template
     * @param policyType The policy type to update
     * @param newImplementation New implementation address (address(0) to keep current)
     * @param newCreationFee New creation fee (type(uint256).max to keep current)
     */
    function updatePolicyTemplate(
        PolicyType policyType,
        address newImplementation,
        uint256 newCreationFee
    ) external onlyOwner {
        PolicyTemplate storage template = policyTemplates[policyType];
        require(template.implementation != address(0), "PolicyFactory: Template not found");
        
        if (newImplementation != address(0)) {
            template.implementation = newImplementation;
        }
        
        if (newCreationFee != type(uint256).max) {
            template.creationFee = newCreationFee;
        }
        
        emit PolicyTemplateUpdated(policyType, template.implementation, template.creationFee);
    }
    
    /**
     * @notice Activate or deactivate a policy template
     * @param policyType The policy type
     * @param active Whether to activate or deactivate
     */
    function setPolicyTemplateActive(
        PolicyType policyType,
        bool active
    ) external onlyOwner {
        require(
            policyTemplates[policyType].implementation != address(0),
            "PolicyFactory: Template not found"
        );
        policyTemplates[policyType].active = active;
    }
    
    /**
     * @notice Set the default creation fee
     * @param newFee The new default creation fee
     */
    function setDefaultCreationFee(uint256 newFee) external onlyOwner {
        defaultCreationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }
    
    /**
     * @notice Set the fee recipient address
     * @param newRecipient The new fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "PolicyFactory: Invalid recipient");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
    
    /**
     * @notice Emergency withdraw function
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = owner().call{value: balance}("");
            require(success, "PolicyFactory: Withdrawal failed");
        }
    }
}
