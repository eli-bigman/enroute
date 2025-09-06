# EnRoute Integration with Durin: Complete Setup Guide

## Overview
This guide will help you integrate your EnRoute app with Durin to enable:
- ✅ Automatic subname issuance (`alice.enrouteapp.eth`)
- ✅ Policy subnames (`schoolfees.alice.enrouteapp.eth`)
- ✅ Subname → contract routing (each policy resolves to its smart contract)
- ✅ ENS Resolver compatibility
- ✅ Custom payment logic contracts

**Target Network:** Base Sepolia Testnet  
**Production Network:** Base Mainnet

---

## Prerequisites

### What You'll Need:
- [ ] ENS name (either `enrouteapp.eth` or a subdomain for testing)
- [ ] Base Sepolia ETH for deployment
- [ ] Etherscan API key
- [ ] WalletConnect Project ID
- [ ] Foundry installed
- [ ] Node.js and npm/bun

### Required Accounts & Services:
1. **ENS Domain** - [app.ens.domains](https://app.ens.domains)
2. **Etherscan API** - [etherscan.io/apis](https://etherscan.io/apis)
3. **WalletConnect** - [cloud.walletconnect.com](https://cloud.walletconnect.com)
4. **Base Faucet** - [bridge.base.org](https://bridge.base.org) (for testnet ETH)

---

## Phase 1: Environment Setup

### Step 1: Install Foundry (Windows)
```powershell
# Install foundryup
curl -L https://foundry.paradigm.xyz | bash

# Install foundry tools
foundryup
```

### Step 2: Setup Environment Variables

#### For Durin (`packages/durin/.env`):
```bash
# Copy example file
cp .env.example .env

# Edit with your values:
L2_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_basescan_api_key
PRIVATE_KEY=0x_your_development_wallet_private_key

# Will be filled after deployment:
L2_REGISTRY_ADDRESS=
ENROUTE_REGISTRY_ADDRESS=
POLICY_FACTORY_ADDRESS=
```

#### For EnRoute Frontend (`packages/enroute/.env.local`):
```bash
# Copy example file
cp .env.local.example .env.local

# Edit with your values:
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_L2_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532

# Will be filled after deployment:
NEXT_PUBLIC_ENROUTE_REGISTRY_ADDRESS=
NEXT_PUBLIC_POLICY_FACTORY_ADDRESS=
NEXT_PUBLIC_ENS_DOMAIN=enrouteapp.eth
```

### Step 3: Get Required API Keys

#### Etherscan API Key:
1. Go to [basescan.org](https://basescan.org) (for Base)
2. Create account → My API Keys → Add New API Key
3. Copy the generated key

#### WalletConnect Project ID:
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create account → New Project
3. Copy your Project ID

#### Base Sepolia ETH:
1. Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
2. Bridge to Base Sepolia at [bridge.base.org](https://bridge.base.org)

---

## Phase 2: ENS Domain Setup

### Option A: Using Durin.dev (Recommended for Testing)

1. **Visit Durin.dev**
   - Go to [durin.dev](https://durin.dev)
   - Connect your wallet
   - **This can automate steps 1-4 of the manual process below**

2. **Select Domain & Chain**
   - Choose your ENS name (or use a test domain)
   - Select "Base Sepolia" as target chain
   - Click "Deploy Registry"

3. **Deploy L2 Registry**
   - Durin.dev will deploy the L2Registry contract for you
   - Copy the deployed registry address to your `.env` files

4. **Configure L1 Resolver**
   - Durin.dev will guide you through updating your ENS resolver
   - This connects your ENS name to the L2 registry

### Option B: Manual ENS Setup

#### Get ENS Domain:
**For Production:**
1. Go to [app.ens.domains](https://app.ens.domains)
2. Search and register `enrouteapp.eth` (~$640/year)

**For Development:**
1. Use a subdomain of an existing ENS you own
2. Or use `test.eth` for local development

#### Get ENS Node Hash:
```javascript
// In browser console or Node.js
const { namehash } = require('@ensdomains/ensjs/utils/normalise');
console.log(namehash('enrouteapp.eth'));
// Copy this hash to NEXT_PUBLIC_BASE_NODE
```

---

## Phase 3: Smart Contract Development

### Step 1: Create EnRoute-Specific Contracts

Navigate to Durin directory:
```bash
cd packages/durin
```

#### Create `src/EnRouteRegistry.sol`:
- Extends L2Registry with auto-registration features
- Handles username → subname mapping
- Manages policy subname creation
- **Note:** You can use Durin.dev's registry or customize this further

#### Create `src/PolicyFactory.sol`:
- Factory for creating policy contracts
- Templates for different policy types (school fees, savings, etc.)

#### Create Policy Examples:
- `src/examples/SchoolFeesPolicy.sol`
- `src/examples/SavingsPolicy.sol`
- `src/examples/SplitPaymentPolicy.sol`

### Step 2: Create Deployment Scripts

#### Create `scripts/DeployEnRoute.s.sol`:
```solidity
// Deployment script for all EnRoute contracts
// Will deploy: EnRouteRegistry, PolicyFactory, Example Policies
```

### Step 3: Build and Test
```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test
```

---

## Phase 4: Contract Deployment

### Option A: Using Durin.dev (Partially Automated)

1. **Use Durin.dev for Base Registry**
   - Complete steps 1-4 on durin.dev
   - This gives you the L2Registry address

2. **Deploy EnRoute Extensions Manually**
   ```bash
   cd packages/durin
   
   # Deploy your custom contracts
   forge script scripts/DeployEnRoute.s.sol \
     --rpc-url $L2_RPC_URL \
     --private-key $PRIVATE_KEY \
     --broadcast \
     --verify
   ```

### Option B: Full Manual Deployment

```bash
cd packages/durin

# 1. Deploy base L2 contracts
forge script scripts/DeployL2Contracts.s.sol \
  --rpc-url $L2_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# 2. Deploy EnRoute extensions
forge script scripts/DeployEnRoute.s.sol \
  --rpc-url $L2_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Step 3: Update Environment Variables
After deployment, update both `.env` files with the deployed contract addresses.

---

## Phase 5: Frontend Integration

### Step 1: Generate Contract ABIs
```bash
cd packages/enroute

# Copy ABIs from Durin build
cp ../durin/out/EnRouteRegistry.sol/EnRouteRegistry.json generated/contract-abis/
cp ../durin/out/PolicyFactory.sol/PolicyFactory.json generated/contract-abis/
```

### Step 2: Create Custom Hooks

#### Create `hooks/use-enroute-registry.ts`:
- Contract interaction hooks
- Username registration logic
- Policy creation functions

#### Create `hooks/use-ens-resolution.ts`:
- ENS resolution utilities
- Policy subname resolution

### Step 3: Update UI Components

#### Modify `components/screens/connect-screen.tsx`:
- Add EnRoute registry integration
- Username registration flow
- Error handling

#### Create Policy Management UI:
- `components/policy/PolicyCreator.tsx`
- `components/policy/PolicyList.tsx`
- `components/policy/PolicyCard.tsx`

---

## Phase 6: Testing & Verification

### Step 1: Test Username Registration
1. Connect wallet to your app
2. Enter username (e.g., "alice")
3. Verify `alice.enrouteapp.eth` is created
4. Check on [basescan.org](https://basescan.org)

### Step 2: Test Policy Creation
1. Create a policy (e.g., "schoolfees")
2. Verify `schoolfees.alice.enrouteapp.eth` resolves to policy contract
3. Test policy contract functions

### Step 3: Test ENS Resolution
```bash
# Test with dig or online ENS resolver
dig schoolfees.alice.enrouteapp.eth
```

---

## Phase 7: Production Deployment

### Step 1: Deploy to Base Mainnet
- Update RPC URLs to Base mainnet
- Update contract addresses
- Ensure you have real ETH for gas

### Step 2: Production ENS Setup
- Register `enrouteapp.eth` on mainnet
- Update resolver to production contract
- Configure production gateway

---

## Key Resources

- **Durin Documentation:** [durin.dev](https://durin.dev)
- **Durin GitHub:** [github.com/namestonehq/durin](https://github.com/namestonehq/durin)
- **ENS Documentation:** [docs.ens.domains](https://docs.ens.domains)
- **Base Documentation:** [docs.base.org](https://docs.base.org)
- **Foundry Book:** [book.getfoundry.sh](https://book.getfoundry.sh)

## Support

- **Durin Support:** Slobo on [Telegram](https://t.me/superslobo)
- **ENS Discord:** [discord.gg/ensdomains](https://discord.gg/ensdomains)
- **Base Discord:** [discord.gg/buildonbase](https://discord.gg/buildonbase)

---

## Quick Start Summary

1. **Setup:** Install Foundry, get API keys, setup env files
2. **Domain:** Use durin.dev to deploy L2 registry (automated)
3. **Contracts:** Create and deploy EnRoute-specific contracts
4. **Frontend:** Integrate contracts with React hooks
5. **Test:** Verify username and policy creation works
6. **Deploy:** Move to Base mainnet for production

**Estimated Time:** 2-4 hours for full setup (depending on ENS domain acquisition)

---

*This guide assumes you'll use durin.dev for the base ENS infrastructure setup, which automates the complex L1 resolver configuration. Focus your custom development on the EnRoute-specific features: automatic registration, policy contracts, and payment logic.*
