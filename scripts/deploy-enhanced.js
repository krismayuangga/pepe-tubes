const hre = require("hardhat");
const fs = require('fs');

// Add delay function
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    console.log("⚡ Deploying enhanced BSCPEPEStaking contract with new features...");

    // Existing token addresses
    const PEPE_TOKEN = "0x578a700c214AF091d377f942c15A2413306006bc";
    const USDT_TOKEN = "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244";

    // Deploy new version of BSCPEPEStaking
    const BSCPEPEStaking = await hre.ethers.getContractFactory("BSCPEPEStaking");
    const staking = await BSCPEPEStaking.deploy(PEPE_TOKEN);
    const deployTx = await staking.deploymentTransaction();
    console.log("Deployment tx hash:", deployTx.hash);
    
    // Wait for confirmations
    console.log("Waiting for 2 block confirmations...");
    await deployTx.wait(2);
    
    const stakingAddress = await staking.getAddress();
    console.log("✅ BSCPEPEStaking deployed to:", stakingAddress);

    // Setup initial configuration
    console.log("\n⚙️ Setting up contract...");
    
    // Set USDT as reward token
    console.log("Setting USDT as reward token...");
    const setRewardTx = await staking.setRewardToken(USDT_TOKEN);
    await setRewardTx.wait(2);
    console.log("✅ USDT set as reward token");

    // Wait to avoid nonce issues
    console.log("\nWaiting 15 seconds to avoid nonce issues...");
    await delay(15000);

    // Set initial lock period (5 minutes for testing)
    console.log("Setting default lock period to 5 minutes...");
    const FIVE_MINUTES = 5 * 60;
    const setLockTx = await staking.setLockPeriod(FIVE_MINUTES);
    await setLockTx.wait(2);
    console.log("✅ Default lock period set to 5 minutes");
    
    // Wait to avoid nonce issues
    await delay(5000);
    
    // Apply lock period to all pools
    console.log("Applying lock period to all pools...");
    const applyTx = await staking.applyLockPeriodToAllPools(FIVE_MINUTES);
    await applyTx.wait(2);
    console.log("✅ 5 minute lock period applied to all pools");

    // Update configuration files
    console.log("\n📝 Updating configuration files...");
    
    // Update deployed-addresses.json
    const deployedAddresses = {
        pepeToken: PEPE_TOKEN,
        dummyUSDT: USDT_TOKEN,
        staking: stakingAddress,
        network: "bsc_testnet"
    };
    
    fs.writeFileSync(
        'deployed-addresses.json',
        JSON.stringify(deployedAddresses, null, 2)
    );
    console.log("✅ deployed-addresses.json updated");

    // Update frontend config files
    const configFiles = ['frontend/admin-config.js', 'frontend/bsc-config.js'];
    for (const file of configFiles) {
        try {
            let config = fs.readFileSync(file, 'utf8');
            config = config.replace(
                /pepeStaking:\s*{[\s\S]*?address:\s*'([^']*)'[\s\S]*?}/,
                `pepeStaking: {\n        address: '${stakingAddress}'`
            );
            fs.writeFileSync(file, config);
            console.log(`✅ ${file} updated with new contract address`);
        } catch (error) {
            console.log(`⚠️ Error updating ${file}:`, error.message);
        }
    }

    // Verify contract
    console.log("\n🔍 Verifying contract on BSCScan...");
    try {
        await hre.run("verify:verify", {
            address: stakingAddress,
            constructorArguments: [PEPE_TOKEN],
            contract: "contracts/BSCPEPEStaking.sol:BSCPEPEStaking"
        });
        console.log("✅ Contract verified successfully");
    } catch (error) {
        console.log("⚠️ Error verifying contract:", error.message);
        console.log("\nYou can try manual verification later using:");
        console.log(`npx hardhat verify --network bsc_testnet ${stakingAddress} "${PEPE_TOKEN}"`);
    }

    console.log("\n🎉 Enhanced deployment completed!");
    console.log("📄 New contract address:", stakingAddress);
    console.log("\nNext steps:");
    console.log("1. Fund the contract with USDT rewards");
    console.log("2. Set admins if needed");
    console.log("3. Update pool rewards and lock periods as desired through admin panel");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });
