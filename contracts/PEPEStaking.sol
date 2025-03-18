// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PEPEStaking is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public pepeToken;
    IERC20 public usdtToken;

    uint256 public rewardRate = 1e16; // 0.01 USDT per second per PEPE

    struct Stake {
        uint256 amount;
        uint256 startTime;
    }

    mapping(address => Stake) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 reward);
    event USDTAdded(address indexed admin, uint256 amount);

    constructor(address _pepeToken, address _usdtToken) Ownable(msg.sender) {
        require(_pepeToken != address(0), "Invalid PEPE token address");
        require(_usdtToken != address(0), "Invalid USDT token address");
        pepeToken = IERC20(_pepeToken);
        usdtToken = IERC20(_usdtToken);
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");

        pepeToken.safeTransferFrom(msg.sender, address(this), _amount);

        stakes[msg.sender] = Stake({
            amount: _amount,
            startTime: block.timestamp
        });

        emit Staked(msg.sender, _amount);
    }

    function calculateReward(address _staker) public view returns (uint256) {
        Stake memory stakeData = stakes[_staker];
        if (stakeData.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - stakeData.startTime;
        uint256 reward = (stakeData.amount * stakingDuration * rewardRate) / 1e18;
        return reward;
    }

    function addUSDT(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        usdtToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit USDTAdded(msg.sender, _amount);
    }

    function getUSDTBalance() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }

    function claimRewards() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards available");

        uint256 contractBalance = usdtToken.balanceOf(address(this));
        require(contractBalance >= reward, "Insufficient USDT in contract");

        stakes[msg.sender].startTime = block.timestamp;
        usdtToken.safeTransfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    function unstake() external {
        Stake memory stakeData = stakes[msg.sender];
        require(stakeData.amount > 0, "No stake found");

        uint256 reward = calculateReward(msg.sender);
        uint256 amountToUnstake = stakeData.amount;

        delete stakes[msg.sender];

        pepeToken.safeTransfer(msg.sender, amountToUnstake);
        
        if (reward > 0) {
            require(usdtToken.balanceOf(address(this)) >= reward, "Insufficient USDT in contract");
            usdtToken.safeTransfer(msg.sender, reward);
            emit RewardsClaimed(msg.sender, reward);
        }

        emit Unstaked(msg.sender, amountToUnstake);
    }

    function setRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Reward rate must be greater than 0");
        rewardRate = _newRate;
    }
}
