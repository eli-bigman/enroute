# EnRoute Contract Deployment

## Environment Variables Required

Create a `.env` file in the durin package directory with:

```bash
# Required
PRIVATE_KEY=0x... # Your deployer private key
DEPLOYER_ADDRESS=0x... # Your deployer address
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Optional
FEE_RECIPIENT=0x... # Address to receive policy creation fees (defaults to deployer)
ETHERSCAN_API_KEY=... # For contract verification on Basescan
```

## Deployment Commands

### 1. Test Deployment (Dry Run)
```bash
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --sender $DEPLOYER_ADDRESS
```

### 2. Deploy to Base Sepolia
```bash
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --sender $DEPLOYER_ADDRESS
```

### 3. Deploy + Verify Contracts
```bash
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY --sender $DEPLOYER_ADDRESS
```

## What You Need Before Deployment

### 1. **Wallet Setup**
- [ ] Private key for deployment wallet
- [ ] ETH on Base Sepolia for gas fees (~0.01 ETH should be enough)
- [ ] Get Base Sepolia ETH from: https://bridge.base.org/deposit

### 2. **RPC Access**
- [ ] Base Sepolia RPC URL (provided in script)
- [ ] Alternative: Alchemy/Infura Base Sepolia endpoint

### 3. **Verification (Optional)**
- [ ] Basescan API key from: https://basescan.org/apis

### 4. **Domain Configuration**
- [ ] Ensure you own or can use `enrouteapp.eth` domain
- [ ] Or modify the script to use a different domain

## Post-Deployment Steps

### 1. **Save Contract Addresses**
The script will output all contract addresses. Save them to your frontend `.env`:

```bash
# Add to packages/enroute/.env.local
NEXT_PUBLIC_L2_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_ENROUTE_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_POLICY_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_SCHOOL_FEES_IMPL_ADDRESS=0x...
NEXT_PUBLIC_SAVINGS_IMPL_ADDRESS=0x...
NEXT_PUBLIC_SPLIT_PAYMENT_IMPL_ADDRESS=0x...
```

### 2. **Update Frontend Configuration**
Update your wagmi config with the new contract addresses and ABIs.

### 3. **Test the Deployment**
- [ ] Register a test user
- [ ] Create a test policy
- [ ] Verify ENS resolution works

## Troubleshooting

### Common Issues:

1. **"Insufficient funds"**
   - Add more ETH to your deployer wallet

2. **"Domain already exists"**
   - The domain might already be registered
   - Choose a different domain or check ownership

3. **"Registry factory not found"**
   - Verify the Durin factory address is correct
   - Check you're on the right network

4. **"Verification failed"**
   - Add `--legacy` flag for older compilation
   - Try again without verification first

### Manual Verification
If auto-verification fails:
```bash
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> --chain-id 84532 --etherscan-api-key $ETHERSCAN_API_KEY
```

## Gas Estimates

Expected gas costs on Base Sepolia:
- L2Registry deployment: ~500K gas
- EnRouteRegistry: ~800K gas  
- PolicyFactory: ~600K gas
- Policy implementations: ~1.2M gas each
- Setup transactions: ~200K gas total

**Total estimated cost: ~0.005 ETH** (varies with gas prices)
