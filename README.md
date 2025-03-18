# PEPE Staking dApp

## Cara Menjalankan dApp Lokal

1. Clone repository ini:
```bash
git clone [URL_REPOSITORY]
cd pepe-project
```

2. Install dependencies:
```bash
npm install
```

3. Jalankan server lokal:
```bash
cd frontend
python3 -m http.server 8000
```

4. Buka browser dan akses:
```
http://localhost:8000/bsc.html
```

## Kontrak yang Digunakan (BSC Testnet)

- PEPE Token: 0xf8FAbd399e2E3B57761929d04d5eEdA13bcA4
- Staking Contract: 0x34b520567306EdF17CA642A2A8EB392fC7C7853C

## Cara Menggunakan dApp

1. Setup MetaMask:
   - Install MetaMask dari https://metamask.io
   - Tambahkan BSC Testnet:
     * Network Name: BSC Testnet
     * RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
     * Chain ID: 97
     * Symbol: tBNB
     * Block Explorer: https://testnet.bscscan.com

2. Dapatkan BNB Testnet:
   - Kunjungi https://testnet.bnbchain.org/faucet-smart
   - Masukkan alamat wallet Anda
   - Request BNB testnet (gratis)

3. Dapatkan PEPE Token:
   - Tambahkan token ke MetaMask dengan contract address: 0xf8FAbd399e2E3B57761929d04d5eEdA13bcA4
   - Minta transfer PEPE token dari deployer address: 0x8C41774Ac950B287D6dcFD51ABA48e46f0815eE1

4. Staking:
   - Connect wallet di dApp
   - Masukkan jumlah PEPE yang ingin di-stake
   - Approve token spending
   - Konfirmasi transaksi staking

5. Unstaking & Rewards:
   - Monitor rewards yang terkumpul
   - Klaim rewards dengan klik "Claim Rewards"
   - Unstake token dengan klik "Unstake All"

## Catatan

- Pastikan memiliki cukup BNB testnet untuk gas fee
- Semua transaksi bisa dimonitor di https://testnet.bscscan.com
- Jika ada masalah, pastikan:
  * Terhubung ke BSC Testnet
  * Memiliki cukup BNB untuk gas
  * MetaMask sudah terinstall dengan benar
