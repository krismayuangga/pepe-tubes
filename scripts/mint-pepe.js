const hre = require("hardhat");

async function main() {
  const PEPE_TOKEN_ADDRESS = "0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5";
  
  // Get the contract
  const PEPEToken = await hre.ethers.getContractFactory("PEPEToken");
  const pepeToken = PEPEToken.attach(PEPE_TOKEN_ADDRESS);

  // Mint 1000 PEPE tokens (with 18 decimals)
  const amount = ethers.parseEther("1000");
  console.log("Minting 1000 PEPE tokens...");
  const tx = await pepeToken.mint(amount);
  console.log("Waiting for transaction confirmation...");
  await tx.wait();
  console.log("Transaction confirmed!");

  // Check balance
  const [signer] = await hre.ethers.getSigners();
  const balance = await pepeToken.balanceOf(signer.address);
  console.log("Your PEPE balance:", ethers.formatEther(balance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
