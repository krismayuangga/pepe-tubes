# PEPE Staking BSC

## Setup Development Environment

1. Install dependencies:
```bash
npm install
```

2. Copy .env.example ke .env dan isi dengan konfigurasi yang sesuai:
```bash
cp .env.example .env
```

3. Setup BSC Testnet di MetaMask:
- Network Name: BSC Testnet
- RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
- Chain ID: 97
- Currency Symbol: tBNB
- Block Explorer: https://testnet.bscscan.com

4. Dapatkan tBNB (BSC Testnet BNB) dari faucet:
- https://testnet.bnbchain.org/faucet-smart

## Development Commands

1. Run tests:
```bash
npx hardhat test
```

2. Deploy contracts ke BSC Testnet:
```bash
npx hardhat run scripts/deploy-bsc.js --network bscTestnet
```

3. Run frontend development server:
```bash
cd frontend
python3 -m http.server 8000
```

## Contract Interactions

1. Mint PEPE tokens:
```bash
npx hardhat run scripts/mint-pepe.js --network bscTestnet
```

2. Check PEPE balance:
```bash
npx hardhat run scripts/check-pepe-balance.js --network bscTestnet
```

3. Check staking status:
```bash
npx hardhat run scripts/check-stakes.js --network bscTestnet
```

## Deployed Contracts (BSC Testnet)

- PEPE Token: 0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5
- BSC PEPE Staking: 0x34b520567306EdF17CA642A2A8EB392fC7C7853C
- Dummy USDT: [Address akan ditambahkan setelah deployment]

## Pool Information

1. Pool 1: 1M PEPE → 7.5k USDT (1000 holders)
2. Pool 2: 2M PEPE → 20k USDT (500 holders)
3. Pool 3: 5M PEPE → 62.5k USDT (200 holders)
4. Pool 4: 10M PEPE → 150k USDT (100 holders)
5. Pool 5: 20M PEPE → 400k USDT (50 holders)
6. Pool 6: 50M PEPE → 1.25M USDT (20 holders)

## Testing Flow

1. Deploy contracts:
```bash
npx hardhat run scripts/deploy-bsc.js --network bscTestnet
```

2. Mint PEPE tokens untuk testing:
```bash
npx hardhat run scripts/mint-pepe.js --network bscTestnet
```

3. Deploy dan mint Dummy USDT:
```bash
npx hardhat run scripts/deploy-dummy-usdt.js --network bscTestnet
```

4. Fund staking contract dengan USDT:
```bash
npx hardhat run scripts/fund-staking-usdt.js --network bscTestnet
```

5. Buka frontend dan test staking:
```bash
cd frontend
python3 -m http.server 8000
```
Buka http://localhost:8000/bsc.html di browser

## Troubleshooting

1. Error "Insufficient funds":
- Pastikan wallet memiliki cukup tBNB untuk gas fee
- Dapatkan tBNB dari faucet: https://testnet.bnbchain.org/faucet-smart

2. Error "Transaction failed":
- Check gas price dan limit
- Pastikan contract address di bsc-config.js sudah benar
- Verify approval sudah dilakukan untuk PEPE token

3. Frontend tidak menampilkan data:
- Check browser console untuk error
- Pastikan wallet terhubung ke BSC Testnet
- Verify contract addresses di bsc-config.js

## Next Steps

1. Implement additional features:
- Emergency withdraw function
- Reward multiplier system
- Referral system

2. Security improvements:
- Add more unit tests
- Implement pausable mechanism
- Add rate limiting

3. Frontend enhancements:
- Add transaction history
- Implement better error handling
- Add loading indicators

4. Monitoring:
- Add event logging
- Implement analytics dashboard
- Monitor gas usage
