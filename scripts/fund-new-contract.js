const hre = require("hardhat");

async function main() {
    const stakingAddress = "0x437A1feC1770f5BB07F9DD89a0Ca0739a018BD85"; // Updated address
    const usdtAddress = "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244";
    
    // Get contracts
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);
    const usdtContract = await hre.ethers.getContractAt("DummyUSDT", usdtAddress);

    // Check balances before
    const [signer] = await hre.ethers.getSigners();
    const balanceBefore = await usdtContract.balanceOf(stakingAddress);
    console.log("\nCurrent contract USDT balance:", hre.ethers.formatEther(balanceBefore));
    console.log("Your USDT balance:", hre.ethers.formatEther(await usdtContract.balanceOf(signer.address)));

    // Add 10,000 USDT
    const amount = hre.ethers.parseEther("10000");
    
    console.log("\nApproving USDT...");
    const approveTx = await usdtContract.approve(stakingAddress, amount);
    await approveTx.wait();
    
    console.log("Adding USDT to contract...");
    const addTx = await stakingContract.addUSDT(amount);
    await addTx.wait();
    
    // Check balances after
    const balanceAfter = await usdtContract.balanceOf(stakingAddress);
    console.log("\nNew contract USDT balance:", hre.ethers.formatEther(balanceAfter));
    console.log("Your USDT balance:", hre.ethers.formatEther(await usdtContract.balanceOf(signer.address)));
}

main().catch(console.error);
