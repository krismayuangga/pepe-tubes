const BSC_CONFIG = {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://bsc-testnet.publicnode.com'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
};

const CONFIG = {
    pepeToken: {
        address: '0x578a700c214AF091d377f942c15A2413306006bc', // Update with new address
        abi: [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ]
    },
    pepeStaking: {
        address: '0x742Aa8421Ef6c0159B722AEFf3fAFbb6118400a5', // Updated address
        abi: [
            "function setAdmin(address admin, bool status)",
            "function setRewardToken(address token)",
            "function getAllPoolsInfo() view returns (tuple(uint256 minStakeAmount, uint256 maxHolders, uint256 rewardPerHolder, uint256 totalStaked, uint256 currentHolders, bool isActive)[])",
            "function getUserStakes(address) view returns (tuple(uint256 amount, uint256 startTime, uint256 poolId, bool hasClaimedReward)[])",
            "function isAdmin(address) view returns (bool)",
            "function owner() view returns (address)",
            "function getPoolStakes(uint256 poolId) view returns (tuple(address user, uint256 amount, uint256 startTime, bool hasClaimedReward)[])",
            "function setWhitelist(address user, bool status) external",
            "function isWhitelisted(address) view returns (bool)",
            "event Staked(address indexed user, uint256 indexed poolId, uint256 amount)",
            "event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 reward)",
            "function addUSDT(uint256 amount)",
            "function emergencyPause()",
            "function distributeRewards()"
        ]
    },
    dummyUSDT: {
        address: '0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244',
        abi: [
            "function balanceOf(address) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ]
    }
};
