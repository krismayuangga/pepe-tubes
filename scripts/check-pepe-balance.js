const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const PEPE_TOKEN_ADDRESS = "0x578a700c214AF091d377f942c15A2413306006bc"; // Updated address

  // Get the contract
  const PEPEToken = await ethers.getContractFactory("PEPEToken");
  const pepeToken = PEPEToken.attach(PEPE_TOKEN_ADDRESS);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Checking balance for address:", signer.address);

  // Check balance
  const balance = await pepeToken.balanceOf(signer.address);
  console.log("Your PEPE balance:", ethers.utils.formatEther(balance));

  // Check total supply
  const totalSupply = await pepeToken.totalSupply();
  console.log("Total PEPE supply:", ethers.utils.formatEther(totalSupply));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
