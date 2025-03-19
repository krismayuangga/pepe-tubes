require("dotenv").config();
const hre = require("hardhat");

async function main() {
    // Get contract instances using hardhat-ethers
    const [signer] = await hre.ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    const USDT_ADDRESS = "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244";
    const STAKING_ADDRESS = "0x742Aa8421Ef6c0159B722AEFf3fAFbb6118400a5";

    // Get USDT contract
    const usdtContract = await hre.ethers.getContractAt("DummyUSDT", USDT_ADDRESS);
    // Get staking contract
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", STAKING_ADDRESS);

    // Amount to send: 10,000 USDT
    const amount = hre.ethers.parseEther("10000");

    console.log("Getting current USDT balance...");
    const balanceBefore = await usdtContract.balanceOf(STAKING_ADDRESS);
    console.log(`Current contract USDT balance: ${hre.ethers.formatEther(balanceBefore)} USDT`);

    console.log("\nApproving USDT transfer...");
    const approveTx = await usdtContract.approve(STAKING_ADDRESS, amount);
    await approveTx.wait();
    console.log("Approval confirmed:", approveTx.hash);

    console.log("\nAdding USDT to staking contract...");
    const addTx = await stakingContract.addUSDT(amount);
    await addTx.wait();
    console.log("Transfer confirmed:", addTx.hash);

    const balanceAfter = await usdtContract.balanceOf(STAKING_ADDRESS);
    console.log(`\nNew contract USDT balance: ${hre.ethers.formatEther(balanceAfter)} USDT`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
