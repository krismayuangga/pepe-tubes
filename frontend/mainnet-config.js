// BSC Mainnet Configuration - using window assignment directly
window.MAINNET_CONFIG = {
    chainId: '0x38', // 56 in hex
    chainName: 'BSC Mainnet',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com']
};

window.CONFIG = {
    pepeToken: {
        address: '0x00000000000000000000000000000000', // Replace with actual mainnet address after deployment
        abi: [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ]
    },
    usdt: {
        address: '0x55d398326f99059fF775485246999027B3197955', // Mainnet USDT (BSC)
        abi: [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ]
    },
    pepeStaking: {
        address: '0x00000000000000000000000000000000', // Replace with actual mainnet address after deployment
        abi: [
            "function stake(uint256 poolId, uint256 amount)",
            "function unstake(uint256 stakeIndex)",
            "function getUserStakes(address) view returns (tuple(uint256 amount, uint256 startTime, uint256 poolId, bool hasClaimedReward)[])",
            "function getAllPoolsInfo() view returns (tuple(uint256 minStakeAmount, uint256 maxHolders, uint256 rewardPerHolder, uint256 totalStaked, uint256 currentHolders, bool isActive)[])",
            "function LOCK_PERIOD() view returns (uint256)",
            "function owner() view returns (address)",
            "function isAdmin(address) view returns (bool)"
        ],
        pools: [
            { name: "Pool 1", minPepe: "1,000,000", reward: "7.5" },
            { name: "Pool 2", minPepe: "2,000,000", reward: "15" },
            { name: "Pool 3", minPepe: "5,000,000", reward: "45" },
            { name: "Pool 4", minPepe: "10,000,000", reward: "150" },
            { name: "Pool 5", minPepe: "20,000,000", reward: "360" },
            { name: "Pool 6", minPepe: "100,000,000", reward: "3,000" }
        ]
    }
};

// Set BSC_CONFIG based on which config file is loaded
window.BSC_CONFIG = window.MAINNET_CONFIG;
