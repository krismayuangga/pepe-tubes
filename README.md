# PEPE Staking dApp

A decentralized application for staking PEPE tokens with 6 different staking pools on BSC Testnet.

## Features

- 6 Staking Pools with different APRs and lock periods:
  1. Pool 1: 1% daily, 7 days lock, min 1,000 PEPE
  2. Pool 2: 1.5% daily, 14 days lock, min 2,500 PEPE
  3. Pool 3: 2% daily, 30 days lock, min 5,000 PEPE
  4. Pool 4: 2.5% daily, 60 days lock, min 10,000 PEPE
  5. Pool 5: 3% daily, 90 days lock, min 25,000 PEPE
  6. Pool 6: 4% daily, 180 days lock, min 50,000 PEPE
- USDT rewards
- Modern UI with real-time updates
- MetaMask integration
- BSC Testnet support

## Prerequisites

- Node.js v16+ and npm
- MetaMask wallet
- BSC Testnet BNB for gas

## Installation

1. Clone the repository:
```bash
git clone https://github.com/krismayuangga/pepe-staking.git
cd pepe-staking
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
cp .env.example .env
```

4. Configure .env with your values:
```
PRIVATE_KEY=your_wallet_private_key
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=your_bscscan_api_key
```

## Deployment

1. Deploy to BSC Testnet:
```bash
npx hardhat run scripts/deploy-bsc.js --network bscTestnet
```

2. The script will:
   - Deploy PEPE Token, USDT Token, and Staking contract
   - Set up initial pool configurations
   - Verify contracts on BSCScan
   - Save deployment addresses to deployed-addresses.json

## Running the Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Start local server:
```bash
python3 -m http.server 8000
```

3. Access the dApp:
```
http://localhost:8000/bsc.html
```

## Smart Contracts

### BSCPEPEStaking.sol
- Main staking contract with 6 pools
- Configurable reward rates and lock periods
- Emergency withdrawal functionality
- Reentrancy protection

### PEPEToken.sol
- ERC20 token for PEPE
- Initial supply: 100 billion tokens
- Burn functionality

### DummyUSDT.sol
- ERC20 token for testing rewards
- Mintable by owner

## Testing

Run the test suite:
```bash
npx hardhat test
```

## BSC Testnet Details

- Network Name: BSC Testnet
- RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
- Chain ID: 97
- Currency Symbol: tBNB
- Block Explorer: https://testnet.bscscan.com

## Contract Addresses (BSC Testnet)

- PEPE Token: 0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5
- Staking Contract: 0x34b520567306EdF17CA642A2A8EB392fC7C7853C

## Using the dApp

1. Connect MetaMask to BSC Testnet

2. Get test BNB:
   - Visit https://testnet.bnbchain.org/faucet-smart
   - Enter your wallet address
   - Request test BNB

3. Get PEPE tokens:
   - Add PEPE token to MetaMask using contract address
   - Request tokens from contract owner

4. Staking:
   - Choose a staking pool
   - Enter amount to stake
   - Approve token spending
   - Confirm stake transaction

5. Managing Stakes:
   - Monitor rewards accumulation
   - Claim rewards when available
   - Unstake after lock period

## Security Considerations

- All contracts use OpenZeppelin's secure implementations
- ReentrancyGuard for stake/unstake functions
- Owner-only functions for critical operations
- Emergency withdrawal functionality
- Comprehensive test coverage

## Troubleshooting

1. MetaMask Connection Issues:
   - Ensure you're on BSC Testnet
   - Check if you have sufficient tBNB for gas

2. Transaction Failures:
   - Verify token approvals
   - Check minimum stake amounts
   - Ensure lock period has ended for unstaking

3. Rewards Not Showing:
   - Rewards are calculated in real-time
   - Minimum 24-hour period for first reward

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with details
3. Contact the development team

## License

MIT License
