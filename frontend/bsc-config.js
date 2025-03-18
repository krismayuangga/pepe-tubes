const BSC_CONFIG = {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: {
        name: 'tBNB',
        symbol: 'tBNB',
        decimals: 18
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    contracts: {
        pepeToken: {
            address: '0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5',
            abi: [
                "function balanceOf(address) view returns (uint256)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "function decimals() view returns (uint8)"
            ]
        },
        pepeStaking: {
            address: '0x34b520567306EdF17CA642A2A8EB392fC7C7853C',
            abi: [
                "function stake(uint256 amount)",
                "function unstake()",
                "function claimReward()",
                "function calculateReward(address) view returns (uint256)",
                "function stakes(address) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime)",
                "function totalStaked() view returns (uint256)",
                "function rewardToken() view returns (address)",
                "function rewardRate() view returns (uint256)"
            ]
        }
    }
};
