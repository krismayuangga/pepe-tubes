const hre = require("hardhat");

async function main() {
    const [admin] = await hre.ethers.getSigners();
    console.log("Admin address:", admin.address);

    // Get USDT contract
    const USDT_ADDRESS = "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244";
    const usdtContract = await hre.ethers.getContractAt("DummyUSDT", USDT_ADDRESS);

    // Check current balance
    const balanceBefore = await usdtContract.balanceOf(admin.address);
    console.log("Current USDT balance:", hre.ethers.formatEther(balanceBefore));

    // Mint 100,000 USDT to admin
    const mintAmount = hre.ethers.parseEther("100000");
    console.log("\nMinting 100,000 USDT...");
    const tx = await usdtContract.mint(admin.address, mintAmount);
    await tx.wait();
    console.log("Mint successful:", tx.hash);

    // Verify new balance
    const balanceAfter = await usdtContract.balanceOf(admin.address);
    console.log("\nNew USDT balance:", hre.ethers.formatEther(balanceAfter));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
