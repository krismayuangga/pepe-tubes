// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
/$$$$$$$  /$$$$$$$$ /$$$$$$$  /$$$$$$$$       /$$$$$$$$ /$$   /$$ /$$$$$$$  /$$$$$$$$  /$$$$$$ 
| $$__  $$| $$_____/| $$__  $$| $$_____/      |__  $$__/| $$  | $$| $$__  $$| $$_____/ /$$__  $$
| $$  \ $$| $$      | $$  \ $$| $$               | $$   | $$  | $$| $$  \ $$| $$      | $$  \__/
| $$$$$$$/| $$$$$   | $$$$$$$/| $$$$$            | $$   | $$  | $$| $$$$$$$ | $$$$$   |  $$$$$$ 
| $$____/ | $$__/   | $$____/ | $$__/            | $$   | $$  | $$| $$__  $$| $$__/    \____  $$
| $$      | $$      | $$      | $$               | $$   | $$  | $$| $$  \ $$| $$       /$$  \ $$
| $$      | $$$$$$$$| $$      | $$$$$$$$         | $$   |  $$$$$$/| $$$$$$$/| $$$$$$$$|  $$$$$$/
|__/      |________/|__/      |________/         |__/    \______/ |_______/ |________/ \______/ 
*/

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BSCPEPEStaking is Ownable, ReentrancyGuard {
    IERC20 public pepeToken;
    IERC20 public rewardToken;
    mapping(address => bool) public isAdmin;
    mapping(address => Stake[]) public userStakes;
    Pool[] public pools;

    uint256 public LOCK_PERIOD = 30 days;

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

    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 reward);
    event AdminSet(address indexed admin, bool status);
    event RewardTokenSet(address indexed token);
    event LockPeriodUpdated(uint256 newPeriod);
    event TokensRecovered(address token, uint256 amount);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || owner() == msg.sender, "Not admin");
        _;
    }

    constructor(address _pepeToken) Ownable(msg.sender) {
        pepeToken = IERC20(_pepeToken);
        
        // Initialize pools
        pools.push(Pool(1_000_000 ether, 1000, 7.5 ether, 0, 0, true));     // Pool 1: 1M PEPE → 7.5 USDT
        pools.push(Pool(2_000_000 ether, 800, 15 ether, 0, 0, true));       // Pool 2: 2M PEPE → 15 USDT
        pools.push(Pool(5_000_000 ether, 400, 45 ether, 0, 0, true));       // Pool 3: 5M PEPE → 45 USDT
        pools.push(Pool(10_000_000 ether, 200, 150 ether, 0, 0, true));     // Pool 4: 10M PEPE → 150 USDT
        pools.push(Pool(20_000_000 ether, 208, 360 ether, 0, 0, true));     // Pool 5: 20M PEPE → 360 USDT
        pools.push(Pool(100_000_000 ether, 60, 3000 ether, 0, 0, true));    // Pool 6: 100M PEPE → 3000 USDT
    }

    function setAdmin(address admin, bool status) external onlyOwner {
        isAdmin[admin] = status;
        emit AdminSet(admin, status);
    }

    function setRewardToken(address token) external onlyOwner {
        rewardToken = IERC20(token);
        emit RewardTokenSet(token);
    }

    function setLockPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "Lock period must be > 0");
        LOCK_PERIOD = newPeriod;
        emit LockPeriodUpdated(newPeriod);
    }

    function stake(uint256 poolId, uint256 amount) external nonReentrant {
        require(poolId < pools.length, "Invalid pool");
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool is not active");
        require(amount >= pool.minStakeAmount, "Amount is less than minimum stake amount");
        require(pool.currentHolders < pool.maxHolders, "Pool is full");

        pepeToken.transferFrom(msg.sender, address(this), amount);

        userStakes[msg.sender].push(Stake({
            amount: amount,
            startTime: block.timestamp,
            poolId: poolId,
            hasClaimedReward: false
        }));

        pool.totalStaked += amount;
        pool.currentHolders += 1;

        emit Staked(msg.sender, poolId, amount);
    }

    // FIXED: Corrected unstake logic to properly handle stake removal
    function unstake(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        
        // Check stake status 
        require(!userStake.hasClaimedReward, "Already unstaked");
        require(block.timestamp >= userStake.startTime + LOCK_PERIOD, "Stake is still locked");
        
        // Cache values before modifying storage
        uint256 amount = userStake.amount;
        uint256 poolId = userStake.poolId;
        
        // Update stake record first to prevent reentrancy
        userStake.hasClaimedReward = true;
        
        // Update pool data
        Pool storage pool = pools[poolId];
        pool.totalStaked -= amount;
        pool.currentHolders -= 1;
        
        // Transfer tokens only after state changes
        uint256 reward = pool.rewardPerHolder;
        bool pepeSuccess = pepeToken.transfer(msg.sender, amount);
        require(pepeSuccess, "PEPE transfer failed");
        
        bool rewardSuccess = rewardToken.transfer(msg.sender, reward);
        require(rewardSuccess, "Reward transfer failed");

        emit Unstaked(msg.sender, poolId, amount, reward);
    }

    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }

    function getPoolDetails(uint256 poolId) external view onlyAdmin returns (Pool memory) {
        require(poolId < pools.length, "Invalid pool");
        return pools[poolId];
    }

    function getAllPoolsInfo() external view returns (Pool[] memory) {
        return pools;
    }

    // Added additional safety checks
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");
        
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Token transfer failed");
        
        emit TokensRecovered(token, amount);
    }

    // Added option to add USDT rewards
    function addUSDT(uint256 amount) external onlyAdmin {
        require(address(rewardToken) != address(0), "Reward token not set");
        require(amount > 0, "Amount must be > 0");
        
        bool success = rewardToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
    }
}
