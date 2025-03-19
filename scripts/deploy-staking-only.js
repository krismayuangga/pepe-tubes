const hre = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("Deploying BSCPEPEStaking contract...");

    // Alamat PEPE token yang sudah ada
    const PEPE_TOKEN = "0x578a700c214AF091d377f942c15A2413306006bc";
    const USDT_TOKEN = "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244";

    // Deploy BSCPEPEStaking
    const BSCPEPEStaking = await hre.ethers.getContractFactory("BSCPEPEStaking");
    const staking = await BSCPEPEStaking.deploy(PEPE_TOKEN);
    await staking.waitForDeployment();
    
    const stakingAddress = await staking.getAddress();
    console.log("BSCPEPEStaking deployed to:", stakingAddress);

    // Set USDT sebagai reward token
    await staking.setRewardToken(USDT_TOKEN);
    console.log("Set USDT as reward token");

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

    // Update admin-config.js
    let adminConfig = fs.readFileSync('frontend/admin-config.js', 'utf8');
    adminConfig = adminConfig.replace(
        /pepeStaking: {[\s\S]*?address: '(0x[a-fA-F0-9]{40})'[\s\S]*?}/,
        `pepeStaking: {\n        address: '${stakingAddress}',`
    );
    fs.writeFileSync('frontend/admin-config.js', adminConfig);

    // Update bsc-config.js
    let bscConfig = fs.readFileSync('frontend/bsc-config.js', 'utf8');
    bscConfig = bscConfig.replace(
        /pepeStaking: {[\s\S]*?address: '(0x[a-fA-F0-9]{40})'[\s\S]*?}/,
        `pepeStaking: {\n        address: '${stakingAddress}',`
    );
    fs.writeFileSync('frontend/bsc-config.js', bscConfig);

    // Wait 30 seconds before verification
    console.log("\nWaiting 30 seconds before verification...");
    await new Promise(r => setTimeout(r, 30000));

    // Verify contract
    console.log("\nVerifying contract on BSCScan...");
    try {
        await hre.run("verify:verify", {
            address: stakingAddress,
            constructorArguments: [PEPE_TOKEN],
            contract: "contracts/BSCPEPEStaking.sol:BSCPEPEStaking"
        });
        console.log("Contract verified successfully");
    } catch (error) {
        console.log("Error verifying contract:", error);
        console.log("\nYou can try manual verification later using:");
        console.log(`npx hardhat verify --network bsc_testnet ${stakingAddress} "${PEPE_TOKEN}"`);
    }

    console.log("\nNext steps:");
    console.log("1. Set admin addresses");
    console.log("2. Add test addresses to whitelist");
    console.log("3. Fund contract with USDT rewards");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
