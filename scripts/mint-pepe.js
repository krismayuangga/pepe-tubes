const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const PEPE_TOKEN_ADDRESS = "0x8B2afdc4067900E25A20037C05eECdd26c069184";
  
  // Get the contract
  const PEPEToken = await ethers.getContractFactory("PEPEToken");
  const pepeToken = PEPEToken.attach(PEPE_TOKEN_ADDRESS);

  // Mint 1000 PEPE tokens (with 18 decimals)
  const amount = ethers.utils.parseEther("1000");
  console.log("Minting 1000 PEPE tokens...");
  const tx = await pepeToken.mint(ethers.constants.AddressZero, amount);
  console.log("Waiting for transaction confirmation...");
  await tx.wait();
  console.log("Transaction confirmed!");

  // Check balance
  const [signer] = await ethers.getSigners();
  const balance = await pepeToken.balanceOf(signer.address);
  console.log("Your PEPE balance:", ethers.utils.formatEther(balance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });