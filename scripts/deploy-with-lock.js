const hre = require("hardhat");
const fs = require('fs');

// Add delay function
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    console.log("Deploying new BSCPEPEStaking contract...");

    const PEPE_TOKEN = "0x578a700c214AF091d377f942c15A2413306006bc";
    const USDT_TOKEN = "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244";

    // Deploy BSCPEPEStaking
    const BSCPEPEStaking = await hre.ethers.getContractFactory("BSCPEPEStaking");
    const staking = await BSCPEPEStaking.deploy(PEPE_TOKEN);
    const deployTx = await staking.deploymentTransaction();
    console.log("Deployment transaction hash:", deployTx.hash);
    
    await deployTx.wait(2); // Wait for 2 block confirmations
    const stakingAddress = await staking.getAddress();
    console.log("BSCPEPEStaking deployed to:", stakingAddress);

    // Setup initial configuration
    console.log("\nSetting up contract...");
    
    // Set USDT as reward token
    console.log("Setting USDT as reward token...");
    const setRewardTx = await staking.setRewardToken(USDT_TOKEN);
    await setRewardTx.wait(2);
    console.log("✓ USDT set as reward token");

    // Wait 10 seconds before next transaction
    console.log("\nWaiting 10 seconds...");
    await delay(10000);

    // Set initial lock period (30 days)
    console.log("Setting lock period...");
    const THIRTY_DAYS = 30 * 24 * 60 * 60;
    const setLockTx = await staking.setLockPeriod(THIRTY_DAYS, {
        nonce: await staking.runner.provider.getTransactionCount(await staking.runner.getAddress())
    });
    await setLockTx.wait(2);
    console.log("✓ Lock period set to 30 days");

    // Update configuration files
    console.log("\nUpdating configuration files...");
    
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
    console.log("✓ deployed-addresses.json updated");

    // Update admin-config.js and bsc-config.js
    const configFiles = ['frontend/admin-config.js', 'frontend/bsc-config.js'];
    for (const file of configFiles) {
        let config = fs.readFileSync(file, 'utf8');
        config = config.replace(
            /pepeStaking: {[\s\S]*?address: '(0x[a-fA-F0-9]{40})'[\s\S]*?}/,
            `pepeStaking: {\n        address: '${stakingAddress}',`
        );
        fs.writeFileSync(file, config);
        console.log(`✓ ${file} updated`);
    }

    // Verify contract
    console.log("\nVerifying contract on BSCScan...");
    try {
        await hre.run("verify:verify", {
            address: stakingAddress,
            constructorArguments: [PEPE_TOKEN],
            contract: "contracts/BSCPEPEStaking.sol:BSCPEPEStaking"
        });
        console.log("✓ Contract verified successfully");
    } catch (error) {
        console.log("× Error verifying contract:", error.message);
    }

    console.log("\nDeployment and setup completed!");
    console.log("Contract address:", stakingAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
