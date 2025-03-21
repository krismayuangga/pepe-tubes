const hre = require("hardhat");

async function main() {
    // Ambil alamat dari deployment-addresses.json
    const deployedAddresses = require('../deployed-addresses.json');
    const stakingAddress = deployedAddresses.staking;
    
    console.log("\n🚨 EMERGENCY UNSTAKE SCRIPT 🚨");
    console.log("Staking contract:", stakingAddress);
    
    // Input parameters
    const userAddress = process.argv[2]; // alamat user yang ingin unstake
    const stakeIndex = process.argv[3] || "0"; // default index 0
    
    if (!userAddress) {
        console.error("❌ ERROR: Mohon berikan alamat user sebagai parameter");
        console.log("Contoh: npx hardhat run scripts/emergency-unstake.js --network bsc_testnet 0xYourAddressHere 0");
        process.exit(1);
    }
    
    // Get contract
    const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);
    
    try {
        // Check if user has stakes
        const stakes = await stakingContract.getUserStakes(userAddress);
        console.log(`\nDitemukan ${stakes.length} stake untuk ${userAddress}`);
        
        if (stakes.length === 0) {
            console.error("❌ Tidak ada stake yang ditemukan untuk alamat ini");
            process.exit(1);
        }
        
        // Print stake details
        const index = parseInt(stakeIndex);
        if (index >= stakes.length) {
            console.error(`❌ Index stake ${index} tidak valid. Max index: ${stakes.length - 1}`);
            process.exit(1);
        }
        
        const stake = stakes[index];
        console.log("\nDetail stake yang akan di-unstake:");
        console.log(`- Index: ${index}`);
        console.log(`- Pool ID: ${Number(stake.poolId) + 1}`);
        console.log(`- Amount: ${hre.ethers.formatEther(stake.amount)} PEPE`);
        console.log(`- Start time: ${new Date(Number(stake.startTime) * 1000).toLocaleString()}`);
        console.log(`- Claimed: ${stake.hasClaimedReward}`);
        
        if (stake.hasClaimedReward) {
            console.warn("⚠️ PERINGATAN: Stake ini sudah diklaim sebelumnya!");
            process.exit(1);
        }
        
        // Execute unstake with fixed gas limit
        console.log("\nMemulai proses unstake dengan gas limit terkontrol...");
        const tx = await stakingContract.unstake(index, {
            gasLimit: 500000
        });
        
        console.log(`Transaksi terkirim: ${tx.hash}`);
        console.log("Menunggu konfirmasi...");
        
        await tx.wait();
        console.log("\n✅ Unstake berhasil dilakukan!");
        
    } catch (error) {
        console.error("\n❌ ERROR UNSTAKE:", error.message);
        
        // Additional debugging for contract owner
        const [signer] = await hre.ethers.getSigners();
        const owner = await stakingContract.owner();
        
        if (owner.toLowerCase() === signer.address.toLowerCase()) {
            console.log("\n⚠️ Anda adalah owner kontrak. Mencoba recovery tokens...");
            
            try {
                // Get stake details for recovery
                const stakes = await stakingContract.getUserStakes(userAddress);
                if (stakes.length > 0) {
                    const stake = stakes[parseInt(stakeIndex)];
                    if (!stake.hasClaimedReward) {
                        // Recover PEPE tokens to user
                        const recoverTx = await stakingContract.recoverTokens(
                            deployedAddresses.pepeToken,
                            stake.amount,
                            { gasLimit: 300000 }
                        );
                        
                        console.log(`Recovery transaction: ${recoverTx.hash}`);
                        await recoverTx.wait();
                        console.log("✅ Tokens successfully recovered!");
                    }
                }
            } catch (recoverError) {
                console.error("Recovery failed:", recoverError.message);
            }
        }
    }
}

main().catch(console.error);
