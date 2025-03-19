const hre = require("hardhat");

async function main() {
    // Get contract instance
    const pepeToken = await hre.ethers.getContractAt("PEPEToken", "0x578a700c214AF091d377f942c15A2413306006bc");
    
    // Test wallet addresses
    const testWallets = [
        "0x67F8D45F011306476CcaEa5D5fD33c80a8f34f64",  // Test wallet 1
        "0x8C41774Ac950B287D6dcFD51ABA48e46f0815eE1"   // Test wallet 2
    ];
    
    for (let wallet of testWallets) {
        // Transfer 10M PEPE untuk Pool #4
        const amount = hre.ethers.parseEther("10000000");
        console.log(`Transferring 10M PEPE to ${wallet}...`);
        const tx = await pepeToken.transfer(wallet, amount);
        await tx.wait();
        console.log(`Transfer successful: ${tx.hash}`);
        
        // Verify balance
        const balance = await pepeToken.balanceOf(wallet);
        console.log(`New balance for ${wallet}: ${hre.ethers.formatEther(balance)} PEPE\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
