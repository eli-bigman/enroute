# EnRoute Contract Deployment Helper (PowerShell)
# This script helps you deploy the EnRoute contracts to Base Sepolia

Write-Host "🚀 EnRoute Contract Deployment Helper" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "📋 Please copy .env.example to .env and fill in your values:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Required variables:" -ForegroundColor Yellow
    Write-Host "   - PRIVATE_KEY (your deployer wallet private key)" -ForegroundColor Gray
    Write-Host "   - DEPLOYER_ADDRESS (your deployer wallet address)" -ForegroundColor Gray
    Write-Host "   - BASE_SEPOLIA_RPC_URL (Base Sepolia RPC endpoint)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Optional variables:" -ForegroundColor Yellow
    Write-Host "   - FEE_RECIPIENT (address to receive fees, defaults to deployer)" -ForegroundColor Gray
    Write-Host "   - ETHERSCAN_API_KEY (for contract verification)" -ForegroundColor Gray
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^#=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

$PRIVATE_KEY = $env:PRIVATE_KEY
$DEPLOYER_ADDRESS = $env:DEPLOYER_ADDRESS
$BASE_SEPOLIA_RPC_URL = $env:BASE_SEPOLIA_RPC_URL
$ETHERSCAN_API_KEY = $env:ETHERSCAN_API_KEY

# Check required variables
if (-not $PRIVATE_KEY) {
    Write-Host "❌ PRIVATE_KEY not set in .env" -ForegroundColor Red
    exit 1
}

if (-not $DEPLOYER_ADDRESS) {
    Write-Host "❌ DEPLOYER_ADDRESS not set in .env" -ForegroundColor Red
    exit 1
}

if (-not $BASE_SEPOLIA_RPC_URL) {
    Write-Host "❌ BASE_SEPOLIA_RPC_URL not set in .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green
Write-Host "📍 Deployer: $DEPLOYER_ADDRESS" -ForegroundColor Gray
Write-Host "🌐 Network: Base Sepolia" -ForegroundColor Gray
Write-Host ""

# Check deployer balance
Write-Host "💰 Checking deployer balance..." -ForegroundColor Yellow
try {
    $balance = & cast balance $DEPLOYER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL
    $balanceEth = & cast to-unit $balance ether
    Write-Host "💳 Balance: $balanceEth ETH" -ForegroundColor Green
    
    # Check if balance is sufficient (0.005 ETH minimum)
    $balanceFloat = [float]$balanceEth
    if ($balanceFloat -lt 0.005) {
        Write-Host "⚠️  Warning: Low balance. You may need more ETH for deployment." -ForegroundColor Yellow
        Write-Host "📲 Get testnet ETH from: https://bridge.base.org/deposit" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not check balance. Continuing with deployment..." -ForegroundColor Yellow
}

Write-Host ""

# Ask for deployment type
Write-Host "🎯 Choose deployment option:" -ForegroundColor Cyan
Write-Host "1) Dry run (simulate deployment)" -ForegroundColor Gray
Write-Host "2) Deploy contracts" -ForegroundColor Gray
Write-Host "3) Deploy + verify contracts" -ForegroundColor Gray
Write-Host ""
$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🧪 Running deployment simulation..." -ForegroundColor Yellow
        & forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --sender $DEPLOYER_ADDRESS
    }
    "2" {
        Write-Host "🚀 Deploying contracts..." -ForegroundColor Yellow
        & forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --sender $DEPLOYER_ADDRESS
    }
    "3" {
        if (-not $ETHERSCAN_API_KEY) {
            Write-Host "❌ ETHERSCAN_API_KEY required for verification" -ForegroundColor Red
            exit 1
        }
        Write-Host "🚀 Deploying and verifying contracts..." -ForegroundColor Yellow
        & forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY --sender $DEPLOYER_ADDRESS
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

if ($choice -ne "1") {
    Write-Host ""
    Write-Host "✅ Deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the contract addresses to your frontend .env" -ForegroundColor Gray
    Write-Host "2. Update your wagmi configuration" -ForegroundColor Gray
    Write-Host "3. Test user registration and policy creation" -ForegroundColor Gray
    Write-Host "4. Verify contracts on Basescan if not done automatically" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔗 Useful links:" -ForegroundColor Cyan
    Write-Host "   Base Sepolia Explorer: https://sepolia.basescan.org/" -ForegroundColor Gray
    Write-Host "   Bridge for testnet ETH: https://bridge.base.org/deposit" -ForegroundColor Gray
}
