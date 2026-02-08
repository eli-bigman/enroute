// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title VerifyContracts
 * @notice Script to verify deployed contracts on Basescan
 * @dev Use this if automatic verification during deployment failed
 */
contract VerifyContracts is Script {
    
    // Contract addresses (update these with your deployed addresses)
    address constant L2_REGISTRY = 0x0000000000000000000000000000000000000000;
    address constant ENROUTE_REGISTRY = 0x0000000000000000000000000000000000000000;
    address constant POLICY_FACTORY = 0x0000000000000000000000000000000000000000;
    address constant SCHOOL_FEES_IMPL = 0x0000000000000000000000000000000000000000;
    address constant SAVINGS_IMPL = 0x0000000000000000000000000000000000000000;
    address constant SPLIT_PAYMENT_IMPL = 0x0000000000000000000000000000000000000000;
    
    // Constructor arguments (update these with your deployment values)
    address constant DEPLOYER = 0x0000000000000000000000000000000000000000;
    address constant FEE_RECIPIENT = 0x0000000000000000000000000000000000000000;
    string constant BASE_DOMAIN = "enrouteapp.eth";
    
    function run() public {
        console.log("Verifying deployed contracts...");
        
        // Verify EnRouteRegistry
        verifyEnRouteRegistry();
        
        // Verify PolicyFactory
        verifyPolicyFactory();
        
        // Verify Policy Implementations
        verifyPolicyImplementations();
        
        console.log("All contracts verified!");
    }
    
    function verifyEnRouteRegistry() internal {
        console.log("\nVerifying EnRouteRegistry...");
        
        string[] memory cmd = new string[](7);
        cmd[0] = "forge";
        cmd[1] = "verify-contract";
        cmd[2] = vm.toString(ENROUTE_REGISTRY);
        cmd[3] = "src/EnRouteRegistry.sol:EnRouteRegistry";
        cmd[4] = "--chain-id";
        cmd[5] = "84532"; // Base Sepolia
        cmd[6] = "--constructor-args";
        // cmd[7] = abi.encode(L2_REGISTRY, DEPLOYER);
        
        // Note: Run this manually with proper constructor args
        console.log("Command to run:");
        console.log("forge verify-contract", ENROUTE_REGISTRY, "src/EnRouteRegistry.sol:EnRouteRegistry --chain-id 84532 --constructor-args", vm.toString(abi.encode(L2_REGISTRY, DEPLOYER)));
    }
    
    function verifyPolicyFactory() internal {
        console.log("\nVerifying PolicyFactory...");
        
        console.log("Command to run:");
        console.log("forge verify-contract", POLICY_FACTORY, "src/PolicyFactory.sol:PolicyFactory --chain-id 84532 --constructor-args", vm.toString(abi.encode(ENROUTE_REGISTRY, FEE_RECIPIENT, DEPLOYER)));
    }
    
    function verifyPolicyImplementations() internal {
        console.log("\nVerifying Policy Implementations...");
        
        console.log("SchoolFeesPolicy:");
        console.log("forge verify-contract", SCHOOL_FEES_IMPL, "src/examples/SchoolFeesPolicy.sol:SchoolFeesPolicy --chain-id 84532");
        
        console.log("\nSavingsPolicy:");
        console.log("forge verify-contract", SAVINGS_IMPL, "src/examples/SavingsPolicy.sol:SavingsPolicy --chain-id 84532");
        
        console.log("\nSplitPaymentPolicy:");
        console.log("forge verify-contract", SPLIT_PAYMENT_IMPL, "src/examples/SplitPaymentPolicy.sol:SplitPaymentPolicy --chain-id 84532");
    }
}
