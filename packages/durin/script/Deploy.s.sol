// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {L2Registry} from "../src/L2Registry.sol";
import {EnRouteRegistry} from "../src/EnRouteRegistry.sol";
import {PolicyFactory} from "../src/PolicyFactory.sol";
import {SchoolFeesPolicy} from "../src/examples/SchoolFeesPolicy.sol";
import {SavingsPolicy} from "../src/examples/SavingsPolicy.sol";
import {SplitPaymentPolicy} from "../src/examples/SplitPaymentPolicy.sol";
import {SimpleSplitPaymentPolicy} from "../src/examples/SimpleSplitPaymentPolicy.sol";

contract DeployScript is Script {
    // Deployment configuration
    string constant BASE_DOMAIN = "enrouteapp.eth";
    address public deployer;
    address public feeRecipient;
    address public l2RegistryAddress;
    bytes32 public baseNode;
    
    // Deployed contracts
    L2Registry public l2Registry;
    EnRouteRegistry public enRouteRegistry;
    PolicyFactory public policyFactory;
    SchoolFeesPolicy public schoolFeesImplementation;
    SavingsPolicy public savingsImplementation;
    SplitPaymentPolicy public splitPaymentImplementation;
    SimpleSplitPaymentPolicy public simpleSplitImplementation;
    
    function setUp() public {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        l2RegistryAddress = vm.envAddress("L2_REGISTRY_ADDRESS");
        baseNode = vm.envBytes32("ENROUTE_BASE_NODE");
        
        console.log("Deployer:", deployer);
        console.log("Fee Recipient:", feeRecipient);
        console.log("L2Registry Address:", l2RegistryAddress);
        console.log("Base Node:", vm.toString(baseNode));
    }
    
    function run() public {
        vm.startBroadcast();
        
        console.log("Starting deployment on Base Sepolia...");
        console.log("Block number:", block.number);
        console.log("Chain ID:", block.chainid);
        
        // Step 1: Connect to existing L2Registry
        connectToL2Registry();
        
        // Step 2: Deploy EnRouteRegistry
        deployEnRouteRegistry();
        
        // Step 3: Deploy Policy Implementations
        deployPolicyImplementations();
        
        // Step 4: Deploy PolicyFactory
        deployPolicyFactory();
        
        // Step 5: Setup PolicyFactory with templates
        setupPolicyTemplates();
        
        // Step 6: Configure permissions
        configurePermissions();
        
        vm.stopBroadcast();
        
        // Step 7: Save deployment info
        saveDeploymentInfo();
        
        console.log("Deployment completed successfully!");
    }
    
    function connectToL2Registry() internal {
        console.log("\nConnecting to existing L2Registry...");
        
        // Connect to existing L2Registry from environment
        l2Registry = L2Registry(l2RegistryAddress);
        
        console.log("Connected to L2Registry at:", address(l2Registry));
        console.log("L2Registry owner:", l2Registry.owner());
    }
    
    function deployEnRouteRegistry() internal {
        console.log("\nDeploying EnRouteRegistry...");
        
        enRouteRegistry = new EnRouteRegistry(
            address(l2Registry),
            baseNode,
            deployer
        );
        
        console.log("EnRouteRegistry deployed at:", address(enRouteRegistry));
    }
    
    function deployPolicyImplementations() internal {
        console.log("\nDeploying Policy Implementations...");
        
        // Deploy SchoolFeesPolicy implementation
        schoolFeesImplementation = new SchoolFeesPolicy();
        console.log("SchoolFeesPolicy implementation:", address(schoolFeesImplementation));
        
        // Deploy SavingsPolicy implementation
        savingsImplementation = new SavingsPolicy();
        console.log("SavingsPolicy implementation:", address(savingsImplementation));
        
        // Deploy SplitPaymentPolicy implementation
        splitPaymentImplementation = new SplitPaymentPolicy();
        console.log("SplitPaymentPolicy implementation:", address(splitPaymentImplementation));
        
        // Deploy SimpleSplitPaymentPolicy implementation
        simpleSplitImplementation = new SimpleSplitPaymentPolicy();
        console.log("SimpleSplitPaymentPolicy implementation:", address(simpleSplitImplementation));
    }
    
    function deployPolicyFactory() internal {
        console.log("\nDeploying PolicyFactory...");
        
        policyFactory = new PolicyFactory(
            address(enRouteRegistry),
            feeRecipient,
            deployer
        );
        
        console.log("PolicyFactory deployed at:", address(policyFactory));
    }
    
    function setupPolicyTemplates() internal {
        console.log("\nSetting up Policy Templates...");
        
        // Add SchoolFees template
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SchoolFees,
            address(schoolFeesImplementation),
            "School Fees Policy",
            "Automated school fee payment management with installment support",
            0.002 ether
        );
        console.log("SchoolFees template added");
        
        // Add Savings template
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.Savings,
            address(savingsImplementation),
            "Savings Policy",
            "Goal-based savings management with withdrawal restrictions",
            0.001 ether
        );
        console.log("Savings template added");
        
        // Add SplitPayment template (complex version)
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.SplitPayment,
            address(splitPaymentImplementation),
            "Split Payment Policy",
            "Multi-recipient payment splitting with configurable ratios",
            0.003 ether
        );
        console.log("SplitPayment template added");
        
        // Add SimpleSplitPayment template (our main use case)
        policyFactory.addPolicyTemplate(
            PolicyFactory.PolicyType.Custom,
            address(simpleSplitImplementation),
            "Simple Split Payment",
            "Simple percentage-based payment distribution",
            0.001 ether
        );
        console.log("SimpleSplitPayment template added");
    }
    
    function configurePermissions() internal {
        console.log("\nConfiguring Permissions...");
        
        // Authorize PolicyFactory to create policies in EnRouteRegistry
        enRouteRegistry.addAuthorizedRegistrar(address(policyFactory));
        console.log("PolicyFactory authorized in EnRouteRegistry");
        
        // Check L2Registry owner and provide instructions if needed
        address l2RegistryOwner = l2Registry.owner();
        console.log("L2Registry Owner:", l2RegistryOwner);
        console.log("Current deployer:", msg.sender);
        
        if (l2RegistryOwner == msg.sender) {
            // We can authorize directly
            l2Registry.addRegistrar(address(enRouteRegistry));
            console.log("EnRouteRegistry authorized in L2Registry");
        } else {
            // We need manual authorization - this is normal and expected
            console.log("EnRouteRegistry deployed successfully!");
            console.log("MANUAL STEP REQUIRED:");
            console.log("The L2Registry owner needs to authorize EnRouteRegistry:");
            console.log("Command for L2Registry owner:");
            console.log("cast send", address(l2Registry));
            console.log('"addRegistrar(address)"', address(enRouteRegistry));
            console.log("--rpc-url $BASE_SEPOLIA_RPC_URL");
            console.log("--private-key <L2_REGISTRY_OWNER_PRIVATE_KEY>");
        }
    }
    
    function saveDeploymentInfo() internal view {
        console.log("\nDEPLOYMENT SUMMARY");
        console.log("=====================");
        console.log("Network: Base Sepolia");
        console.log("Domain: enrouteapp.eth");
        console.log("");
        console.log("Contract Addresses:");
        console.log("L2Registry:              ", address(l2Registry));
        console.log("EnRouteRegistry:         ", address(enRouteRegistry));
        console.log("PolicyFactory:           ", address(policyFactory));
        console.log("");
        console.log("Policy Implementations:");
        console.log("SchoolFeesPolicy:        ", address(schoolFeesImplementation));
        console.log("SavingsPolicy:           ", address(savingsImplementation));
        console.log("SplitPaymentPolicy:      ", address(splitPaymentImplementation));
        console.log("SimpleSplitPaymentPolicy:", address(simpleSplitImplementation));
        console.log("");
        console.log("Configuration:");
        console.log("Deployer:                ", deployer);
        console.log("Fee Recipient:           ", feeRecipient);
        console.log("L2Registry Owner:        ", l2Registry.owner());
        console.log("");
        console.log("Creation Fees:");
        console.log("SchoolFees:              0.002 ETH");
        console.log("Savings:                 0.001 ETH");
        console.log("SplitPayment:            0.003 ETH");
        console.log("SimpleSplitPayment:      0.001 ETH");
        console.log("");
        console.log("IMPORTANT - Manual Step Required:");
        console.log("The L2Registry owner needs to authorize EnRouteRegistry:");
        console.log("Command for L2Registry owner:");
        console.log("cast send", address(l2Registry));
        console.log('"addRegistrar(address)"', address(enRouteRegistry));
        console.log("--rpc-url $BASE_SEPOLIA_RPC_URL");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Execute the manual permission command above");
        console.log("2. Update your .env with these addresses");
        console.log("3. Verify contracts on Basescan");
        console.log("4. Test user registration and policy creation");
        console.log("5. Update frontend hooks with new addresses");
    }
}
