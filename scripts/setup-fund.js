const hre = require("hardhat");

// Fungsi helper untuk menunggu
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  // Alamat dari deployment
  const deployedAddresses = require('../deployed-addresses.json');
  const stakingAddress = deployedAddresses.staking;
  const usdtAddress = deployedAddresses.dummyUSDT;
  
  console.log("\n🔧 Melakukan setup kontrak staking:", stakingAddress);
  
  // Ambil kontrak dan signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Admin address:", signer.address);
  
  const stakingContract = await hre.ethers.getContractAt("BSCPEPEStaking", stakingAddress);
  const usdtContract = await hre.ethers.getContractAt("DummyUSDT", usdtAddress);
  
  // 1. Set admin tambahan (opsional)
  const testWallet = "0x67F8D45F011306476CcaEa5D5fD33c80a8f34f64";
  console.log("\nMenambahkan admin:", testWallet);
  await stakingContract.setAdmin(testWallet, true);
  console.log("✅ Admin berhasil ditambahkan");
  
  // 2. Set lock period untuk testing
  const FIVE_MINUTES = 5 * 60; // 5 menit dalam detik
  console.log("\nMengatur lock period:");
  await stakingContract.setLockPeriod(FIVE_MINUTES);
  console.log("✅ Lock period diatur ke 5 menit");

  // Tunggu sejenak
  await delay(2000);
  
  // 3. Fund kontrak dengan USDT untuk reward
  const fundAmount = hre.ethers.parseEther("10000"); // 10,000 USDT
  console.log("\nMendanai kontrak dengan USDT:");
  
  // Check balance sebelum
  const usdtBalanceBefore = await usdtContract.balanceOf(stakingAddress);
  console.log("USDT balance sebelum:", hre.ethers.formatEther(usdtBalanceBefore));
  
  // Approve dan transfer
  await usdtContract.approve(stakingAddress, fundAmount);
  console.log("✅ USDT approval berhasil");
  
  await stakingContract.addUSDT(fundAmount);
  console.log("✅ USDT transfer berhasil");
  
  // Check balance setelah
  const usdtBalanceAfter = await usdtContract.balanceOf(stakingAddress);
  console.log("USDT balance setelah:", hre.ethers.formatEther(usdtBalanceAfter));
  
  // 4. Tampilkan informasi kontrak
  const lockPeriod = await stakingContract.LOCK_PERIOD();
  const rewardToken = await stakingContract.rewardToken();
  
  console.log("\n📊 Informasi Kontrak:");
  console.log("- Alamat:", stakingAddress);
  console.log("- Lock Period:", Number(lockPeriod), "detik");
  console.log("- Reward Token:", rewardToken);
  console.log("- USDT Balance:", hre.ethers.formatEther(usdtBalanceAfter));
  
  console.log("\n✅ Setup dan funding selesai!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
