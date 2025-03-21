const hre = require("hardhat");
const fs = require('fs');

// Fungsi untuk delay
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log("🚀 Memulai deployment kontrak BSCPEPEStaking...");

  // Alamat token yang sudah ada
  const PEPE_TOKEN = "0x578a700c214AF091d377f942c15A2413306006bc";
  const USDT_TOKEN = "0xafFED4B10C3Dc1822bD992F56Dae9F6aBb8E0244";

  // Deploy kontrak staking
  const BSCPEPEStaking = await hre.ethers.getContractFactory("BSCPEPEStaking");
  const staking = await BSCPEPEStaking.deploy(PEPE_TOKEN);
  const deployTx = await staking.deploymentTransaction();
  console.log("Transaksi deployment hash:", deployTx.hash);
  
  await deployTx.wait(2); // Tunggu 2 konfirmasi blok
  const stakingAddress = await staking.getAddress();
  console.log("✅ BSCPEPEStaking deployed to:", stakingAddress);

  // Set USDT sebagai reward token
  console.log("\n⚙️ Mengkonfigurasikan kontrak...");
  console.log("Setting reward token...");
  
  const setRewardTx = await staking.setRewardToken(USDT_TOKEN);
  await setRewardTx.wait(2);
  console.log("✅ USDT set sebagai reward token");
  
  // Tunggu sejenak sebelum mengirim transaksi berikutnya
  console.log("Menunggu 15 detik untuk menghindari nonce error...");
  await delay(15000);
  
  // Set lock period - gunakan nonce yang tepat
  console.log("Setting lock period...");
  const FIVE_MINUTES = 5 * 60;
  
  // Memastikan nonce benar untuk transaksi kedua
  const setLockTx = await staking.setLockPeriod(FIVE_MINUTES, {
    nonce: await staking.runner.provider.getTransactionCount(
      await staking.runner.getAddress()
    )
  });
  
  await setLockTx.wait(2);
  console.log("✅ Lock period set ke 5 menit untuk testing");
  
  // Update konfigurasi
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
  console.log("✅ File konfigurasi updated");
  
  // Update frontend config files
  const configFiles = ['frontend/admin-config.js', 'frontend/bsc-config.js'];
  for (const file of configFiles) {
    try {
      let config = fs.readFileSync(file, 'utf8');
      config = config.replace(
        /pepeStaking: {[\s\S]*?address: '(0x[a-fA-F0-9]{40})'[\s\S]*?}/,
        `pepeStaking: {\n        address: '${stakingAddress}',`
      );
      fs.writeFileSync(file, config);
      console.log(`✅ ${file} updated`);
    } catch (err) {
      console.log(`⚠️ Couldn't update ${file}: ${err.message}`);
    }
  }
  
  // Verifikasi kontrak
  console.log("\n🔍 Memverifikasi kontrak pada BSCScan...");
  try {
    await hre.run("verify:verify", {
      address: stakingAddress,
      constructorArguments: [PEPE_TOKEN],
      contract: "contracts/BSCPEPEStaking.sol:BSCPEPEStaking"
    });
    console.log("✅ Kontrak berhasil diverifikasi");
  } catch (error) {
    console.log("❌ Verifikasi gagal:", error.message);
    console.log("\nSilakan verifikasi manual dengan perintah:");
    console.log(`npx hardhat verify --network bsc_testnet ${stakingAddress} "${PEPE_TOKEN}"`);
  }
  
  console.log("\n🎉 Deployment selesai!");
  console.log("📄 Kontrak baru:", stakingAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
