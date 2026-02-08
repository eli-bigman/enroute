// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IL2Registry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title EnRouteRegistry
 * @notice Registry contract for EnRoute app that interacts with Durin L2Registry
 * @dev Handles automatic subname issuance and policy subname routing for payment contracts
 */
contract EnRouteRegistry is Ownable, ReentrancyGuard {
    using Strings for uint256;

    // The L2Registry instance this contract will interact with
    IL2Registry public immutable l2Registry;
    
    // Base domain node for enrouteapp.eth
    bytes32 public immutable BASE_NODE;

    // Events
    event UserRegistered(
        bytes32 indexed node, 
        address indexed owner, 
        string username, 
        uint256 timestamp
    );
    
    event PolicyCreated(
        bytes32 indexed policyNode, 
        bytes32 indexed userNode,
        address indexed policyContract, 
        string policyName,
        string username
    );
    
    event UsernameUpdated(
        bytes32 indexed node,
        address indexed owner,
        string oldUsername,
        string newUsername
    );

    // Storage
    mapping(address => bytes32) public userNodes;           // user address => their main node
    mapping(bytes32 => address) public policyContracts;    // policy node => contract address
    mapping(bytes32 => string) public usernames;           // node => username
    mapping(string => bool) public usernameExists;         // username => exists
    mapping(bytes32 => string[]) public userPolicies;      // user node => policy names
    mapping(address => bool) public authorizedRegistrars;  // authorized policy creators
    
    // Configuration
    uint256 public maxUsernameLength = 20;
    uint256 public minUsernameLength = 3;
    bool public registrationPaused = false;
    
    // Modifiers
    modifier onlyAuthorized() {
        require(
            owner() == msg.sender || authorizedRegistrars[msg.sender],
            "EnRouteRegistry: Not authorized"
        );
        _;
    }
    
    modifier whenNotPaused() {
        require(!registrationPaused, "EnRouteRegistry: Registration paused");
        _;
    }
    
    modifier validUsername(string calldata username) {
        require(
            bytes(username).length >= minUsernameLength && 
            bytes(username).length <= maxUsernameLength,
            "EnRouteRegistry: Invalid username length"
        );
        require(_isValidUsername(username), "EnRouteRegistry: Invalid username format");
        _;
    }

    constructor(
        address _l2Registry,
        bytes32 _baseNode,
        address _owner
    ) Ownable(_owner) {
        l2Registry = IL2Registry(_l2Registry);
        BASE_NODE = _baseNode; // Node hash for "enrouteapp.eth"
    }

    /**
     * @notice Register a new user automatically when they connect
     * @param username The desired username (e.g., "alice")
     * @param userAddress The user's wallet address
     * @return node The created node hash for username.enrouteapp.eth
     */
    function registerUser(
        string calldata username,
        address userAddress
    ) 
        external 
        onlyAuthorized 
        whenNotPaused 
        validUsername(username)
        nonReentrant
        returns (bytes32 node) 
    {
        require(!usernameExists[username], "EnRouteRegistry: Username already taken");
        require(userNodes[userAddress] == 0, "EnRouteRegistry: User already registered");
        require(userAddress != address(0), "EnRouteRegistry: Invalid address");
        
        // Create subname: alice.enrouteapp.eth using L2Registry's createSubnode
        bytes[] memory data = new bytes[](0); // Empty data array
        node = l2Registry.createSubnode(BASE_NODE, username, userAddress, data);
        
        // Store mappings
        userNodes[userAddress] = node;
        usernames[node] = username;
        usernameExists[username] = true;
        
        // Set address record for the user's subdomain
        l2Registry.setAddr(node, userAddress);
        
        emit UserRegistered(node, userAddress, username, block.timestamp);
        
        return node;
    }

    /**
     * @notice Create a policy subname for a user
     * @param policyName The policy name (e.g., "schoolfees")
     * @param policyContract The contract address that handles this policy
     * @return policyNode The created policy node hash
     */
    function createPolicy(
        string calldata policyName,
        address policyContract
    ) 
        external 
        nonReentrant
        returns (bytes32 policyNode) 
    {
        bytes32 userNode = userNodes[msg.sender];
        require(userNode != 0, "EnRouteRegistry: User not registered");
        require(policyContract != address(0), "EnRouteRegistry: Invalid policy contract");
        require(_isValidPolicyName(policyName), "EnRouteRegistry: Invalid policy name");
        
        // Create policy subname: schoolfees.alice.enrouteapp.eth
        bytes[] memory data = new bytes[](0); // Empty data array
        policyNode = l2Registry.createSubnode(userNode, policyName, policyContract, data);
        
        // Ensure policy doesn't already exist
        require(policyContracts[policyNode] == address(0), "EnRouteRegistry: Policy already exists");
        
        // Store the policy contract mapping
        policyContracts[policyNode] = policyContract;
        
        // Add to user's policy list
        userPolicies[userNode].push(policyName);
        
        // Set the address record to point to the policy contract
        l2Registry.setAddr(policyNode, policyContract);
        
        string memory username = usernames[userNode];
        emit PolicyCreated(policyNode, userNode, policyContract, policyName, username);
        
        return policyNode;
    }

    /**
     * @notice Create a policy subname for a user by an authorized contract
     * @param user The user address to create the policy for
     * @param policyName The policy name (e.g., "schoolfees")
     * @param policyContract The contract address that handles this policy
     * @return policyNode The created policy node hash
     */
    function createPolicyFor(
        address user,
        string calldata policyName,
        address policyContract
    ) 
        external 
        nonReentrant
        returns (bytes32 policyNode) 
    {
        // Only allow authorized contracts (like PolicyFactory) to call this
        require(
            owner() == msg.sender || authorizedRegistrars[msg.sender],
            "EnRouteRegistry: Not authorized"
        );
        
        bytes32 userNode = userNodes[user];
        require(userNode != 0, "EnRouteRegistry: User not registered");
        require(policyContract != address(0), "EnRouteRegistry: Invalid policy contract");
        require(_isValidPolicyName(policyName), "EnRouteRegistry: Invalid policy name");
        
        // Create policy subname: schoolfees.alice.enrouteapp.eth
        bytes[] memory data = new bytes[](0); // Empty data array
        policyNode = l2Registry.createSubnode(userNode, policyName, policyContract, data);
        
        // Ensure policy doesn't already exist
        require(policyContracts[policyNode] == address(0), "EnRouteRegistry: Policy already exists");
        
        // Store the policy contract mapping
        policyContracts[policyNode] = policyContract;
        
        // Add to user's policy list
        userPolicies[userNode].push(policyName);
        
        // Set the address record to point to the policy contract
        l2Registry.setAddr(policyNode, policyContract);
        
        string memory username = usernames[userNode];
        emit PolicyCreated(policyNode, userNode, policyContract, policyName, username);
        
        return policyNode;
    }

    /**
     * @notice Update username for existing user (admin only)
     * @param userAddress The user's address
     * @param newUsername The new username
     */
    function updateUsername(
        address userAddress,
        string calldata newUsername
    ) 
        external 
        onlyOwner 
        validUsername(newUsername)
        nonReentrant
    {
        bytes32 oldNode = userNodes[userAddress];
        require(oldNode != 0, "EnRouteRegistry: User not registered");
        require(!usernameExists[newUsername], "EnRouteRegistry: Username already taken");
        
        string memory oldUsername = usernames[oldNode];
        
        // Create new node using L2Registry's createSubnode
        bytes[] memory data = new bytes[](0); // Empty data array
        bytes32 newNode = l2Registry.createSubnode(BASE_NODE, newUsername, userAddress, data);
        
        // Update mappings
        usernameExists[oldUsername] = false;
        usernameExists[newUsername] = true;
        userNodes[userAddress] = newNode;
        usernames[newNode] = newUsername;
        delete usernames[oldNode];
        
        // Set address record
        l2Registry.setAddr(newNode, userAddress);
        
        emit UsernameUpdated(newNode, userAddress, oldUsername, newUsername);
    }

    /**
     * @notice Get user's node by address
     */
    function getUserNode(address user) external view returns (bytes32) {
        return userNodes[user];
    }

    /**
     * @notice Get username by user address
     */
    function getUsernameByAddress(address user) external view returns (string memory) {
        bytes32 node = userNodes[user];
        return usernames[node];
    }

    /**
     * @notice Get policy contract by node
     */
    function getPolicyContract(bytes32 node) external view returns (address) {
        return policyContracts[node];
    }

    /**
     * @notice Get all policies for a user
     */
    function getUserPolicies(address user) external view returns (string[] memory) {
        bytes32 node = userNodes[user];
        return userPolicies[node];
    }

    /**
     * @notice Check if username is available
     */
    function isUsernameAvailable(string calldata username) external view returns (bool) {
        return !usernameExists[username] && _isValidUsername(username);
    }

    /**
     * @notice Calculate node hash for username
     */
    function calculateUserNode(string calldata username) external view returns (bytes32) {
        bytes32 label = keccak256(bytes(username));
        return keccak256(abi.encodePacked(BASE_NODE, label));
    }

    /**
     * @notice Calculate node hash for policy
     */
    function calculatePolicyNode(
        string calldata username, 
        string calldata policyName
    ) external view returns (bytes32) {
        bytes32 userLabel = keccak256(bytes(username));
        bytes32 userNode = keccak256(abi.encodePacked(BASE_NODE, userLabel));
        bytes32 policyLabel = keccak256(bytes(policyName));
        return keccak256(abi.encodePacked(userNode, policyLabel));
    }

    // Admin functions
    function addAuthorizedRegistrar(address registrar) external onlyOwner {
        authorizedRegistrars[registrar] = true;
    }

    function removeAuthorizedRegistrar(address registrar) external onlyOwner {
        authorizedRegistrars[registrar] = false;
    }

    function pauseRegistration() external onlyOwner {
        registrationPaused = true;
    }

    function unpauseRegistration() external onlyOwner {
        registrationPaused = false;
    }

    /**
     * @notice Allow users to register themselves
     * @param username The desired username
     * @return node The created node hash for username.enrouteapp.eth
     */
    function selfRegister(
        string calldata username
    ) 
        external 
        whenNotPaused 
        validUsername(username)
        nonReentrant
        returns (bytes32 node) 
    {
        require(!usernameExists[username], "EnRouteRegistry: Username already taken");
        require(userNodes[msg.sender] == 0, "EnRouteRegistry: User already registered");
        
        // Create subname: alice.enrouteapp.eth using L2Registry's createSubnode
        bytes[] memory data = new bytes[](0); // Empty data array
        node = l2Registry.createSubnode(BASE_NODE, username, msg.sender, data);
        
        // Store mappings
        userNodes[msg.sender] = node;
        usernames[node] = username;
        usernameExists[username] = true;
        
        // Set address record for the user's subdomain
        l2Registry.setAddr(node, msg.sender);
        
        emit UserRegistered(node, msg.sender, username, block.timestamp);
        
        return node;
    }

    function setUsernameLength(uint256 _min, uint256 _max) external onlyOwner {
        require(_min > 0 && _max > _min, "EnRouteRegistry: Invalid length parameters");
        minUsernameLength = _min;
        maxUsernameLength = _max;
    }

    // Internal functions
    function _isValidUsername(string calldata username) internal pure returns (bool) {
        bytes memory usernameBytes = bytes(username);
        
        for (uint256 i = 0; i < usernameBytes.length; i++) {
            bytes1 char = usernameBytes[i];
            // Allow a-z, 0-9
            if (!(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x61 && char <= 0x7A)) { // a-z
                return false;
            }
        }
        return true;
    }

    function _isValidPolicyName(string calldata policyName) internal pure returns (bool) {
        bytes memory nameBytes = bytes(policyName);
        require(nameBytes.length >= 1 && nameBytes.length <= 32, "Invalid policy name length");
        
        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            // Allow a-z, 0-9, hyphen
            if (!(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x61 && char <= 0x7A) && // a-z
                !(char == 0x2D)) { // hyphen
                return false;
            }
        }
        return true;
    }
}
