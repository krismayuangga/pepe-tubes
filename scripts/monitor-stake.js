const hre = require("hardhat");

async function main() {
    // Get signer address
    const [signer] = await hre.ethers.getSigners();
    console.log("Using signer:", signer.address);

    const stakingAddress = "0x437A1feC1770f5BB07F9DD89a0Ca0739a018BD85"; // Updated to new contract
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);

    try {
        // Check stakes from signer's address (wallet yang melakukan stake)
        const stakes = await stakingContract.getUserStakes(signer.address);
        console.log("\nFound stakes:", stakes.length);
        
        if (stakes.length === 0) {
            console.log("\nNo active stakes found");
            return;
        }

        // Get current lock period
        const lockPeriod = await stakingContract.LOCK_PERIOD();
        console.log("Lock Period:", Number(lockPeriod), "seconds");

        // Monitor stake details
        for (let i = 0; i < stakes.length; i++) {
            const stake = stakes[i];
            const now = Math.floor(Date.now() / 1000);
            const endTime = Number(stake.startTime) + Number(lockPeriod);
            const timeLeft = endTime - now;

            console.log("\nStake #" + (i + 1) + " Details:");
            console.log("Amount:", hre.ethers.formatEther(stake.amount), "PEPE");
            console.log("Pool ID:", Number(stake.poolId) + 1);
            console.log("Start Time:", new Date(Number(stake.startTime) * 1000).toLocaleString());
            console.log("End Time:", new Date(endTime * 1000).toLocaleString());
            console.log("Time Left:", timeLeft > 0 ? timeLeft + " seconds" : "COMPLETED");
            console.log("Status:", timeLeft <= 0 ? "🟢 READY" : "🟡 LOCKED");
            console.log("Has Claimed:", stake.hasClaimedReward);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);
