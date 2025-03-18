// BSC Testnet Configuration
const CONFIG = {
    NETWORK: {
        chainId: '0x61',
        chainName: 'BSC Testnet',
        nativeCurrency: {
            name: 'tBNB',
            symbol: 'tBNB',
            decimals: 18
        },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        blockExplorerUrls: ['https://testnet.bscscan.com']
    },
    CONTRACTS: {
        PEPE_TOKEN: '0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5',
        PEPE_TOKEN_ABI: [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ]
    }
};

export default CONFIG;
