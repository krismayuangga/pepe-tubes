const hre = require("hardhat");

async function main() {
    const stakingAddress = "0x437A1feC1770f5BB07F9DD89a0Ca0739a018BD85";
    
    // Get contract with complete ABI
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);
    const [signer] = await hre.ethers.getSigners();

    try {
        // Check USDT balance
        const usdtContract = await hre.ethers.getContractAt(
            "DummyUSDT",
            "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244"
        );
        
        console.log("\nChecking state before distribution...");
        const balance = await usdtContract.balanceOf(stakingAddress);
        console.log("Contract USDT balance:", hre.ethers.formatEther(balance));

        // Get stakes data
        const stakes = await stakingContract.getUserStakes(signer.address);
        const lockPeriod = await stakingContract.LOCK_PERIOD();
        const now = Math.floor(Date.now() / 1000);

        // Display stake info
        console.log("\nStake details from", signer.address);
        
        // Check stakes
        let hasReadyStakes = false;
        for (let i = 0; i < stakes.length; i++) {
            const stake = stakes[i];
            const endTime = Number(stake.startTime) + Number(lockPeriod);
            const isReady = now >= endTime && !stake.hasClaimedReward;
            
            // Get pool info
            const pools = await stakingContract.getAllPoolsInfo();
            const pool = pools[stake.poolId];
            
            console.log(`\nStake #${i + 1}:`);
            console.log("Pool ID:", Number(stake.poolId));
            console.log("Pool Number:", Number(stake.poolId) + 1);
            console.log("Pool Reward:", hre.ethers.formatEther(pool.rewardPerHolder), "USDT");
            console.log("Amount:", hre.ethers.formatEther(stake.amount), "PEPE");
            console.log("Start Time:", new Date(Number(stake.startTime) * 1000).toLocaleString());
            console.log("End Time:", new Date(endTime * 1000).toLocaleString());
            console.log("Has Claimed:", stake.hasClaimedReward);
            console.log("Ready for Distribution:", isReady);

            if (isReady) hasReadyStakes = true;
        }

        if (!hasReadyStakes) {
            console.log("\nNo stakes ready for distribution");
            return;
        }

        console.log("\nDistributing rewards...");

        // Call distributeRewards directly from contract instance
        const tx = await stakingContract.distributeRewards({
            from: signer.address,
            gasLimit: 1000000
        });

        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("✓ Distribution successful!");
            
            // Verify final state
            const stakesAfter = await stakingContract.getUserStakes(signer.address);
            console.log("\nFinal stake statuses:");
            for (const stake of stakesAfter) {
                console.log(`Pool ${Number(stake.poolId) + 1}: Has Claimed = ${stake.hasClaimedReward}`);
            }
        } else {
            console.log("× Distribution failed!");
            console.log("Gas used:", receipt.gasUsed.toString());
            console.log("Failure reason:", receipt.logs);
        }

    } catch (error) {
        console.error("\nError:", error);
        console.log("\nDebug Info:");
        console.log("Contract:", stakingAddress);
        console.log("Signer:", signer.address);
        
        // Add more detailed error info
        if (error.error && error.error.message) {
            console.log("Error message:", error.error.message);
        }
        if (error.transaction) {
            console.log("Transaction data:", error.transaction.data);
        }
    }
}

main().catch(console.error);
