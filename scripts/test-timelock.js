const { time } = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");

async function main() {
    const stakingAddress = "0x742Aa8421Ef6c0159B722AEFf3fAFbb6118400a5";
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);

    console.log("Current timestamp:", await time.latest());
    
    // Increase time by 31 days
    await time.increase(time.duration.days(31));
    
    console.log("New timestamp after increase:", await time.latest());
    console.log("Lock period is now complete, rewards can be distributed");

    // Try distribute rewards
    const tx = await stakingContract.distributeRewards({
        gasLimit: 500000
    });
    await tx.wait();
    
    console.log("Rewards distributed successfully:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
