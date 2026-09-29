// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {MiniCrowdfund}    from "../src/MiniCrowdfund.sol";

/**
 * @title  DeployMiniCrowdfund
 * @notice Foundry deployment script for MiniCrowdfund.
 *
 * Usage
 * ─────
 * Local Anvil:
 *   anvil                                  # start local node in another terminal
 *   forge script script/Deploy.s.sol \
 *     --rpc-url anvil \
 *     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 *     --broadcast
 *
 * Sepolia testnet (requires .env):
 *   source .env
 *   forge script script/Deploy.s.sol \
 *     --rpc-url $SEPOLIA_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $ETHERSCAN_API_KEY
 *
 * Environment variables (put in .env, never commit!):
 *   PRIVATE_KEY=0x...
 *   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
 *   ETHERSCAN_API_KEY=YOUR_KEY
 */
contract DeployMiniCrowdfund is Script {
    function run() external returns (MiniCrowdfund crowdfund) {
        // `vm.startBroadcast()` wraps all subsequent transactions so they are
        // signed and sent using the --private-key supplied to `forge script`.
        vm.startBroadcast();

        // Deploy the contract (no constructor arguments needed)
        crowdfund = new MiniCrowdfund();

        vm.stopBroadcast();

        // Log the deployed address – visible in the terminal output
        console2.log("MiniCrowdfund deployed at:", address(crowdfund));
        console2.log("Deployer               :", msg.sender);
        console2.log("Chain ID               :", block.chainid);
    }
}
