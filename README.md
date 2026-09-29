# MiniCrowdfund

A **production-quality, beginner-friendly** decentralised crowdfunding smart contract built with Solidity and Foundry.

Campaign creators set a goal and deadline. Contributors send ETH. If the goal is met the creator withdraws. If not, contributors can claim full refunds — all enforced trustlessly on-chain.

---

## 🚀 Live Deployment — Sepolia Testnet

> Contract successfully deployed and live on Ethereum Sepolia testnet.

| Detail | Value |
|---|---|
| **Network** | Ethereum Sepolia Testnet (Chain ID: 11155111) |
| **Contract Address** | `0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3` |
| **Deployer Address** | `0x942eef580dc77411687647a6d97c6dcfd25868af` |
| **Transaction Hash** | `0x90c2173e6ba25382a3859320d47676a7bcd34df0c51d1038693b24018d3d54cc` |
| **Etherscan** | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3) |
| **Transaction** | [View Deployment Tx](https://sepolia.etherscan.io/tx/0x90c2173e6ba25382a3859320d47676a7bcd34df0c51d1038693b24018d3d54cc) |
| **Deployed At** | 2026-09-28 |
| **Solidity Version** | `^0.8.20` |
| **Optimizer** | Enabled (200 runs) |

### Interact directly on Sepolia

Use these environment variables (set in `.env`) and the `cast` commands in the [Example Usage](#️-example-usage-with-cast) section below, replacing `CONTRACT_ADDR` with the address above.

```bash
export CONTRACT_ADDR=0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3
```

---

## 📁 Project Structure

```
MiniCrowdfund/
├── src/
│   └── MiniCrowdfund.sol     ← The main smart contract
├── test/
│   └── MiniCrowdfund.t.sol   ← 37 unit + fuzz tests (100% line coverage)
├── script/
│   └── Deploy.s.sol          ← Deployment script
├── broadcast/                ← Foundry deployment receipts (auto-generated)
│   └── Deploy.s.sol/
│       └── 11155111/
│           └── run-latest.json
├── lib/
│   └── forge-std/            ← Foundry standard library (auto-installed)
├── foundry.toml              ← Foundry configuration
├── .env.example              ← Environment variable template
└── README.md                 ← This file
```

---

## 🚀 Quick Start

### Prerequisites

Install Foundry (one command):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install dependencies
```bash
forge install   # installs forge-std if not already present
```

### Compile
```bash
forge build
```

### Run all tests
```bash
forge test
```

### Run tests with verbose output (see console logs)
```bash
forge test -vvv
```

### Run tests with gas report
```bash
forge test --gas-report
```

### Run only a specific test
```bash
forge test --match-test test_withdraw_succeeds -vvv
```

---

## 🧪 Test Coverage

```bash
forge coverage
```

**Results: 100% line coverage on `src/MiniCrowdfund.sol`**

```
╭-----------------------+-----------------+----------------+----------------+-----------------╮
| File                  | % Lines         | % Statements   | % Branches     | % Funcs         |
+=============================================================================================+
| src/MiniCrowdfund.sol | 100.00% (72/72) | 97.50% (78/80) | 86.67% (13/15) | 100.00% (11/11) |
╰-----------------------+-----------------+----------------+----------------+-----------------╯
```

The test suite covers:

| Category | Tests |
|---|---|
| Campaign creation | valid creation, multiple IDs, zero goal revert, short duration revert |
| Contributions | single, multiple contributors, same sender accumulation, after deadline revert, zero value revert, invalid campaign ID |
| Withdrawal | success path, not creator, before deadline, goal not reached, double withdraw |
| Refunds | success path, multiple contributors, before deadline, goal reached, no contribution, double refund |
| View functions | isSuccessful, isFailed, timeLeft, totalCampaigns, invalid ID |
| Integration | successful campaign E2E, failed campaign E2E, overfunded, two concurrent campaigns |
| Fuzz | createCampaign (goal + duration), contribute (amount) |

---

## 🌐 Deployment

### 1. Local (Anvil)

Open **two** terminals:

**Terminal 1** — start local blockchain:
```bash
anvil
```
> Anvil will print 10 test accounts each with 10 000 ETH. Copy the **first private key**.

**Terminal 2** — deploy:
```bash
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### 2. Sepolia Testnet

1. Copy the `.env` template:
   ```bash
   cp .env.example .env
   ```
2. Fill in your values:
   ```
   PRIVATE_KEY=0x...           # your wallet private key (never share!)
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ETHERSCAN_API_KEY=YOUR_KEY
   ```
3. Get test ETH from the [Sepolia faucet](https://sepoliafaucet.com/).
4. Deploy and verify:
   ```bash
   source .env
   forge script script/Deploy.s.sol \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY \
     --broadcast \
     --verify \
     --etherscan-api-key $ETHERSCAN_API_KEY
   ```

### 3. Verify an Already-Deployed Contract

If verification failed during deployment (e.g., Etherscan API issue), re-run it separately:
```bash
source .env
forge verify-contract \
  0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3 \
  src/MiniCrowdfund.sol:MiniCrowdfund \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url "https://api.etherscan.io/v2/api?chainid=11155111"
```

> **Note:** Use the Etherscan **V2 API** URL (`https://api.etherscan.io/v2/api?chainid=11155111`). The old V1 endpoint (`api-sepolia.etherscan.io`) is deprecated.

---

## 🛠️ Example Usage with `cast`

After deployment, set the contract address:
```bash
export CONTRACT_ADDR=0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3
source .env
```

```bash
# --- Create a campaign ---
cast send $CONTRACT_ADDR \
  "createCampaign(string,string,uint256,uint256)" \
  "Build a School" "Funding a primary school" \
  10000000000000000000 \
  604800 \
  --private-key $PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL

# --- Contribute 1 ETH ---
cast send $CONTRACT_ADDR \
  "contribute(uint256)" 0 \
  --value 1ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL

# --- View campaign details ---
cast call $CONTRACT_ADDR \
  "getCampaign(uint256)(address,string,string,uint256,uint256,uint256,bool)" 0 \
  --rpc-url $SEPOLIA_RPC_URL

# --- Check time left ---
cast call $CONTRACT_ADDR \
  "timeLeft(uint256)(uint256)" 0 \
  --rpc-url $SEPOLIA_RPC_URL

# --- Withdraw (after deadline, if goal met) ---
cast send $CONTRACT_ADDR \
  "withdraw(uint256)" 0 \
  --private-key $PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL

# --- Refund (after deadline, if goal NOT met) ---
cast send $CONTRACT_ADDR \
  "refund(uint256)" 0 \
  --private-key $PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL
```

---

## 📖 Key Concepts Explained

### 1. Checks-Effects-Interactions (CEI) Pattern

Every state-changing function follows this order:

```
CHECKS   → validate all conditions (revert early if invalid)
EFFECTS  → update contract state
INTERACTIONS → call external contracts / transfer ETH
```

This prevents **reentrancy attacks**: if an external call tries to re-enter the contract, the state has already been updated so it will see the correct (post-update) values.

### 2. Pull-Over-Push for Refunds

Instead of the contract pushing ETH to every contributor (which could fail if one address is a contract that rejects ETH), each contributor **pulls** their own refund by calling `refund()`. This isolates failures to individual users.

### 3. Custom Errors

```solidity
error GoalMustBeGreaterThanZero();          // 4 bytes on-chain
require(_goal > 0, "Goal must be > 0");    // ~30 bytes on-chain
```

Custom errors are **cheaper to deploy and to revert with** because they don't store long strings in bytecode.

### 4. Events for Transparency

Every important state change emits an event. Off-chain apps (frontends, indexers like The Graph) listen to events to track history without scanning raw storage.

### 5. Struct with Mapping

Solidity allows mappings inside structs — but those structs **cannot be returned from external functions**. That's why `getCampaign()` returns the scalar fields only, and we have a separate `getContribution()` view.

---

## 🔒 Security Notes

| Risk | Mitigation |
|---|---|
| **Reentrancy** | CEI pattern: state is zeroed before the external `call{}()` |
| **Integer overflow** | Solidity 0.8+ reverts on overflow automatically |
| **Timestamp manipulation** | Block timestamp can be shifted ~15s by miners — use only for deadlines measured in minutes or more |
| **Selfdestruct griefing** | Contract has no selfdestruct; ETH sent directly bypasses `contribute()` but does not break accounting |
| **Zero-address creator** | `msg.sender` is never the zero address in a normal transaction |
| **ETH transfer failure** | `TransferFailed` custom error is thrown if the low-level call returns false |
| **Front-running** | Campaign IDs are sequential — not a concern for this use case |

---

## 🗺️ Roadmap

- [x] Smart contract (MiniCrowdfund.sol)
- [x] Comprehensive Foundry tests (37 tests, 100% line coverage)
- [x] Deployment script (local + Sepolia)
- [x] **Deployed to Sepolia testnet** → `0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3`
- [ ] Phase 2: Source code verification on Etherscan
- [ ] Phase 3: Minimal React/Wagmi frontend dApp
- [ ] Phase 4: The Graph subgraph for indexing events
- [ ] Phase 5: IPFS integration for off-chain campaign metadata

---

## 📄 License

MIT
