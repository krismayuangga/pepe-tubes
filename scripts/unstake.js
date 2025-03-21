const hre = require("hardhat");

async function main() {
    const stakingAddress = "0x437A1feC1770f5BB07F9DD89a0Ca0739a018BD85"; 
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);

    try {
        // Get test wallet address
        const testWallet = "0x67F8D45F011306476CcaEa5D5fD33c80a8f34f64";
        const stakes = await stakingContract.getUserStakes(testWallet);
        
        console.log("\nCurrent stakes:");
        console.log("Total stakes:", stakes.length);
        
        // Print current stakes
        stakes.forEach((stake, index) => {
            console.log(`\nStake #${index}:`);
            console.log("Amount:", hre.ethers.formatEther(stake.amount), "PEPE");
            console.log("Pool ID:", Number(stake.poolId) + 1);
            console.log("Has Claimed:", stake.hasClaimedReward);
        });

        // Always use index 0 for unstaking
        console.log(`\nUnstaking stake at index 0...`);
        const tx = await stakingContract.unstake(0);
        await tx.wait();
        console.log("Unstake successful!");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

main().catch(console.error);
