// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PolicyFactory} from "../src/PolicyFactory.sol";
import {EnRouteRegistry} from "../src/EnRouteRegistry.sol";
import {L2Registry} from "../src/L2Registry.sol";
import {L2RegistryFactory} from "../src/L2RegistryFactory.sol";
import {SchoolFeesPolicy} from "../src/examples/SchoolFeesPolicy.sol";
import {SavingsPolicy} from "../src/examples/SavingsPolicy.sol";
import {SplitPaymentPolicy} from "../src/examples/SplitPaymentPolicy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PolicyFactoryTest is Test {
    PolicyFactory public policyFactory;
    EnRouteRegistry public enRouteRegistry;
    L2Registry public l2Registry;
    L2RegistryFactory public l2RegistryFactory;
    
    // Policy implementations
    SchoolFeesPolicy public schoolFeesImplementation;
    SavingsPolicy public savingsImplementation;
    SplitPaymentPolicy public splitPaymentImplementation;
    
    // Test addresses
    address public owner = makeAddr("owner");
    address public feeRecipient = makeAddr("feeRecipient");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public unauthorized = makeAddr("unauthorized");
    
    bytes32 public baseNode;
    string public constant BASE_NAME = "enrouteapp.eth";
    
    // Events to test
    event PolicyTemplateAdded(
        PolicyFactory.PolicyType indexed policyType,
        address indexed implementation,
        string name,
        uint256 creationFee
    );
    
    event PolicyCreated(
        address indexed owner,
        address indexed policyContract,
        PolicyFactory.PolicyType indexed policyType,
        string policyName,
        string username
    );
    
    event PolicyDeactivated(
        address indexed policyContract,
        address indexed owner
    );
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy UniversalSignatureValidator locally
        address create2Factory = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
        create2Factory.call(
            hex"604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3"
        );
        
        // Deploy L2Registry infrastructure
        l2RegistryFactory = new L2RegistryFactory(address(new L2Registry()));
        l2Registry = L2Registry(l2RegistryFactory.deployRegistry(BASE_NAME, "ENROUTE", "https://metadata.enroute.app/", owner));
        baseNode = l2Registry.baseNode();
        
        // Deploy EnRouteRegistry
        enRouteRegistry = new EnRouteRegistry(address(l2Registry), baseNode, owner);
        l2Registry.addRegistrar(address(enRouteRegistry));
        enRouteRegistry.addAuthorizedRegistrar(owner);
        
        // Deploy PolicyFactory
        policyFactory = new PolicyFactory(address(enRouteRegistry), feeRecipient, owner);
        
        // Authorize PolicyFactory to create policies
        enRouteRegistry.addAuthorizedRegistrar(address(policyFactory));
        
        // Deploy policy implementations
        schoolFeesImplementation = new SchoolFeesPolicy();
        savingsImplementation = new SavingsPolicy();
        splitPaymentImplementation = new SplitPaymentPolicy();
        
        vm.stopPrank();
    }
    
    function test_Constructor() public view {
        assertEq(address(policyFactory.enRouteRegistry()), address(enRouteRegistry));
        assertEq(policyFactory.feeRecipient(), feeRecipient);
        assertEq(policyFactory.owner(), owner);
        assertEq(policyFactory.defaultCreationFee(), 0.001 ether);
    }
    
    function test_AddPolicyTemplate_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit PolicyTemplateAdded(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            0.002 ether
        );
        
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Policy for managing school fee payments",
            0.002 ether
        );
        
        (
            address implementation,
            string memory name,
            string memory description,
            bool active,
            uint256 creationFee
        ) = policyFactory.policyTemplates(PolicyFactory.PolicyType.SchoolFees);
        
        assertEq(implementation, address(schoolFeesImplementation));
        assertEq(name, "School Fees Policy");
        assertEq(description, "Policy for managing school fee payments");
        assertTrue(active);
        assertEq(creationFee, 0.002 ether);
    }
    
    function test_AddPolicyTemplate_RevertUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorized));
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
    }
    
    function test_AddPolicyTemplate_RevertInvalidImplementation() public {
        vm.prank(owner);
        vm.expectRevert("PolicyFactory: Invalid implementation");
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(0),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
    }
    
    function test_CreatePolicy_Success() public {
        // First add policy template
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        // Register user first
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        // Prepare initialization data for SchoolFeesPolicy
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,string,string,string,uint256,uint256,uint256)",
            user1,              // student
            user1,              // guardian
            "Alice Smith",      // studentName
            "Test University",  // institution
            "2024-2025",       // academicYear
            1 ether,           // totalAmount
            4,                 // installments
            block.timestamp + 30 days // dueDate
        );
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectEmit(true, true, true, true);
        emit PolicyCreated(
            user1,
            address(0), // We don't know the address yet
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            "alice"
        );
        
        address policyContract = policyFactory.createPolicy{value: 0.002 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            initData
        );
        
        // Verify policy instance
        PolicyFactory.PolicyInstance memory instance = policyFactory.getPolicyInstance(policyContract);
        assertEq(instance.policyContract, policyContract);
        assertEq(instance.owner, user1);
        assertEq(uint256(instance.policyType), uint256(PolicyFactory.PolicyType.SchoolFees));
        assertEq(instance.name, "schoolfees");
        assertTrue(instance.active);
        
        // Verify it's in user's policies
        PolicyFactory.PolicyInstance[] memory userPolicies = policyFactory.getUserPolicies(user1);
        assertEq(userPolicies.length, 1);
        assertEq(userPolicies[0].policyContract, policyContract);
        
        // Verify it's active
        assertTrue(policyFactory.isPolicyActive(policyContract));
    }
    
    function test_CreatePolicy_RevertUserNotRegistered() public {
        // Add policy template
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        bytes memory initData = abi.encodeWithSignature("initialize()");
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(PolicyFactory.UserNotRegistered.selector);
        policyFactory.createPolicy{value: 0.002 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            initData
        );
    }
    
    function test_CreatePolicy_RevertInsufficientFee() public {
        // Add policy template
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        // Register user
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        bytes memory initData = abi.encodeWithSignature("initialize()");
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(PolicyFactory.InsufficientFee.selector);
        policyFactory.createPolicy{value: 0.001 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            initData
        );
    }
    
    function test_CreatePolicy_RevertInvalidPolicyType() public {
        // Register user
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        bytes memory initData = abi.encodeWithSignature("initialize()");
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert("PolicyFactory: Invalid or inactive policy type");
        policyFactory.createPolicy{value: 0.001 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            initData
        );
    }
    
    function test_DeactivatePolicy_Success() public {
        // Setup: Create a policy first
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,string,string,string,uint256,uint256,uint256)",
            user1, user1, "Alice", "School", "2024", 1 ether, 4, block.timestamp + 30 days
        );
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        address policyContract = policyFactory.createPolicy{value: 0.002 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            initData
        );
        
        // Deactivate policy
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit PolicyDeactivated(policyContract, user1);
        
        policyFactory.deactivatePolicy(policyContract);
        
        // Verify deactivation
        assertFalse(policyFactory.isPolicyActive(policyContract));
        
        PolicyFactory.PolicyInstance memory instance = policyFactory.getPolicyInstance(policyContract);
        assertFalse(instance.active);
    }
    
    function test_DeactivatePolicy_RevertUnauthorized() public {
        // Setup: Create a policy first
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,string,string,string,uint256,uint256,uint256)",
            user1, user1, "Alice", "School", "2024", 1 ether, 4, block.timestamp + 30 days
        );
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        address policyContract = policyFactory.createPolicy{value: 0.002 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            initData
        );
        
        // Try to deactivate as unauthorized user
        vm.prank(user2);
        vm.expectRevert("PolicyFactory: Not policy owner");
        policyFactory.deactivatePolicy(policyContract);
    }
    
    function test_GetActivePolicies() public {
        // Setup: Create multiple policies
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.Savings,
            address(savingsImplementation),
            "Savings Policy",
            "Description",
            0.001 ether
        );
        
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        bytes memory schoolFeesInitData = abi.encodeWithSignature(
            "initialize(address,address,string,string,string,uint256,uint256,uint256)",
            user1, user1, "Alice", "School", "2024", 1 ether, 4, block.timestamp + 30 days
        );
        
        bytes memory savingsInitData = abi.encodeWithSignature(
            "initialize(address,address,string,string)",
            user1, user1, "My Savings", "Personal savings account"
        );
        
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        address policy1 = policyFactory.createPolicy{value: 0.002 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            schoolFeesInitData
        );
        
        address policy2 = policyFactory.createPolicy{value: 0.001 ether}(
            PolicyFactory.PolicyType.Savings,
            "savings",
            savingsInitData
        );
        
        vm.stopPrank();
        
        // Get all policies
        PolicyFactory.PolicyInstance[] memory allPolicies = policyFactory.getUserPolicies(user1);
        assertEq(allPolicies.length, 2);
        
        // Get active policies
        PolicyFactory.PolicyInstance[] memory activePolicies = policyFactory.getActivePolicies(user1);
        assertEq(activePolicies.length, 2);
        
        // Deactivate one policy
        vm.prank(user1);
        policyFactory.deactivatePolicy(policy1);
        
        // Check active policies again
        activePolicies = policyFactory.getActivePolicies(user1);
        assertEq(activePolicies.length, 1);
        assertEq(activePolicies[0].policyContract, policy2);
        
        // All policies should still be 2
        allPolicies = policyFactory.getUserPolicies(user1);
        assertEq(allPolicies.length, 2);
    }
    
    function test_UpdatePolicyTemplate() public {
        // Add initial template
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        // Update template
        vm.prank(owner);
        policyFactory.updatePolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(savingsImplementation), // New implementation
            0.003 ether // New fee
        );
        
        (
            address implementation,
            ,
            ,
            ,
            uint256 creationFee
        ) = policyFactory.policyTemplates(PolicyFactory.PolicyType.SchoolFees);
        
        assertEq(implementation, address(savingsImplementation));
        assertEq(creationFee, 0.003 ether);
    }
    
    function test_SetPolicyTemplateActive() public {
        // Add template
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        // Deactivate template
        vm.prank(owner);
        policyFactory.setPolicyTemplateActive(PolicyFactory.PolicyType.SchoolFees, false);
        
        (,,,bool active,) = policyFactory.policyTemplates(PolicyFactory.PolicyType.SchoolFees);
        assertFalse(active);
        
        // Reactivate template
        vm.prank(owner);
        policyFactory.setPolicyTemplateActive(PolicyFactory.PolicyType.SchoolFees, true);
        
        (,,,active,) = policyFactory.policyTemplates(PolicyFactory.PolicyType.SchoolFees);
        assertTrue(active);
    }
    
    function test_GetCreationFee() public {
        // Test default fee when no template is set
        uint256 defaultFee = policyFactory.getCreationFee(PolicyFactory.PolicyType.SchoolFees);
        assertEq(defaultFee, 0.001 ether);
        
        // Add template with custom fee
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.005 ether
        );
        
        uint256 customFee = policyFactory.getCreationFee(PolicyFactory.PolicyType.SchoolFees);
        assertEq(customFee, 0.005 ether);
        
        // Test template with 0 fee (should return default)
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.Savings,
            address(savingsImplementation),
            "Savings Policy",
            "Description",
            0 // Use default fee
        );
        
        uint256 defaultFromZero = policyFactory.getCreationFee(PolicyFactory.PolicyType.Savings);
        assertEq(defaultFromZero, 0.001 ether);
    }
    
    function test_SetDefaultCreationFee() public {
        vm.prank(owner);
        policyFactory.setDefaultCreationFee(0.005 ether);
        
        assertEq(policyFactory.defaultCreationFee(), 0.005 ether);
    }
    
    function test_SetFeeRecipient() public {
        address newRecipient = makeAddr("newRecipient");
        
        vm.prank(owner);
        policyFactory.setFeeRecipient(newRecipient);
        
        assertEq(policyFactory.feeRecipient(), newRecipient);
    }
    
    function test_SetFeeRecipient_RevertInvalidRecipient() public {
        vm.prank(owner);
        vm.expectRevert("PolicyFactory: Invalid recipient");
        policyFactory.setFeeRecipient(address(0));
    }
    
    function test_EmergencyWithdraw() public {
        // Send some ETH to the contract
        vm.deal(address(policyFactory), 1 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        
        vm.prank(owner);
        policyFactory.emergencyWithdraw();
        
        assertEq(address(policyFactory).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + 1 ether);
    }
    
    function test_CreatePolicyWithDifferentTypes() public {
        // Add all policy templates
        vm.startPrank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.002 ether
        );
        
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.Savings,
            address(savingsImplementation),
            "Savings Policy",
            "Description",
            0.001 ether
        );
        
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SplitPayment,
            address(splitPaymentImplementation),
            "Split Payment Policy",
            "Description",
            0.003 ether
        );
        
        enRouteRegistry.registerUser("alice", user1);
        vm.stopPrank();
        
        // Create policies of different types
        bytes memory schoolFeesInitData = abi.encodeWithSignature(
            "initialize(address,address,string,string,string,uint256,uint256,uint256)",
            user1, user1, "Alice", "School", "2024", 1 ether, 4, block.timestamp + 30 days
        );
        
        bytes memory savingsInitData = abi.encodeWithSignature(
            "initialize(address,address,string,string)",
            user1, user1, "My Savings", "Personal savings"
        );
        
        bytes memory splitPaymentInitData = abi.encodeWithSignature(
            "initialize(address,address,string,string,uint8)",
            user1, user1, "Split Payments", "Family expenses", uint8(0) // Percentage split type
        );
        
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        address schoolFeesPolicy = policyFactory.createPolicy{value: 0.002 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            schoolFeesInitData
        );
        
        address savingsPolicy = policyFactory.createPolicy{value: 0.001 ether}(
            PolicyFactory.PolicyType.Savings,
            "savings",
            savingsInitData
        );
        
        address splitPaymentPolicy = policyFactory.createPolicy{value: 0.003 ether}(
            PolicyFactory.PolicyType.SplitPayment,
            "splitpay",
            splitPaymentInitData
        );
        
        vm.stopPrank();
        
        // Verify all policies were created
        PolicyFactory.PolicyInstance[] memory userPolicies = policyFactory.getUserPolicies(user1);
        assertEq(userPolicies.length, 3);
        
        // Verify policy types
        assertEq(uint256(policyFactory.getPolicyInstance(schoolFeesPolicy).policyType), uint256(PolicyFactory.PolicyType.SchoolFees));
        assertEq(uint256(policyFactory.getPolicyInstance(savingsPolicy).policyType), uint256(PolicyFactory.PolicyType.Savings));
        assertEq(uint256(policyFactory.getPolicyInstance(splitPaymentPolicy).policyType), uint256(PolicyFactory.PolicyType.SplitPayment));
        
        // Verify all are active
        assertTrue(policyFactory.isPolicyActive(schoolFeesPolicy));
        assertTrue(policyFactory.isPolicyActive(savingsPolicy));
        assertTrue(policyFactory.isPolicyActive(splitPaymentPolicy));
    }
    
    function test_FeeDistribution() public {
        // Add policy template with fee
        vm.prank(owner);
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Description",
            0.1 ether
        );
        
        vm.prank(owner);
        enRouteRegistry.registerUser("alice", user1);
        
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,string,string,string,uint256,uint256,uint256)",
            user1, user1, "Alice", "School", "2024", 1 ether, 4, block.timestamp + 30 days
        );
        
        uint256 feeRecipientBalanceBefore = feeRecipient.balance;
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        policyFactory.createPolicy{value: 0.1 ether}(
            PolicyFactory.PolicyType.SchoolFees,
            "schoolfees",
            initData
        );
        
        // Verify fee was transferred to recipient
        assertEq(feeRecipient.balance, feeRecipientBalanceBefore + 0.1 ether);
    }
}
