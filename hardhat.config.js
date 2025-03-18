require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Pastikan untuk membuat file .env dengan variabel-variabel berikut:
// PRIVATE_KEY=your_wallet_private_key
// BSCSCAN_API_KEY=your_bscscan_api_key

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY
    }
  }
};
