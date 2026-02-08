// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EnRouteRegistry} from "../src/EnRouteRegistry.sol";
import {L2Registry} from "../src/L2Registry.sol";
import {L2RegistryFactory} from "../src/L2RegistryFactory.sol";
import {IL2Registry} from "../src/interfaces/IL2Registry.sol";

contract EnRouteRegistryTest is Test {
    EnRouteRegistry public enRouteRegistry;
    L2Registry public l2Registry;
    L2RegistryFactory public factory;
    
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public policyContract1 = makeAddr("policyContract1");
    address public policyContract2 = makeAddr("policyContract2");
    address public unauthorizedUser = makeAddr("unauthorized");
    
    bytes32 public baseNode; // Will be set from L2Registry after initialization
    string public constant BASE_NAME = "enrouteapp.eth";
    
    // Events to test
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

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy UniversalSignatureValidator locally via the CREATE2 factory that Foundry uses internally
        address create2Factory = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
        create2Factory.call(
            abi.encodePacked(
                bytes32(0),
                hex"6080604052348015600f57600080fd5b50610d488061001f6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806316d43401146100465780638f0684301461006d57806398ef1ed814610080575b600080fd5b61005961005436600461085e565b610093565b604051901515815260200160405180910390f35b61005961007b3660046108d2565b6105f8565b61005961008e3660046108d2565b61068e565b600073ffffffffffffffffffffffffffffffffffffffff86163b6060826020861080159061010157507f649264926492649264926492649264926492649264926492649264926492649287876100ea60208261092e565b6100f6928a929061096e565b6100ff91610998565b145b90508015610200576000606088828961011b60208261092e565b926101289392919061096e565b8101906101359190610acf565b9550909250905060008590036101f9576000808373ffffffffffffffffffffffffffffffffffffffff168360405161016d9190610b6e565b6000604051808303816000865af19150503d80600081146101aa576040519150601f19603f3d011682016040523d82523d6000602084013e6101af565b606091505b5091509150816101f657806040517f9d0d6e2d0000000000000000000000000000000000000000000000000000000081526004016101ed9190610bd4565b60405180910390fd5b50505b505061023a565b86868080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509294505050505b80806102465750600083115b156103d3576040517f1626ba7e00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8a1690631626ba7e9061029f908b908690600401610bee565b602060405180830381865afa9250505080156102f6575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092526102f391810190610c07565b60015b61035e573d808015610324576040519150601f19603f3d011682016040523d82523d6000602084013e610329565b606091505b50806040517f6f2a95990000000000000000000000000000000000000000000000000000000081526004016101ed9190610bd4565b7fffffffff0000000000000000000000000000000000000000000000000000000081167f1626ba7e0000000000000000000000000000000000000000000000000000000014841580156103ae5750825b80156103b8575086155b156103c757806000526001601ffd5b94506105ef9350505050565b60418614610463576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603a60248201527f5369676e617475726556616c696461746f72237265636f7665725369676e657260448201527f3a20696e76616c6964207369676e6174757265206c656e67746800000000000060648201526084016101ed565b6000610472602082898b61096e565b61047b91610998565b9050600061048d604060208a8c61096e565b61049691610998565b90506000898960408181106104ad576104ad610c49565b919091013560f81c915050601b81148015906104cd57508060ff16601c14155b1561055a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602d60248201527f5369676e617475726556616c696461746f723a20696e76616c6964207369676e60448201527f617475726520762076616c75650000000000000000000000000000000000000060648201526084016101ed565b6040805160008152602081018083528d905260ff831691810191909152606081018490526080810183905273ffffffffffffffffffffffffffffffffffffffff8d169060019060a0016020604051602081039080840390855afa1580156105c5573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff161496505050505050505b95945050505050565b6040517f16d4340100000000000000000000000000000000000000000000000000000000815260009030906316d4340190610640908890889088908890600190600401610c78565b6020604051808303816000875af115801561065f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106839190610cf5565b90505b949350505050565b6040517f16d4340100000000000000000000000000000000000000000000000000000000815260009030906316d43401906106d59088908890889088908890600401610c78565b6020604051808303816000875af192505050801561072e575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016820190925261072b91810190610cf5565b60015b6107db573d80801561075c576040519150601f19603f3d011682016040523d82523d6000602084013e610761565b606091505b50805160018190036107d4578160008151811061078057610780610c49565b6020910101517fff00000000000000000000000000000000000000000000000000000000000000167f0100000000000000000000000000000000000000000000000000000000000000149250610686915050565b8060208301fd5b9050610686565b73ffffffffffffffffffffffffffffffffffffffff8116811461080457600080fd5b50565b60008083601f84011261081957600080fd5b50813567ffffffffffffffff81111561083157600080fd5b60208301915083602082850101111561084957600080fd5b9250929050565b801515811461080457600080fd5b60008060008060006080868803121561087657600080fd5b8535610881816107e2565b945060208601359350604086013567ffffffffffffffff8111156108a457600080fd5b6108b088828901610807565b90945092505060608601356108c481610850565b809150509295509295909350565b600080600080606085870312156108e857600080fd5b84356108f3816107e2565b935060208501359250604085013567ffffffffffffffff81111561091657600080fd5b61092287828801610807565b95989497509550505050565b81810381811115610968577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b92915050565b6000808585111561097e57600080fd5b8386111561098b57600080fd5b5050820193919092039150565b80356020831015610968577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff602084900360031b1b1692915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f830112610a1457600080fd5b813567ffffffffffffffff811115610a2e57610a2e6109d4565b6040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0603f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8501160116810181811067ffffffffffffffff82111715610a9a57610a9a6109d4565b604052818152838201602001851015610ab257600080fd5b816020850160208301376000918101602001919091529392505050565b600080600060608486031215610ae457600080fd5b8335610aef816107e2565b9250602084013567ffffffffffffffff811115610b0b57600080fd5b610b1786828701610a03565b925050604084013567ffffffffffffffff811115610b3457600080fd5b610b4086828701610a03565b9150509250925092565b60005b83811015610b65578181015183820152602001610b4d565b50506000910152565b60008251610b80818460208701610b4a565b9190910192915050565b60008151808452610ba2816020860160208601610b4a565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b602081526000610be76020830184610b8a565b9392505050565b8281526040602082015260006106866040830184610b8a565b600060208284031215610c1957600080fd5b81517fffffffff0000000000000000000000000000000000000000000000000000000081168114610be757600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b73ffffffffffffffffffffffffffffffffffffffff8616815284602082015260806040820152826080820152828460a0830137600060a08483010152600060a07fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f860116830101905082151560608301529695505050505050565b600060208284031215610d0757600080fd5b8151610be78161085056fea2646970667358221220fa1669652244780c8dcf7823a819ca1aa2abb64af0cf4d7adedb2339d4e907d964736f6c634300081a0033"
            )
        );
        
        // Deploy factory with L2Registry implementation
        factory = new L2RegistryFactory(address(new L2Registry()));
        
        // Deploy registry through factory (this handles proper initialization)
        l2Registry = L2Registry(factory.deployRegistry(BASE_NAME, "ENROUTE", "https://metadata.enroute.app/", owner));
        
        // Get the baseNode that was created during initialization
        baseNode = l2Registry.baseNode();
        
        // Deploy EnRouteRegistry with the actual baseNode
        enRouteRegistry = new EnRouteRegistry(address(l2Registry), baseNode, owner);
        
        // Add EnRouteRegistry as a registrar to L2Registry
        l2Registry.addRegistrar(address(enRouteRegistry));
        
        // Add owner as authorized registrar in EnRouteRegistry
        enRouteRegistry.addAuthorizedRegistrar(owner);
        
        vm.stopPrank();
    }

    function test_Constructor() public view {
        assertEq(address(enRouteRegistry.l2Registry()), address(l2Registry));
        assertEq(enRouteRegistry.BASE_NODE(), baseNode);
        assertEq(enRouteRegistry.owner(), owner);
        assertEq(enRouteRegistry.maxUsernameLength(), 20);
        assertEq(enRouteRegistry.minUsernameLength(), 3);
        assertFalse(enRouteRegistry.registrationPaused());
    }

    function test_RegisterUser_Success() public {
        string memory username = "alice";
        
        vm.prank(owner);
        bytes32 node = enRouteRegistry.registerUser(username, user1);
        
        // Verify mappings
        assertEq(enRouteRegistry.userNodes(user1), node);
        assertEq(enRouteRegistry.usernames(node), username);
        assertTrue(enRouteRegistry.usernameExists(username));
        
        // Verify L2Registry state
        assertEq(l2Registry.owner(node), user1);
    }

    function test_RegisterUser_RevertUnauthorized() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("EnRouteRegistry: Not authorized");
        enRouteRegistry.registerUser("alice", user1);
    }

    function test_RegisterUser_RevertUsernameTaken() public {
        string memory username = "alice";
        
        // Register first user
        vm.prank(owner);
        enRouteRegistry.registerUser(username, user1);
        
        // Try to register same username
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: Username already taken");
        enRouteRegistry.registerUser(username, user2);
    }

    function test_RegisterUser_RevertUserAlreadyRegistered() public {
        // Register user1 with alice
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        // Try to register same user with different username
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: User already registered");
        enRouteRegistry.registerUser("bob", user1);
    }

    function test_RegisterUser_RevertInvalidAddress() public {
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: Invalid address");
        enRouteRegistry.registerUser("alice", address(0));
    }

    function test_RegisterUser_RevertInvalidUsernameLength() public {
        // Too short
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: Invalid username length");
        enRouteRegistry.registerUser("ab", user1);
        
        // Too long
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: Invalid username length");
        enRouteRegistry.registerUser("verylongusernamethatexceedslimit", user1);
    }

    function test_RegisterUser_RevertWhenPaused() public {
        // Pause registration
        vm.prank(owner);
        enRouteRegistry.pauseRegistration();
        
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: Registration paused");
        enRouteRegistry.registerUser("alice", user1);
    }

    function test_CreatePolicy_Success() public {
        string memory username = "alice";
        string memory policyName = "schoolfees";
        
        // First register user
        vm.prank(owner);
        bytes32 userNode = enRouteRegistry.registerUser(username, user1);
        
        // Create policy as the user
        vm.prank(user1);
        bytes32 policyNode = enRouteRegistry.createPolicy(policyName, policyContract1);
        
        // Verify mappings
        assertEq(enRouteRegistry.policyContracts(policyNode), policyContract1);
        
        string[] memory userPolicies = enRouteRegistry.getUserPolicies(user1);
        assertEq(userPolicies.length, 1);
        assertEq(userPolicies[0], policyName);
        
        // Verify L2Registry state
        assertEq(l2Registry.owner(policyNode), policyContract1);
    }

    function test_CreatePolicy_RevertUserNotRegistered() public {
        vm.prank(user1);
        vm.expectRevert("EnRouteRegistry: User not registered");
        enRouteRegistry.createPolicy("schoolfees", policyContract1);
    }

    function test_CreatePolicy_RevertInvalidPolicyContract() public {
        // Register user first
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        vm.prank(user1);
        vm.expectRevert("EnRouteRegistry: Invalid policy contract");
        enRouteRegistry.createPolicy("schoolfees", address(0));
    }

    function test_UpdateUsername_Success() public {
        string memory oldUsername = "alice";
        string memory newUsername = "aliceupdated";
        
        // Register user
        vm.prank(owner);
        bytes32 oldNode = enRouteRegistry.registerUser(oldUsername, user1);
        
        // Update username
        vm.prank(owner);
        enRouteRegistry.updateUsername(user1, newUsername);
        
        // Verify old username is now available
        assertFalse(enRouteRegistry.usernameExists(oldUsername));
        assertTrue(enRouteRegistry.usernameExists(newUsername));
        
        // Verify old node has no username
        assertEq(enRouteRegistry.usernames(oldNode), "");
        
        // Verify new node is set
        bytes32 newNode = enRouteRegistry.userNodes(user1);
        assertNotEq(newNode, oldNode);
        assertEq(enRouteRegistry.usernames(newNode), newUsername);
    }

    function test_UpdateUsername_RevertNotOwner() public {
        // Register user
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        enRouteRegistry.updateUsername(user1, "newalice");
    }

    function test_UpdateUsername_RevertUserNotRegistered() public {
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: User not registered");
        enRouteRegistry.updateUsername(user1, "alice");
    }

    function test_UpdateUsername_RevertUsernameAlreadyTaken() public {
        // Register two users
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        vm.prank(owner);
        enRouteRegistry.registerUser("bob", user2);
        
        // Try to update user1's username to user2's username
        vm.prank(owner);
        vm.expectRevert("EnRouteRegistry: Username already taken");
        enRouteRegistry.updateUsername(user1, "bob");
    }

    function test_GetUserNode() public {
        vm.prank(owner);
        bytes32 node = enRouteRegistry.registerUser("alice", user1);
        
        assertEq(enRouteRegistry.getUserNode(user1), node);
        assertEq(enRouteRegistry.getUserNode(user2), bytes32(0));
    }

    function test_GetUsernameByAddress() public {
        string memory username = "alice";
        vm.prank(owner);
        enRouteRegistry.registerUser(username, user1);
        
        assertEq(enRouteRegistry.getUsernameByAddress(user1), username);
        assertEq(enRouteRegistry.getUsernameByAddress(user2), "");
    }

    function test_GetPolicyContract() public {
        // Register user and create policy
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        vm.prank(user1);
        bytes32 policyNode = enRouteRegistry.createPolicy("schoolfees", policyContract1);
        
        assertEq(enRouteRegistry.getPolicyContract(policyNode), policyContract1);
    }

    function test_GetUserPolicies() public {
        // Register user
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        // Create multiple policies
        vm.startPrank(user1);
        enRouteRegistry.createPolicy("schoolfees", policyContract1);
        enRouteRegistry.createPolicy("transport", policyContract2);
        vm.stopPrank();
        
        string[] memory policies = enRouteRegistry.getUserPolicies(user1);
        assertEq(policies.length, 2);
        assertEq(policies[0], "schoolfees");
        assertEq(policies[1], "transport");
    }

    function test_IsUsernameAvailable() public {
        assertTrue(enRouteRegistry.isUsernameAvailable("alice"));
        
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        assertFalse(enRouteRegistry.isUsernameAvailable("alice"));
        assertTrue(enRouteRegistry.isUsernameAvailable("bob"));
    }

    function test_AddAuthorizedRegistrar() public {
        assertFalse(enRouteRegistry.authorizedRegistrars(user1));
        
        vm.prank(owner);
        enRouteRegistry.addAuthorizedRegistrar(user1);
        
        assertTrue(enRouteRegistry.authorizedRegistrars(user1));
    }

    function test_RemoveAuthorizedRegistrar() public {
        vm.prank(owner);
        enRouteRegistry.addAuthorizedRegistrar(user1);
        assertTrue(enRouteRegistry.authorizedRegistrars(user1));
        
        vm.prank(owner);
        enRouteRegistry.removeAuthorizedRegistrar(user1);
        
        assertFalse(enRouteRegistry.authorizedRegistrars(user1));
    }

    function test_PauseUnpauseRegistration() public {
        assertFalse(enRouteRegistry.registrationPaused());
        
        vm.prank(owner);
        enRouteRegistry.pauseRegistration();
        assertTrue(enRouteRegistry.registrationPaused());
        
        vm.prank(owner);
        enRouteRegistry.unpauseRegistration();
        assertFalse(enRouteRegistry.registrationPaused());
    }

    function test_SetUsernameLength() public {
        vm.prank(owner);
        enRouteRegistry.setUsernameLength(5, 25);
        
        assertEq(enRouteRegistry.minUsernameLength(), 5);
        assertEq(enRouteRegistry.maxUsernameLength(), 25);
    }

    function test_CalculateUserNode() public {
        string memory username = "alice";
        bytes32 calculatedNode = enRouteRegistry.calculateUserNode(username);
        
        vm.prank(owner);
        bytes32 actualNode = enRouteRegistry.registerUser(username, user1);
        
        assertEq(calculatedNode, actualNode);
    }

    function test_CalculatePolicyNode() public {
        string memory username = "alice";
        string memory policyName = "schoolfees";
        
        // Register user first
        vm.prank(owner);
        enRouteRegistry.registerUser(username, user1);
        
        bytes32 calculatedPolicyNode = enRouteRegistry.calculatePolicyNode(username, policyName);
        
        vm.prank(user1);
        bytes32 actualPolicyNode = enRouteRegistry.createPolicy(policyName, policyContract1);
        
        assertEq(calculatedPolicyNode, actualPolicyNode);
    }

    function test_MultipleUsersAndPolicies() public {
        // Register multiple users
        vm.startPrank(owner);
        enRouteRegistry.registerUser("alice", user1);
        enRouteRegistry.registerUser("bob", user2);
        vm.stopPrank();
        
        // Each user creates policies
        vm.prank(user1);
        enRouteRegistry.createPolicy("schoolfees", policyContract1);
        
        vm.prank(user2);
        enRouteRegistry.createPolicy("transport", policyContract2);
        
        // Verify isolation
        string[] memory user1Policies = enRouteRegistry.getUserPolicies(user1);
        string[] memory user2Policies = enRouteRegistry.getUserPolicies(user2);
        
        assertEq(user1Policies.length, 1);
        assertEq(user1Policies[0], "schoolfees");
        
        assertEq(user2Policies.length, 1);
        assertEq(user2Policies[0], "transport");
    }

    function test_EdgeCaseUsernames() public {
        vm.startPrank(owner);
        
        // Test minimum length username
        enRouteRegistry.registerUser("abc", user1);
        assertTrue(enRouteRegistry.usernameExists("abc"));
        
        // Test maximum length username (20 chars)
        string memory maxUsername = "abcdefghijklmnopqrst";
        enRouteRegistry.registerUser(maxUsername, user2);
        assertTrue(enRouteRegistry.usernameExists(maxUsername));
        
        vm.stopPrank();
    }

    // Helper function to test gas usage
    function test_GasUsage() public {
        vm.prank(owner);
        uint256 gasBefore = gasleft();
        enRouteRegistry.registerUser("alice", user1);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for registerUser:", gasUsed);
        
        vm.prank(user1);
        gasBefore = gasleft();
        enRouteRegistry.createPolicy("schoolfees", policyContract1);
        gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for createPolicy:", gasUsed);
    }
}
