// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BSCPEPEStaking is ReentrancyGuard, Ownable {
    // Token addresses
    IERC20 public immutable pepeToken;
    IERC20 public rewardToken; // USDT for rewards

    // Staking settings
    uint256 public rewardRate = 1; // 0.1% per day (in basis points)
    uint256 public constant REWARD_PRECISION = 10000;
    uint256 public constant MIN_STAKE_DURATION = 1 days;

    // Staker info
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
    }

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;

    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    event RewardTokenUpdated(address newToken);

    constructor(address _pepeToken) Ownable(msg.sender) {
        pepeToken = IERC20(_pepeToken);
    }

    // Set reward token (USDT)
    function setRewardToken(address _rewardToken) external onlyOwner {
        require(_rewardToken != address(0), "Invalid token address");
        rewardToken = IERC20(_rewardToken);
        emit RewardTokenUpdated(_rewardToken);
    }

    // Update reward rate
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        require(_rewardRate <= 10000, "Rate too high"); // Max 100%
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    // Calculate rewards
    function calculateReward(address _staker) public view returns (uint256) {
        Stake memory stake = stakes[_staker];
        if (stake.amount == 0) return 0;

        uint256 duration = block.timestamp - stake.lastClaimTime;
        uint256 reward = (stake.amount * rewardRate * duration) / (REWARD_PRECISION * 1 days);
        return reward;
    }

    // Stake PEPE tokens
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        
        // Claim any existing rewards before updating stake
        _claimReward();

        // Transfer PEPE tokens to this contract
        require(pepeToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // Update staking info
        if (stakes[msg.sender].amount == 0) {
            stakes[msg.sender] = Stake({
                amount: _amount,
                startTime: block.timestamp,
                lastClaimTime: block.timestamp
            });
        } else {
            stakes[msg.sender].amount += _amount;
            stakes[msg.sender].lastClaimTime = block.timestamp;
        }

        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    // Unstake PEPE tokens
    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No tokens staked");
        require(block.timestamp >= userStake.startTime + MIN_STAKE_DURATION, "Minimum stake duration not met");

        // Claim rewards first
        _claimReward();

        // Get stake amount
        uint256 amount = userStake.amount;

        // Reset stake
        totalStaked -= amount;
        delete stakes[msg.sender];

        // Return staked tokens
        require(pepeToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    // Claim rewards
    function claimReward() external nonReentrant {
        _claimReward();
    }

    // Internal claim function
    function _claimReward() internal {
        uint256 reward = calculateReward(msg.sender);
        if (reward == 0) return;

        stakes[msg.sender].lastClaimTime = block.timestamp;

        require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
        emit RewardClaimed(msg.sender, reward);
    }

    // Emergency withdraw for owner
    function emergencyWithdraw(IERC20 _token) external onlyOwner {
        require(address(_token) != address(pepeToken), "Cannot withdraw stake token");
        uint256 balance = _token.balanceOf(address(this));
        require(_token.transfer(owner(), balance), "Transfer failed");
    }
}
