const hre = require("hardhat");

async function main() {
  // Deploy PEPE Token
  const PEPEToken = await hre.ethers.getContractFactory("PEPEToken");
  const pepeToken = await PEPEToken.deploy();
  await pepeToken.waitForDeployment();
  console.log("PEPE Token deployed to:", await pepeToken.getAddress());

  // Deploy Dummy USDT
  const DummyUSDT = await hre.ethers.getContractFactory("DummyUSDT");
  const dummyUSDT = await DummyUSDT.deploy();
  await dummyUSDT.waitForDeployment();
  console.log("Dummy USDT deployed to:", await dummyUSDT.getAddress());

  // Deploy Staking Contract
  const PEPEStaking = await hre.ethers.getContractFactory("PEPEStaking");
  const pepeStaking = await PEPEStaking.deploy(
    await pepeToken.getAddress(),
    await dummyUSDT.getAddress()
  );
  await pepeStaking.waitForDeployment();
  console.log("PEPE Staking deployed to:", await pepeStaking.getAddress());

  // Save contract addresses for frontend
  const fs = require("fs");
  const addresses = {
    pepeToken: await pepeToken.getAddress(),
    dummyUSDT: await dummyUSDT.getAddress(),
    pepeStaking: await pepeStaking.getAddress()
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Contract addresses saved to deployed-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
