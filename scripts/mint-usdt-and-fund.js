const hre = require("hardhat");

async function main() {
  // Get deployment addresses
  const deployedAddresses = require('../deployed-addresses.json');
  const stakingAddress = deployedAddresses.staking;
  const usdtAddress = deployedAddresses.dummyUSDT;

  console.log("\n🔍 USDT Funding Process");
  console.log("Staking Contract:", stakingAddress);
  console.log("USDT Token:", usdtAddress);

  // Get contracts and signer
  const [signer] = await hre.ethers.getSigners();
  console.log("\nAdmin address:", signer.address);
  
  const usdtContract = await hre.ethers.getContractAt("DummyUSDT", usdtAddress);
  const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);

  // 1. Check current USDT balances
  const signerBalance = await usdtContract.balanceOf(signer.address);
  const contractBalance = await usdtContract.balanceOf(stakingAddress);
  
  console.log("\n📊 Initial USDT Balances:");
  console.log("Admin wallet:", hre.ethers.formatEther(signerBalance), "USDT");
  console.log("Staking contract:", hre.ethers.formatEther(contractBalance), "USDT");

  // 2. Mint USDT tokens if needed (requires ownership of USDT contract)
  if (signerBalance < hre.ethers.parseEther("10000")) {
    console.log("\n🔄 Minting 20,000 USDT tokens to admin wallet...");
    try {
      const mintAmount = hre.ethers.parseEther("20000");
      const mintTx = await usdtContract.mint(signer.address, mintAmount);
      await mintTx.wait(1);
      console.log("✅ Successfully minted USDT tokens");
      
      const newBalance = await usdtContract.balanceOf(signer.address);
      console.log("New admin balance:", hre.ethers.formatEther(newBalance), "USDT");
    } catch (error) {
      console.error("❌ Error minting USDT tokens:", error.message);
      if (error.message.includes("caller is not the owner")) {
        console.log("\n⚠️ You need to be the owner of the USDT contract to mint tokens.");
        console.log("Please contact the USDT contract owner for tokens.");
        process.exit(1);
      }
      throw error;
    }
  }

  // 3. Fund the staking contract with USDT
  console.log("\n💰 Funding staking contract with 10,000 USDT...");
  const fundAmount = hre.ethers.parseEther("10000");
  
  // Approve first
  console.log("Approving USDT transfer...");
  const approveTx = await usdtContract.approve(stakingAddress, fundAmount);
  await approveTx.wait(1);
  console.log("✅ USDT approved for transfer");
  
  // Transfer to contract
  console.log("Transferring USDT to staking contract...");
  const addUsdtTx = await stakingContract.addUSDT(fundAmount);
  await addUsdtTx.wait(1);
  console.log("✅ USDT transferred to contract");

  // 4. Verify final balances
  const finalSignerBalance = await usdtContract.balanceOf(signer.address);
  const finalContractBalance = await usdtContract.balanceOf(stakingAddress);
  
  console.log("\n📊 Final USDT Balances:");
  console.log("Admin wallet:", hre.ethers.formatEther(finalSignerBalance), "USDT");
  console.log("Staking contract:", hre.ethers.formatEther(finalContractBalance), "USDT");
  
  console.log("\n🎉 USDT funding process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
