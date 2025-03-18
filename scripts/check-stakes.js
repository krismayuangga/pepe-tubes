const hre = require("hardhat");
const fs = require('fs');

async function main() {
    // Load deployed addresses
    const deployedAddresses = JSON.parse(fs.readFileSync('deployed-addresses.json'));
    
    // Get user address from command line
    const userAddress = process.argv[2];
    if (!userAddress) {
        console.error("Please provide a user address as argument");
        process.exit(1);
    }

    // Connect to contracts
    const staking = await hre.ethers.getContractAt("BSCPEPEStaking", deployedAddresses.staking);
    const pepeToken = await hre.ethers.getContractAt("PEPEToken", deployedAddresses.pepeToken);
    const usdtToken = await hre.ethers.getContractAt("DummyUSDT", deployedAddresses.dummyUSDT);

    console.log("\nChecking staking positions for address:", userAddress);
    console.log("=".repeat(50));

    // Get all pools info
    const pools = await staking.getAllPoolsInfo();
    const userStakes = await staking.getUserStakes(userAddress);

    // Get token balances
    const pepeBalance = await pepeToken.balanceOf(userAddress);
    const usdtBalance = await usdtToken.balanceOf(userAddress);

    console.log("\nToken Balances:");
    console.log("-".repeat(30));
    console.log("PEPE:", hre.ethers.formatEther(pepeBalance));
    console.log("USDT:", hre.ethers.formatEther(usdtBalance));

    console.log("\nStaking Positions:");
    console.log("-".repeat(30));

    let totalStaked = BigInt(0);
    let totalRewards = BigInt(0);

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        const stake = userStakes[i];
        const reward = await staking.calculateReward(userAddress, i);

        if (stake.amount > 0) {
            totalStaked += stake.amount;
            totalRewards += reward;

            console.log(`\nPool ${i + 1}:`);
            console.log(`- APR: ${pool.rewardRate / 100}%`);
            console.log(`- Lock Period: ${pool.lockPeriod} days`);
            console.log(`- Staked Amount: ${hre.ethers.formatEther(stake.amount)} PEPE`);
            console.log(`- Start Time: ${new Date(Number(stake.startTime) * 1000).toLocaleString()}`);
            console.log(`- Last Claim: ${new Date(Number(stake.lastClaimTime) * 1000).toLocaleString()}`);
            console.log(`- Current Reward: ${hre.ethers.formatEther(reward)} USDT`);

            // Check if lock period has ended
            const now = Math.floor(Date.now() / 1000);
            const lockEndTime = Number(stake.startTime) + (Number(pool.lockPeriod) * 24 * 60 * 60);
            const canUnstake = now >= lockEndTime;
            console.log(`- Can Unstake: ${canUnstake ? 'Yes' : 'No'}`);
            if (!canUnstake) {
                const timeLeft = lockEndTime - now;
                console.log(`  Time left: ${Math.ceil(timeLeft / (24 * 60 * 60))} days`);
            }
        }
    }

    console.log("\nSummary:");
    console.log("-".repeat(30));
    console.log("Total Staked:", hre.ethers.formatEther(totalStaked), "PEPE");
    console.log("Total Pending Rewards:", hre.ethers.formatEther(totalRewards), "USDT");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
