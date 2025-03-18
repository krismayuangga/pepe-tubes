// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BSCPEPEStaking is Ownable, ReentrancyGuard {
    struct Pool {
        uint256 minStakeAmount;
        uint256 maxHolders;
        uint256 rewardPerHolder;
        uint256 totalStaked;
        uint256 currentHolders;
        bool isActive;
    }

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 poolId;
        bool hasClaimedReward;
    }

    IERC20 public pepeToken;
    IERC20 public rewardToken;
    mapping(address => bool) public isAdmin;
    mapping(address => Stake[]) public userStakes;
    Pool[] public pools;

    uint256 public constant LOCK_PERIOD = 30 days;

    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 reward);
    event AdminSet(address indexed admin, bool status);
    event RewardTokenSet(address indexed token);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || owner() == msg.sender, "Not admin");
        _;
    }

    constructor(address _pepeToken) Ownable(msg.sender) {
        pepeToken = IERC20(_pepeToken);
        
        // Initialize pools
        pools.push(Pool(1_000_000 ether, 1000, 7_500 ether, 0, 0, true));     // Pool 1: 1M PEPE → 7.5k USDT
        pools.push(Pool(2_000_000 ether, 500, 20_000 ether, 0, 0, true));      // Pool 2: 2M PEPE → 20k USDT
        pools.push(Pool(5_000_000 ether, 200, 62_500 ether, 0, 0, true));      // Pool 3: 5M PEPE → 62.5k USDT
        pools.push(Pool(10_000_000 ether, 100, 150_000 ether, 0, 0, true));    // Pool 4: 10M PEPE → 150k USDT
        pools.push(Pool(20_000_000 ether, 50, 400_000 ether, 0, 0, true));     // Pool 5: 20M PEPE → 400k USDT
        pools.push(Pool(50_000_000 ether, 20, 1_250_000 ether, 0, 0, true));   // Pool 6: 50M PEPE → 1.25M USDT
    }

    function setAdmin(address admin, bool status) external onlyOwner {
        isAdmin[admin] = status;
        emit AdminSet(admin, status);
    }

    function setRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = IERC20(_rewardToken);
        emit RewardTokenSet(_rewardToken);
    }

    function stake(uint256 poolId) external nonReentrant {
        require(poolId < pools.length, "Invalid pool");
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(pool.currentHolders < pool.maxHolders, "Pool is full");
        
        Stake[] storage stakes = userStakes[msg.sender];
        for(uint i = 0; i < stakes.length; i++) {
            require(stakes[i].poolId != poolId || stakes[i].amount == 0, "Already staked in this pool");
        }

        require(pepeToken.transferFrom(msg.sender, address(this), pool.minStakeAmount), "Transfer failed");

        stakes.push(Stake({
            amount: pool.minStakeAmount,
            startTime: block.timestamp,
            poolId: poolId,
            hasClaimedReward: false
        }));

        pool.totalStaked += pool.minStakeAmount;
        pool.currentHolders++;

        emit Staked(msg.sender, poolId, pool.minStakeAmount);
    }

    function unstake(uint256 poolId) external nonReentrant {
        require(poolId < pools.length, "Invalid pool");
        Pool storage pool = pools[poolId];
        
        Stake[] storage stakes = userStakes[msg.sender];
        uint256 stakeIndex;
        bool found = false;
        
        for(uint i = 0; i < stakes.length; i++) {
            if(stakes[i].poolId == poolId && stakes[i].amount > 0) {
                stakeIndex = i;
                found = true;
                break;
            }
        }
        
        require(found, "No stake found");
        
        Stake storage userStake = stakes[stakeIndex];
        uint256 amount = userStake.amount;
        uint256 reward = 0;
        
        // Check if lock period is over
        if(block.timestamp >= userStake.startTime + LOCK_PERIOD && !userStake.hasClaimedReward) {
            reward = pool.rewardPerHolder;
            userStake.hasClaimedReward = true;
            require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
        }

        require(pepeToken.transfer(msg.sender, amount), "Transfer failed");
        
        pool.totalStaked -= amount;
        pool.currentHolders--;
        userStake.amount = 0;
        
        emit Unstaked(msg.sender, poolId, amount, reward);
    }

    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }

    function getPoolDetails(uint256 poolId) external view onlyAdmin returns (
        uint256 minStake,
        uint256 maxHolders,
        uint256 currentHolders,
        uint256 totalStaked,
        uint256 rewardPerHolder
    ) {
        require(poolId < pools.length, "Invalid pool");
        Pool storage pool = pools[poolId];
        return (
            pool.minStakeAmount,
            pool.maxHolders,
            pool.currentHolders,
            pool.totalStaked,
            pool.rewardPerHolder
        );
    }

    function getAllPoolsInfo() external view returns (Pool[] memory) {
        return pools;
    }

    // Emergency function to recover tokens
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
}
