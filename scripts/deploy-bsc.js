const hre = require("hardhat");

async function main() {
  console.log("Deploying BSCPEPEStaking contract...");

  // PEPE Token address on BSC Testnet
  const PEPE_TOKEN_ADDRESS = "0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5";
  
  // Deploy BSCPEPEStaking
  const BSCPEPEStaking = await hre.ethers.getContractFactory("BSCPEPEStaking");
  const staking = await BSCPEPEStaking.deploy(PEPE_TOKEN_ADDRESS);

  console.log("Waiting for deployment...");
  await staking.waitForDeployment();

  const stakingAddress = await staking.getAddress();
  console.log("BSCPEPEStaking deployed to:", stakingAddress);
  console.log("PEPE Token address:", PEPE_TOKEN_ADDRESS);

  // Verify contract on BSCScan
  console.log("Waiting for 5 block confirmations before verification...");
  await staking.deploymentTransaction().wait(5);

  console.log("Verifying contract on BSCScan...");
  try {
    await hre.run("verify:verify", {
      address: stakingAddress,
      constructorArguments: [PEPE_TOKEN_ADDRESS],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
