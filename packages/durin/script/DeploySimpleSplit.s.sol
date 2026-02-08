// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SimpleSplitPaymentPolicy} from "../src/examples/SimpleSplitPaymentPolicy.sol";

contract DeploySimpleSplitScript is Script {
    function run() public {
        vm.startBroadcast();
        
        console.log("Deploying SimpleSplitPaymentPolicy...");
        console.log("Deployer:", msg.sender);
        console.log("Block number:", block.number);
        console.log("Chain ID:", block.chainid);
        
        // Deploy SimpleSplitPaymentPolicy implementation
        SimpleSplitPaymentPolicy implementation = new SimpleSplitPaymentPolicy();
        
        console.log("SimpleSplitPaymentPolicy deployed at:", address(implementation));
        
        vm.stopBroadcast();
        
        console.log("\nDeployment completed!");
        console.log("New implementation address:", address(implementation));
        console.log("\nNext step: Update PolicyFactory template with this new address");
    }
}
