const hre = require("hardhat");
const fs = require('fs');

// Add delay function
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    console.log("\n🚀 ETHEREUM MAINNET DEPLOYMENT");
    console.log("==========================\n");
    
    // Confirm mainnet deployment
    if (process.env.CONFIRM_MAINNET !== 'yes') {
        console.log("⚠️ MAINNET DEPLOYMENT SAFETY CHECK");
        console.log("This script deploys to ETHEREUM MAINNET which will use REAL funds.");
        console.log("To continue, please set CONFIRM_MAINNET=yes in your .env file.");
        process.exit(1);
    }

    // Get mainnet config from config file
    let mainnetConfig;
    try {
        mainnetConfig = require('../frontend/mainnet-config');
    } catch (error) {
        console.error("❌ Error loading mainnet configuration:", error.message);
        console.log("Please ensure mainnet-config.js exists and is properly configured.");
        process.exit(1);
    }

    // Alamat PEPE token pada mainnet
    const PEPE_TOKEN = mainnetConfig.MAINNET_CONTRACTS.pepeToken.address;
    const USDT_TOKEN = mainnetConfig.MAINNET_CONTRACTS.usdtToken.address;
    
    console.log("PEPE Token Address:", PEPE_TOKEN);
    console.log("USDT Token Address:", USDT_TOKEN);
    console.log("\n");

    // Gas price check for mainnet
    const currentGasPrice = await hre.ethers.provider.getGasPrice();
    const gasPriceGwei = hre.ethers.formatUnits(currentGasPrice, "gwei");
    
    console.log("Current gas price:", gasPriceGwei, "Gwei");
    if (parseFloat(gasPriceGwei) > 100) {
        console.log("\n⚠️ WARNING: Gas price is very high (>100 Gwei)");
        console.log("Consider waiting for lower gas prices.");
        
        // Prompt to continue
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const response = await new Promise(resolve => {
            readline.question('Continue deployment? (yes/no): ', resolve);
        });
        readline.close();
        
        if (response.toLowerCase() !== 'yes') {
            console.log("Deployment cancelled.");
            process.exit(0);
        }
    }

    // Deploy BSCPEPEStaking to mainnet
    console.log("\n📄 Deploying BSCPEPEStaking contract...");
    const BSCPEPEStaking = await hre.ethers.getContractFactory("BSCPEPEStaking");
    const staking = await BSCPEPEStaking.deploy(PEPE_TOKEN);
    
    const deployTx = await staking.deploymentTransaction();
    console.log("Deployment transaction hash:", deployTx.hash);
    
    console.log("\nWaiting for deployment confirmation...");
    await deployTx.wait(3); // Wait for 3 confirmations on mainnet
    
    const stakingAddress = await staking.getAddress();
    console.log("\n✅ BSCPEPEStaking deployed to:", stakingAddress);

    // Set USDT as reward token
    console.log("\nSetting USDT as reward token...");
    const setRewardTx = await staking.setRewardToken(USDT_TOKEN);
    await setRewardTx.wait(2);
    console.log("✅ USDT set as reward token");

    // Wait before sending next transaction
    console.log("\nWaiting 15 seconds before continuing...");
    await delay(15000);

    // Set initial lock period (30 days)
    console.log("Setting lock period to 30 days...");
    const THIRTY_DAYS = 30 * 24 * 60 * 60;
    const setLockTx = await staking.setLockPeriod(THIRTY_DAYS, {
        nonce: await staking.runner.provider.getTransactionCount(await staking.runner.getAddress())
    });
    await setLockTx.wait(2);
    console.log("✅ Lock period set");

    // Update deployed-addresses.json
    console.log("\nUpdating configuration files...");
    const deployedAddresses = {
        pepeToken: PEPE_TOKEN,
        usdtToken: USDT_TOKEN,
        staking: stakingAddress,
        network: "ethereum_mainnet"
    };
    
    fs.writeFileSync(
        'deployed-mainnet-addresses.json', // Separate file for mainnet addresses
        JSON.stringify(deployedAddresses, null, 2)
    );
    console.log("✅ deployed-mainnet-addresses.json created");

    // Update mainnet-config.js with new staking address
    let mainnetConfigContent = fs.readFileSync('frontend/mainnet-config.js', 'utf8');
    mainnetConfigContent = mainnetConfigContent.replace(
        /pepeStaking: {[\s\S]*?address: '(.*?)'[\s\S]*?}/,
        `pepeStaking: {\n        address: '${stakingAddress}'`
    );
    fs.writeFileSync('frontend/mainnet-config.js', mainnetConfigContent);
    console.log("✅ mainnet-config.js updated with contract address");

    // Verify contract
    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
        await delay(30000); // Wait 30 seconds before verification
        
        await hre.run("verify:verify", {
            address: stakingAddress,
            constructorArguments: [PEPE_TOKEN],
            contract: "contracts/BSCPEPEStaking.sol:BSCPEPEStaking"
        });
        console.log("✅ Contract verified successfully");
    } catch (error) {
        console.log("⚠️ Error verifying contract:", error.message);
        console.log("\nYou can try manual verification later using:");
        console.log(`npx hardhat verify --network mainnet ${stakingAddress} "${PEPE_TOKEN}"`);
    }

    console.log("\n🎉 MAINNET DEPLOYMENT COMPLETED!");
    console.log("Contract address:", stakingAddress);
    console.log("\nImportant next steps:");
    console.log("1. Set additional admin addresses");
    console.log("2. Fund contract with USDT rewards");
    console.log("3. Update website configurations");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
