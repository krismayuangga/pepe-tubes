const hre = require("hardhat");

async function main() {
    const stakingAddress = "0x437A1feC1770f5BB07F9DD89a0Ca0739a018BD85"; // Updated to new contract
    const pepeAddress = "0x578a700c214AF091d377f942c15A2413306006bc";
    
    // Get contracts
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);
    const pepeToken = await hre.ethers.getContractAt("PEPEToken", pepeAddress);

    // Stake 10M PEPE to Pool #4
    const amount = hre.ethers.parseEther("10000000");
    const poolId = 3; // Pool #4
    
    console.log("Approving PEPE...");
    const approveTx = await pepeToken.approve(stakingAddress, amount);
    await approveTx.wait();
    
    console.log("Staking PEPE...");
    const stakeTx = await stakingContract.stake(poolId, amount);
    await stakeTx.wait();
    
    console.log("Stake successful!");
}

main().catch(console.error);
