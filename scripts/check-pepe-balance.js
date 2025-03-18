const hre = require("hardhat");

async function main() {
  const PEPE_TOKEN_ADDRESS = "0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5";
  
  // Get the contract
  const PEPEToken = await hre.ethers.getContractFactory("PEPEToken");
  const pepeToken = PEPEToken.attach(PEPE_TOKEN_ADDRESS);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Checking balance for address:", signer.address);

  // Check balance
  const balance = await pepeToken.balanceOf(signer.address);
  console.log("Your PEPE balance:", ethers.formatEther(balance));

  // Check total supply
  const totalSupply = await pepeToken.totalSupply();
  console.log("Total PEPE supply:", ethers.formatEther(totalSupply));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
