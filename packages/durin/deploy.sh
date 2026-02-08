#!/bin/bash

# EnRoute Contract Deployment Helper
# This script helps you deploy the EnRoute contracts to Base Sepolia

set -e

echo "🚀 EnRoute Contract Deployment Helper"
echo "====================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📋 Please copy .env.example to .env and fill in your values:"
    echo "   cp .env.example .env"
    echo ""
    echo "📝 Required variables:"
    echo "   - PRIVATE_KEY (your deployer wallet private key)"
    echo "   - DEPLOYER_ADDRESS (your deployer wallet address)"
    echo "   - BASE_SEPOLIA_RPC_URL (Base Sepolia RPC endpoint)"
    echo ""
    echo "📝 Optional variables:"
    echo "   - FEE_RECIPIENT (address to receive fees, defaults to deployer)"
    echo "   - ETHERSCAN_API_KEY (for contract verification)"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$DEPLOYER_ADDRESS" ]; then
    echo "❌ DEPLOYER_ADDRESS not set in .env"
    exit 1
fi

if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
    echo "❌ BASE_SEPOLIA_RPC_URL not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📍 Deployer: $DEPLOYER_ADDRESS"
echo "🌐 Network: Base Sepolia"
echo ""

# Check deployer balance
echo "💰 Checking deployer balance..."
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL)
BALANCE_ETH=$(cast to-unit $BALANCE ether)
echo "💳 Balance: $BALANCE_ETH ETH"

# Check if balance is sufficient
MIN_BALANCE="5000000000000000" # 0.005 ETH in wei
if [ "$(echo "$BALANCE < $MIN_BALANCE" | bc)" -eq 1 ]; then
    echo "⚠️  Warning: Low balance. You may need more ETH for deployment."
    echo "📲 Get testnet ETH from: https://bridge.base.org/deposit"
fi

echo ""

# Ask for deployment type
echo "🎯 Choose deployment option:"
echo "1) Dry run (simulate deployment)"
echo "2) Deploy contracts"
echo "3) Deploy + verify contracts"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🧪 Running deployment simulation..."
        forge script script/Deploy.s.sol \
            --rpc-url $BASE_SEPOLIA_RPC_URL \
            --sender $DEPLOYER_ADDRESS
        ;;
    2)
        echo "🚀 Deploying contracts..."
        forge script script/Deploy.s.sol \
            --rpc-url $BASE_SEPOLIA_RPC_URL \
            --broadcast \
            --sender $DEPLOYER_ADDRESS
        ;;
    3)
        if [ -z "$ETHERSCAN_API_KEY" ]; then
            echo "❌ ETHERSCAN_API_KEY required for verification"
            exit 1
        fi
        echo "🚀 Deploying and verifying contracts..."
        forge script script/Deploy.s.sol \
            --rpc-url $BASE_SEPOLIA_RPC_URL \
            --broadcast \
            --verify \
            --etherscan-api-key $ETHERSCAN_API_KEY \
            --sender $DEPLOYER_ADDRESS
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

if [ $choice -ne 1 ]; then
    echo ""
    echo "✅ Deployment completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy the contract addresses to your frontend .env"
    echo "2. Update your wagmi configuration"
    echo "3. Test user registration and policy creation"
    echo "4. Verify contracts on Basescan if not done automatically"
    echo ""
    echo "🔗 Useful links:"
    echo "   Base Sepolia Explorer: https://sepolia.basescan.org/"
    echo "   Bridge for testnet ETH: https://bridge.base.org/deposit"
fi
