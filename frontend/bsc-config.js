const BSC_CONFIG = {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
};

const CONFIG = {
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
            "function stake(uint256 poolId)",
            "function unstake(uint256 poolId)",
            "function getAllPoolsInfo() view returns (tuple(uint256 minStakeAmount, uint256 maxHolders, uint256 rewardPerHolder, uint256 totalStaked, uint256 currentHolders, bool isActive)[])",
            "function getUserStakes(address) view returns (tuple(uint256 amount, uint256 startTime, uint256 poolId, bool hasClaimedReward)[])",
            "function isAdmin(address) view returns (bool)"
        ]
    },
    pools: [
        {
            name: "Pool 1",
            minPepe: "1,000,000",
            maxHolders: 1000,
            reward: "7,500"
        },
        {
            name: "Pool 2",
            minPepe: "2,000,000",
            maxHolders: 500,
            reward: "20,000"
        },
        {
            name: "Pool 3",
            minPepe: "5,000,000",
            maxHolders: 200,
            reward: "62,500"
        },
        {
            name: "Pool 4",
            minPepe: "10,000,000",
            maxHolders: 100,
            reward: "150,000"
        },
        {
            name: "Pool 5",
            minPepe: "20,000,000",
            maxHolders: 50,
            reward: "400,000"
        },
        {
            name: "Pool 6",
            minPepe: "50,000,000",
            maxHolders: 20,
            reward: "1,250,000"
        }
    ]
};
