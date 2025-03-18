const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PEPE Staking", function () {
  let PEPEToken, pepeToken;
  let DummyUSDT, dummyUSDT;
  let PEPEStaking, pepeStaking;
  let owner, user1, user2;
  const INITIAL_USDT_SUPPLY = ethers.parseEther("1000000"); // 1M USDT
  const STAKE_AMOUNT = ethers.parseEther("1000"); // 1000 PEPE

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy PEPE Token
    PEPEToken = await ethers.getContractFactory("PEPEToken");
    pepeToken = await PEPEToken.deploy();

    // Deploy Dummy USDT and mint to owner
    DummyUSDT = await ethers.getContractFactory("DummyUSDT");
    dummyUSDT = await DummyUSDT.deploy();
    await dummyUSDT.mint(owner.address, INITIAL_USDT_SUPPLY);

    // Deploy Staking Contract
    PEPEStaking = await ethers.getContractFactory("PEPEStaking");
    pepeStaking = await PEPEStaking.deploy(
      await pepeToken.getAddress(),
      await dummyUSDT.getAddress()
    );

    // Transfer some PEPE tokens to user1
    await pepeToken.transfer(user1.address, STAKE_AMOUNT * 2n);
    
    // Add some USDT to the staking contract
    await dummyUSDT.approve(pepeStaking.getAddress(), INITIAL_USDT_SUPPLY);
    await pepeStaking.addUSDT(INITIAL_USDT_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the right token addresses", async function () {
      expect(await pepeStaking.pepeToken()).to.equal(await pepeToken.getAddress());
      expect(await pepeStaking.usdtToken()).to.equal(await dummyUSDT.getAddress());
    });

    it("Should mint correct initial supplies", async function () {
      expect(await pepeToken.totalSupply()).to.equal(ethers.parseEther("100000000000")); // 100B PEPE
      expect(await dummyUSDT.totalSupply()).to.equal(INITIAL_USDT_SUPPLY);
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Approve staking contract to spend user1's PEPE tokens
      await pepeToken.connect(user1).approve(pepeStaking.getAddress(), STAKE_AMOUNT);
    });

    it("Should allow staking tokens", async function () {
      await pepeStaking.connect(user1).stake(STAKE_AMOUNT);
      const stake = await pepeStaking.stakes(user1.address);
      expect(stake.amount).to.equal(STAKE_AMOUNT);
    });

    it("Should not allow staking 0 tokens", async function () {
      await expect(pepeStaking.connect(user1).stake(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should calculate rewards correctly", async function () {
      await pepeStaking.connect(user1).stake(STAKE_AMOUNT);
      
      // Move forward 1 day
      await time.increase(86400);

      const reward = await pepeStaking.calculateReward(user1.address);
      // Expected reward: amount * time * rewardRate / 1e18
      // 1000 * 86400 * 1e16 / 1e18 = 0.864 USDT per PEPE token
      // For 1000 PEPE tokens = 864000 USDT
      expect(reward).to.be.closeTo(ethers.parseEther("864000"), ethers.parseEther("1"));
    });

    it("Should allow claiming rewards", async function () {
      await pepeStaking.connect(user1).stake(STAKE_AMOUNT);
      await time.increase(86400);

      const initialUSDTBalance = await dummyUSDT.balanceOf(user1.address);
      await pepeStaking.connect(user1).claimRewards();
      const finalUSDTBalance = await dummyUSDT.balanceOf(user1.address);

      expect(finalUSDTBalance).to.be.gt(initialUSDTBalance);
    });

    it("Should allow unstaking tokens", async function () {
      await pepeStaking.connect(user1).stake(STAKE_AMOUNT);
      await time.increase(86400);

      const initialPEPEBalance = await pepeToken.balanceOf(user1.address);
      const initialUSDTBalance = await dummyUSDT.balanceOf(user1.address);

      await pepeStaking.connect(user1).unstake();

      const finalPEPEBalance = await pepeToken.balanceOf(user1.address);
      const finalUSDTBalance = await dummyUSDT.balanceOf(user1.address);

      expect(finalPEPEBalance).to.equal(initialPEPEBalance + STAKE_AMOUNT);
      expect(finalUSDTBalance).to.be.gt(initialUSDTBalance);
    });
  });

  describe("Admin functions", function () {
    beforeEach(async function () {
      // Mint additional USDT for admin functions testing
      await dummyUSDT.mint(owner.address, ethers.parseEther("10000"));
    });

    it("Should allow owner to add USDT", async function () {
      const amount = ethers.parseEther("1000");
      await dummyUSDT.approve(await pepeStaking.getAddress(), amount);
      await pepeStaking.addUSDT(amount);
      expect(await dummyUSDT.balanceOf(pepeStaking.getAddress())).to.equal(INITIAL_USDT_SUPPLY + amount);
    });

    it("Should allow owner to set reward rate", async function () {
      const newRate = ethers.parseEther("0.02");
      await pepeStaking.setRewardRate(newRate);
      expect(await pepeStaking.rewardRate()).to.equal(newRate);
    });

    it("Should not allow non-owner to set reward rate", async function () {
      const newRate = ethers.parseEther("0.02");
      await expect(pepeStaking.connect(user1).setRewardRate(newRate))
        .to.be.revertedWithCustomError(pepeStaking, "OwnableUnauthorizedAccount");
    });
  });
});
