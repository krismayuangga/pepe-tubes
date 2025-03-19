const BSC_CONFIG = {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://bsc-testnet.publicnode.com'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
};

const CONFIG = {
    pepeToken: {
        address: '0x578a700c214AF091d377f942c15A2413306006bc',
        abi: [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ]
    },
    pepeStaking: {
        address: '0x742Aa8421Ef6c0159B722AEFf3fAFbb6118400a5',
        abi: [
            "function stake(uint256 poolId, uint256 amount)",
            "function unstake(uint256 stakeIndex)",
            "function getAllPoolsInfo() view returns (tuple(uint256 minStakeAmount, uint256 maxHolders, uint256 rewardPerHolder, uint256 totalStaked, uint256 currentHolders, bool isActive)[])",
            "function getUserStakes(address) view returns (tuple(uint256 amount, uint256 startTime, uint256 poolId, bool hasClaimedReward)[])",
            "function isAdmin(address) view returns (bool)",
            "function owner() view returns (address)",
            "function getPoolStakes(uint256 poolId) view returns (tuple(address user, uint256 amount, uint256 startTime, bool hasClaimedReward)[])"
        ]
    },
    pools: [ // Pindahkan pools ke root CONFIG
        {
            name: "Pool #1",
            minPepe: "1,000,000",
            maxHolders: 1000,
            reward: "7.5"
        },
        {
            name: "Pool #2",
            minPepe: "2,000,000",
            maxHolders: 800,
            reward: "15"
        },
        {
            name: "Pool #3",
            minPepe: "5,000,000",
            maxHolders: 400,
            reward: "45"
        },
        {
            name: "Pool #4",
            minPepe: "10,000,000",
            maxHolders: 200,
            reward: "150"
        },
        {
            name: "Pool #5",
            minPepe: "20,000,000",
            maxHolders: 208,
            reward: "360"
        },
        {
            name: "Pool #6",
            minPepe: "100,000,000",
            maxHolders: 60,
            reward: "3000"
        }
    ],
    dummyUSDT: {
        // ...existing code...
    },
    CONTRACTS: {
        BSC_PEPE_STAKING: '0x742Aa8421Ef6c0159B722AEFf3fAFbb6118400a5'
    }
};
