const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BSC PEPE Staking", function () {
    let PEPEToken, pepeToken;
    let DummyUSDT, dummyUSDT;
    let BSCPEPEStaking, staking;
    let owner, user1, user2, admin;
    const INITIAL_USDT_SUPPLY = ethers.parseEther("10000000"); // 10M USDT

    beforeEach(async function () {
        [owner, user1, user2, admin] = await ethers.getSigners();

        // Deploy PEPE Token
        PEPEToken = await ethers.getContractFactory("PEPEToken");
        pepeToken = await PEPEToken.deploy();

        // Deploy Dummy USDT
        DummyUSDT = await ethers.getContractFactory("DummyUSDT");
        dummyUSDT = await DummyUSDT.deploy();
        await dummyUSDT.mint(owner.address, INITIAL_USDT_SUPPLY);

        // Deploy Staking Contract
        BSCPEPEStaking = await ethers.getContractFactory("BSCPEPEStaking");
        staking = await BSCPEPEStaking.deploy(await pepeToken.getAddress());
        await staking.setRewardToken(await dummyUSDT.getAddress());

        // Set admin
        await staking.setAdmin(admin.address, true);

        // Transfer PEPE tokens to user1 (50M PEPE untuk testing)
        await pepeToken.transfer(user1.address, ethers.parseEther("50000000"));
        
        // Transfer USDT ke staking contract
        await dummyUSDT.approve(staking.getAddress(), INITIAL_USDT_SUPPLY);
        await dummyUSDT.transfer(staking.getAddress(), INITIAL_USDT_SUPPLY);
    });

    describe("Pool Configuration", function () {
        it("Should initialize pools with correct amounts", async function () {
            const pools = await staking.getAllPoolsInfo();
            
            // Pool 1: 1M PEPE, 1000 holders, 7.5k USDT reward
            expect(pools[0].minStakeAmount).to.equal(ethers.parseEther("1000000"));
            expect(pools[0].maxHolders).to.equal(1000);
            expect(pools[0].rewardPerHolder).to.equal(ethers.parseEther("7500"));
            
            // Pool 6: 50M PEPE, 20 holders, 1.25M USDT reward
            expect(pools[5].minStakeAmount).to.equal(ethers.parseEther("50000000"));
            expect(pools[5].maxHolders).to.equal(20);
            expect(pools[5].rewardPerHolder).to.equal(ethers.parseEther("1250000"));
        });

        it("Should allow admin to view pool details", async function () {
            const [minStake, maxHolders, currentHolders, totalStaked, rewardPerHolder] = 
                await staking.connect(admin).getPoolDetails(0);
            
            expect(minStake).to.equal(ethers.parseEther("1000000"));
            expect(maxHolders).to.equal(1000);
            expect(currentHolders).to.equal(0);
            expect(totalStaked).to.equal(0);
            expect(rewardPerHolder).to.equal(ethers.parseEther("7500"));
        });
    });

    describe("Staking Operations", function () {
        beforeEach(async function () {
            // Approve staking contract untuk pool 1 (1M PEPE)
            await pepeToken.connect(user1).approve(
                staking.getAddress(), 
                ethers.parseEther("1000000")
            );
        });

        it("Should stake in Pool 1 successfully", async function () {
            await staking.connect(user1).stake(0);
            const userStake = (await staking.getUserStakes(user1.address))[0];
            expect(userStake.amount).to.equal(ethers.parseEther("1000000"));
        });

        it("Should not allow staking twice in same pool", async function () {
            await staking.connect(user1).stake(0);
            await expect(
                staking.connect(user1).stake(0)
            ).to.be.revertedWith("Already staked in this pool");
        });

        it("Should not allow unstaking before 30 days with reward", async function () {
            await staking.connect(user1).stake(0);
            await staking.connect(user1).unstake(0);
            const stake = (await staking.getUserStakes(user1.address))[0];
            expect(stake.amount).to.equal(0);
            // Check USDT balance tidak bertambah
            expect(await dummyUSDT.balanceOf(user1.address)).to.equal(0);
        });

        it("Should allow unstaking after 30 days with reward", async function () {
            await staking.connect(user1).stake(0);
            
            // Move forward 31 days
            await time.increase(31 * 24 * 60 * 60);

            const beforeBalance = await dummyUSDT.balanceOf(user1.address);
            await staking.connect(user1).unstake(0);

            // Check PEPE returned
            expect((await staking.getUserStakes(user1.address))[0].amount).to.equal(0);
            
            // Check reward received (7,500 USDT)
            const afterBalance = await dummyUSDT.balanceOf(user1.address);
            const rewardAmount = ethers.parseEther("7500");
            expect(afterBalance).to.equal(beforeBalance + rewardAmount);
        });

        it("Should track number of holders correctly", async function () {
            await staking.connect(user1).stake(0);
            const [,,currentHolders,,] = await staking.connect(admin).getPoolDetails(0);
            expect(currentHolders).to.equal(1);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set admin", async function () {
            await staking.setAdmin(user2.address, true);
            expect(await staking.isAdmin(user2.address)).to.be.true;
        });

        it("Should not allow non-owner to set admin", async function () {
            await expect(
                staking.connect(user1).setAdmin(user2.address, true)
            ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
        });

        it("Should not allow non-admin to view pool details", async function () {
            await expect(
                staking.connect(user1).getPoolDetails(0)
            ).to.be.revertedWith("Not admin");
        });
    });
});
