const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to BSC Testnet...");

  // Deploy PEPE Token
  const PEPEToken = await hre.ethers.getContractFactory("PEPEToken");
  const pepeToken = await PEPEToken.deploy();
  await pepeToken.waitForDeployment();
  console.log("PEPE Token deployed to:", await pepeToken.getAddress());

  // Deploy Dummy USDT (for testing)
  const DummyUSDT = await hre.ethers.getContractFactory("DummyUSDT");
  const dummyUSDT = await DummyUSDT.deploy();
  await dummyUSDT.waitForDeployment();
  console.log("Dummy USDT deployed to:", await dummyUSDT.getAddress());

  // Deploy Staking Contract
  const BSCPEPEStaking = await hre.ethers.getContractFactory("BSCPEPEStaking");
  const staking = await BSCPEPEStaking.deploy(await pepeToken.getAddress());
  await staking.waitForDeployment();
  console.log("BSC PEPE Staking deployed to:", await staking.getAddress());

  // Set USDT as reward token
  await staking.setRewardToken(await dummyUSDT.getAddress());
  console.log("Set USDT as reward token");

  // Save deployment addresses
  const fs = require('fs');
  const deployedAddresses = {
    pepeToken: await pepeToken.getAddress(),
    dummyUSDT: await dummyUSDT.getAddress(),
    staking: await staking.getAddress(),
    network: "bsc_testnet"
  };

  fs.writeFileSync(
    'deployed-addresses.json',
    JSON.stringify(deployedAddresses, null, 2)
  );
  console.log("Deployment addresses saved to deployed-addresses.json");

  // Verify contracts on BSCScan
  console.log("\nVerifying contracts on BSCScan...");
  
  try {
    await hre.run("verify:verify", {
      address: await pepeToken.getAddress(),
      constructorArguments: []
    });
    console.log("PEPE Token verified");
  } catch (error) {
    console.log("Error verifying PEPE Token:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await dummyUSDT.getAddress(),
      constructorArguments: []
    });
    console.log("Dummy USDT verified");
  } catch (error) {
    console.log("Error verifying Dummy USDT:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: await staking.getAddress(),
      constructorArguments: [await pepeToken.getAddress()]
    });
    console.log("BSC PEPE Staking verified");
  } catch (error) {
    console.log("Error verifying BSC PEPE Staking:", error.message);
  }

  console.log("\nDeployment completed!");
  console.log("Next steps:");
  console.log("1. Fund the staking contract with USDT rewards");
  console.log("2. Update the contract addresses in frontend/bsc-config.js");
  console.log("3. Start the frontend server");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
