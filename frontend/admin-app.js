// Global Constants
const LOCK_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds

// Global Variables
let provider, signer, stakingContract;
let userAddress = null;
let userStakes = [];
let poolsInfo = [];

// UI Elements
const connectWalletBtn = document.getElementById('connectWallet');
const adminAddressInput = document.getElementById('adminAddress');
const setAdminButton = document.getElementById('setAdminButton');
const rewardTokenAddressInput = document.getElementById('rewardTokenAddress');
const setRewardTokenButton = document.getElementById('setRewardTokenButton');
const poolsContainer = document.getElementById('poolsContainer');
const whitelistAddressInput = document.getElementById('whitelistAddress');
const whitelistTypeSelect = document.getElementById('whitelistType');
const addToWhitelistButton = document.getElementById('addToWhitelistButton');
const poolSelect = document.getElementById('poolSelect');
const minStakeInput = document.getElementById('minStake');
const maxHoldersInput = document.getElementById('maxHolders');
const rewardPerHolderInput = document.getElementById('rewardPerHolder');
const updatePoolButton = document.getElementById('updatePoolButton');
const distributeRewardsButton = document.getElementById('distributeRewardsButton');
const stakingTable = document.getElementById('stakingTable');
const poolStats = document.getElementById('poolStats');

// Add notification div if not exists
const notificationDiv = `
    <div id="notification" class="hidden fixed bottom-4 right-4 max-w-md bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
        <p id="notificationText"></p>
    </div>
`;

if (!document.getElementById('notification')) {
    document.body.insertAdjacentHTML('beforeend', notificationDiv);
}

// Helper Functions
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    notification.className = `fixed bottom-4 right-4 max-w-md ${isError ? 'bg-red-600' : 'bg-green-600'} text-white px-6 py-3 rounded-lg shadow-lg`;
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 3000);
}

// Connect Wallet with Admin Check
async function connectWallet() {
    try {
        console.log('Memulai proses koneksi wallet...'); // Debug log
        
        if (typeof window.ethereum === 'undefined') {
            console.error('MetaMask tidak terdeteksi!');
            showNotification('MetaMask diperlukan untuk menggunakan aplikasi ini', true);
            return;
        }
        
        console.log('Meminta akses ke akun MetaMask...');
        
        // Coba akses akun terlebih dahulu
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('Akses ke akun berhasil');
        } catch (error) {
            console.error('Error requesting accounts:', error);
            showNotification('Gagal mengakses MetaMask: ' + error.message, true);
            return;
        }
        
        // Inisialisasi provider dan signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log('Provider initialized:', provider);
        
        signer = provider.getSigner();
        console.log('Signer initialized');
        
        userAddress = await signer.getAddress();
        console.log('Connected address:', userAddress);

        // Initialize contracts dengan ABI yang lengkap
        try {
            stakingContract = new ethers.Contract(
                CONFIG.pepeStaking.address,
                CONFIG.pepeStaking.abi,
                signer
            );
            console.log('Staking contract initialized:', CONFIG.pepeStaking.address);
        } catch (contractError) {
            console.error('Error initializing contract:', contractError);
            showNotification('Gagal menginisialisasi kontrak', true);
            return;
        }

        // Check if connected wallet is admin or owner
        try {
            const [isAdmin, owner] = await Promise.all([
                stakingContract.isAdmin(userAddress),
                stakingContract.owner()
            ]);
            
            console.log('Is admin:', isAdmin);
            console.log('Owner address:', owner);
            console.log('User address:', userAddress);

            if (!isAdmin && owner.toLowerCase() !== userAddress.toLowerCase()) {
                showNotification('Akses ditolak: Bukan admin atau owner', true);
                return;
            }
        } catch (accessError) {
            console.error('Error checking admin status:', accessError);
            showNotification('Gagal memeriksa status admin', true);
            return;
        }

        // Update UI jika adalah admin
        connectWalletBtn.innerHTML = `<i class="fas fa-wallet mr-2"></i>${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        connectWalletBtn.classList.remove('bg-white', 'text-green-600');
        connectWalletBtn.classList.add('bg-green-100', 'text-green-800', 'cursor-default');

        // Initialize UI
        await updateUI();
        showNotification('Admin berhasil terhubung!');

        // Mulai auto-refresh
        startAutoRefresh();
        console.log('Auto-refresh started');
        
        // Update stakes display
        updateActiveStakes();
        setInterval(updateActiveStakes, 10000);
        console.log('Stakes display initialized');

        // Update lock period display
        await updateLockPeriodDisplay();
        console.log('Lock period display updated');
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        console.log('Error details:', error); // Debug log
        showNotification('Gagal terhubung: ' + error.message, true);
    }
}

// Update Pools
async function updatePools() {
    try {
        const pools = await stakingContract.getAllPoolsInfo();
        poolsContainer.innerHTML = pools.map((pool, index) => createPoolCard(pool, index)).join('');
    } catch (error) {
        console.error('Error updating pools:', error);
        showNotification('Error updating pools', true);
    }
}

// Create Pool Card
function createPoolCard(pool, index) {
    return `
        <div class="bg-gray-50 p-4 rounded-lg shadow-lg">
            <h3 class="text-lg font-bold mb-2">Pool ${index + 1}</h3>
            <p class="text-sm text-gray-600">Min Stake: ${ethers.utils.formatUnits(pool.minStakeAmount, 18)} PEPE</p>
            <p class="text-sm text-gray-600">Max Holders: ${pool.maxHolders}</p>
            <p class="text-sm text-gray-600">Reward: ${ethers.utils.formatUnits(pool.rewardPerHolder, 18)} USDT</p>
            <p class="text-sm text-gray-600">Total Staked: ${ethers.utils.formatUnits(pool.totalStaked, 18)} PEPE</p>
            <p class="text-sm text-gray-600">Current Holders: ${pool.currentHolders}</p>
            <p class="text-sm text-gray-600">Active: ${pool.isActive ? 'Yes' : 'No'}</p>
        </div>
    `;
}

// Set Admin
async function setAdmin() {
    try {
        const adminAddress = adminAddressInput.value;
        if (!adminAddress) {
            showNotification('Admin address is required', true);
            return;
        }

        const tx = await stakingContract.setAdmin(adminAddress, true);
        await tx.wait();
        showNotification('Admin set successfully!');
        adminAddressInput.value = '';
    } catch (error) {
        console.error('Error setting admin:', error);
        showNotification(error.message, true);
    }
}

// Set Reward Token
async function setRewardToken() {
    try {
        const rewardTokenAddress = rewardTokenAddressInput.value;
        if (!rewardTokenAddress) {
            showNotification('Reward token address is required', true);
            return;
        }

        const tx = await stakingContract.setRewardToken(rewardTokenAddress);
        await tx.wait();
        showNotification('Reward token set successfully!');
        rewardTokenAddressInput.value = '';
    } catch (error) {
        console.error('Error setting reward token:', error);
        showNotification(error.message, true);
    }
}

// Whitelist Management
async function addToWhitelist() {
    try {
        const address = whitelistAddressInput.value;

        if (!ethers.utils.isAddress(address)) {
            showNotification('Invalid address', true);
            return;
        }

        const tx = await stakingContract.setWhitelist(address, true);
        await tx.wait();

        showNotification('Address whitelisted successfully');
        whitelistAddressInput.value = '';
    } catch (error) {
        console.error('Error adding to whitelist:', error);
        showNotification(error.message, true);
    }
}

// Pool Management
async function updatePool() {
    try {
        const poolId = poolSelect.value;
        const minStake = ethers.utils.parseEther(minStakeInput.value);
        const maxHolders = maxHoldersInput.value;
        const reward = ethers.utils.parseEther(rewardPerHolderInput.value);

        const tx = await stakingContract.updatePool(poolId, minStake, maxHolders, reward);
        await tx.wait();

        showNotification('Pool updated successfully');
        updateUI();
    } catch (error) {
        console.error('Error updating pool:', error);
        showNotification(error.message, true);
    }
}

// Reward Distribution
async function distributeRewards() {
    try {
        console.log('Memulai proses distribusi rewards...'); 
        
        // Check jika kontrak memiliki cukup USDT
        const usdtContract = new ethers.Contract(
            CONFIG.dummyUSDT.address,
            CONFIG.dummyUSDT.abi,
            signer
        );
        const contractBalance = await usdtContract.balanceOf(CONFIG.pepeStaking.address);
        console.log('USDT balance kontrak:', ethers.utils.formatEther(contractBalance));

        // Dapatkan lock period
        const lockPeriod = await stakingContract.LOCK_PERIOD();
        const now = Math.floor(Date.now() / 1000);
        const pools = await stakingContract.getAllPoolsInfo();
        
        // PERBAIKAN: Cek stake milik test wallet juga, bukan hanya admin
        const testWallets = [
            "0x67F8D45F011306476CcaEa5D5fD33c80a8f34f64", // Test wallet 1
            userAddress // Admin wallet
        ];
        
        let readyStakes = [];
        let stakesOwners = {};
        
        // Cek stake dari semua wallet test
        for (const wallet of testWallets) {
            console.log(`Checking stakes for ${wallet}...`);
            const userStakes = await stakingContract.getUserStakes(wallet);
            
            // Filter stake yang siap untuk unstake (sudah melewati lock period dan belum diklaim)
            const walletReadyStakes = userStakes.filter(stake => 
                !stake.hasClaimedReward && 
                now >= Number(stake.startTime) + Number(lockPeriod)
            );
            
            // Simpan informasi pemilik stake untuk digunakan nanti
            walletReadyStakes.forEach((stake, index) => {
                stakesOwners[readyStakes.length + index] = wallet;
            });
            
            readyStakes = [...readyStakes, ...walletReadyStakes];
            console.log(`Found ${walletReadyStakes.length} ready stakes for ${wallet}`);
        }
        
        console.log('Total ready stakes found:', readyStakes.length);

        if (readyStakes.length === 0) {
            showNotification('Tidak ada stake yang siap untuk reward', true);
            return;
        }

        // Hitung total USDT yang dibutuhkan
        let totalNeeded = ethers.BigNumber.from(0);
        for (const stake of readyStakes) {
            const pool = pools[stake.poolId];
            totalNeeded = totalNeeded.add(pool.rewardPerHolder);
        }
        console.log('Total USDT needed:', ethers.utils.formatEther(totalNeeded));

        if (contractBalance.lt(totalNeeded)) {
            showNotification('USDT dalam kontrak tidak mencukupi', true);
            return;
        }

        // Informasi stake yang siap untuk distribusi
        console.log('\nStakes yang siap untuk distribusi:');
        readyStakes.forEach((stake, index) => {
            const wallet = stakesOwners[index];
            const pool = pools[stake.poolId];
            console.log(`- Wallet: ${wallet.slice(0,8)}...`);
            console.log(`  Pool: ${Number(stake.poolId) + 1}`);
            console.log(`  Amount: ${ethers.utils.formatEther(stake.amount)} PEPE`);
            console.log(`  Reward: ${ethers.utils.formatEther(pool.rewardPerHolder)} USDT`);
        });
        
        // Konfirmasi dengan user sebelum melakukan unstake
        if (confirm(`Terdapat ${readyStakes.length} stake yang siap untuk distribusi reward. Lanjutkan?`)) {
            // PERBAIKAN: Stake harus di-unstake satu per satu berdasarkan index dan wallet
            // Karena tidak ada distributeRewards di kontrak, kita perlu unstake tiap stake
            
            showNotification(`Memulai proses unstake untuk ${readyStakes.length} stake...`);
            
            // Admin tidak dapat melakukan unstake untuk orang lain dalam kontrak ini
            // Kita beri tahu user bahwa mereka harus melakukan unstake sendiri
            showNotification('Silakan beritahu pemilik wallet untuk melakukan unstake secara manual', true);
            
            // Tampilkan daftar stake yang siap untuk diambil
            const stakesInfo = readyStakes.map((stake, index) => {
                const wallet = stakesOwners[index];
                const pool = pools[stake.poolId];
                return `
                    <div class="border-b border-gray-200 py-3">
                        <div><strong>Wallet:</strong> ${wallet.slice(0,8)}...</div>
                        <div><strong>Pool:</strong> ${Number(stake.poolId) + 1}</div>
                        <div><strong>Amount:</strong> ${ethers.utils.formatEther(stake.amount)} PEPE</div>
                        <div><strong>Reward:</strong> ${ethers.utils.formatEther(pool.rewardPerHolder)} USDT</div>
                    </div>
                `;
            }).join('');
            
            const stakesListModal = document.createElement('div');
            stakesListModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            stakesListModal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                    <h3 class="text-xl font-bold mb-4">Stakes Ready for Reward</h3>
                    <div class="mb-4">
                        ${stakesInfo}
                    </div>
                    <button class="w-full bg-blue-600 text-white py-2 rounded-lg mt-4">Close</button>
                </div>
            `;
            
            document.body.appendChild(stakesListModal);
            stakesListModal.querySelector('button').onclick = () => stakesListModal.remove();
        }
        
        // Refresh UI
        await updateUI();
        
    } catch (error) {
        console.error('Distribution error:', error);
        showNotification(error.message, true);
    }
}

// Update UI
async function updateUI() {
    try {
        if (!stakingContract || !userAddress) return;

        // Get fresh data
        const [stakes, pools, lockPeriod] = await Promise.all([
            stakingContract.getUserStakes(userAddress),
            stakingContract.getAllPoolsInfo(),
            stakingContract.LOCK_PERIOD()
        ]);

        // Update lock period display
        const minutes = Math.floor(Number(lockPeriod) / 60);
        safeUpdateElement('stakingPeriod', `${minutes} Minutes (Testing)`);

        // Update total staked
        const totalStaked = pools.reduce((acc, pool) => 
            acc.add(pool.totalStaked), ethers.BigNumber.from(0));
        safeUpdateElement('totalStakes', 
            `${Number(formatAmount(totalStaked)).toLocaleString()}`);

        // Update other stats
        safeUpdateElement('activeStakers', 
            await getActiveStakersCount() || '0');
        
        // Update pool stats
        updatePoolStats(pools);
        updateActiveStakes();
        await updateContractBalance();

    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Helper Functions
function updatePoolStats(pools) {
    if (!pools || !poolStats) return;

    // Format number with commas
    function formatNumber(num) {
        return Number(ethers.utils.formatEther(num)).toLocaleString();
    }

    const poolCards = pools.map((pool, index) => {
        return `
            <div class="mb-4 p-4 bg-white rounded-lg shadow">
                <h3 class="font-bold text-lg mb-2">Pool ${index + 1}</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Stake Amount:</p>
                        <p class="font-medium">${formatNumber(pool.minStakeAmount)} PEPE</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Reward:</p>
                        <p class="font-medium">${formatNumber(pool.rewardPerHolder)} USDT</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Total Staked:</p>
                        <p class="font-medium">${formatNumber(pool.totalStaked)} PEPE</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Holders:</p>
                        <p class="font-medium">${pool.currentHolders}/${pool.maxHolders}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Status:</p>
                        <p class="font-medium">${pool.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                </div>
            </div>
        `;
    });

    poolStats.innerHTML = poolCards.join('');
}

function updateStakingTable(stakes) {
    stakingTable.innerHTML = stakes.map(stake => `
        <tr>
            <td class="px-6 py-4">${stake.user.slice(0, 8)}...</td>
            <td class="px-6 py-4">Pool ${stake.poolId + 1}</td>
            <td class="px-6 py-4">${ethers.utils.formatEther(stake.amount)} PEPE</td>
            <td class="px-6 py-4">${stake.hasClaimedReward ? 'Claimed' : 'Pending'}</td>
            <td class="px-6 py-4">
                <button onclick="forceUnstake('${stake.user}', ${stake.poolId})" 
                        class="text-red-600 hover:text-red-800">
                    Force Unstake
                </button>
            </td>
        </tr>
    `).join('');
}

function updateRewardInfo(info) {
    document.getElementById('availableRewards').textContent = 
        `${ethers.utils.formatEther(info.available)} USDT`;
    document.getElementById('pendingRewards').textContent = 
        `${ethers.utils.formatEther(info.pending)} USDT`;
}

// Fungsi untuk monitoring stakes yang lebih sederhana
async function updateActiveStakes() {
    try {
        const container = document.getElementById('activeStakesContainer');
        if (!stakingContract || !container) return;

        // Get lock period
        const lockPeriod = await stakingContract.LOCK_PERIOD();

        // PERBAIKAN: Dapatkan semua stakes dari semua user, bukan hanya dari current user
        // Ini memerlukan loop melalui semua stake di semua pool untuk admin dashboard
        
        let allStakes = [];
        
        // Dapatkan semua active stakes di semua pools
        const pools = await stakingContract.getAllPoolsInfo();
        
        // Tambahkan polling untuk semua stake yang terhubung dengan wallet yang sudah melakukan stake
        // Untuk tujuan admin, kita perlu cek semua stake dari current user
        const userStakes = await stakingContract.getUserStakes(userAddress);
        
        // Jika tidak ada stake dari current user, coba cek test wallet juga
        let testWalletAddr = "0x67F8D45F011306476CcaEa5D5fD33c80a8f34f64";
        const testWalletStakes = await stakingContract.getUserStakes(testWalletAddr);
        
        // Gabungkan semua stake
        allStakes = [...userStakes];
        if (testWalletStakes.length > 0) {
            allStakes = [...allStakes, ...testWalletStakes];
        }

        // Update UI with stakes data
        if (allStakes.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No active stakes found</td></tr>';
            return;
        }
        
        const now = Math.floor(Date.now() / 1000);
        
        let html = '';
        for (let i = 0; i < allStakes.length; i++) {
            const stake = allStakes[i];
            if (stake.hasClaimedReward) continue; // Skip claimed stakes
            
            const endTime = Number(stake.startTime) + Number(lockPeriod);
            const timeLeft = endTime - now;
            const status = timeLeft <= 0 ? '🟢 READY' : '🟡 LOCKED';
            const statusColor = timeLeft <= 0 ? 'text-green-600' : 'text-yellow-600';
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">Pool #${Number(stake.poolId) + 1}</td>
                    <td class="px-4 py-3 font-mono text-sm">${i < userStakes.length ? userAddress.slice(0,8)+'...' : testWalletAddr.slice(0,8)+'...'}</td>
                    <td class="px-4 py-3">${formatAmount(stake.amount)} PEPE</td>
                    <td class="px-4 py-3">${timeLeft > 0 ? timeLeft + " seconds" : "COMPLETED"}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs ${statusColor}">
                            ${status}
                        </span>
                    </td>
                </tr>
            `;
        }
        
        if (html === '') {
            html = '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No active stakes found</td></tr>';
        }
        
        container.innerHTML = html;

    } catch (error) {
        console.error('Error updating active stakes:', error);
        document.getElementById('activeStakesContainer').innerHTML = 
            '<tr><td colspan="5" class="px-4 py-3 text-center text-red-500">Error loading stakes: ' + error.message + '</td></tr>';
    }
}

// Fungsi untuk menambah USDT ke kontrak
async function addUsdtToContract() {
    try {
        const amount = prompt("Enter USDT amount to add:");
        if (!amount) return;
        
        const usdtAmount = ethers.utils.parseEther(amount);
        const usdtContract = new ethers.Contract(
            CONFIG.dummyUSDT.address,
            CONFIG.dummyUSDT.abi,
            signer
        );
        
        // Approve first
        const approveTx = await usdtContract.approve(stakingContract.address, usdtAmount);
        await approveTx.wait();
        
        // Add USDT to contract
        const tx = await stakingContract.addUSDT(usdtAmount);
        await tx.wait();
        
        showNotification('Successfully added USDT to contract');
        updateUI();
    } catch (error) {
        console.error('Error adding USDT:', error);
        showNotification(error.message, true);
    }
}

// Update contract USDT balance
async function updateContractBalance() {
    if (!stakingContract) return;

    const usdtContract = new ethers.Contract(
        CONFIG.dummyUSDT.address,
        CONFIG.dummyUSDT.abi,
        signer
    );
    
    const balance = await usdtContract.balanceOf(stakingContract.address);
    document.getElementById('contractUsdtBalance').textContent = 
        `${formatAmount(balance)} USDT`;
}

// Add contract data fetching
async function getContractData() {
    try {
        if (!stakingContract || !userAddress) return;

        // Get all pools info
        const poolData = await stakingContract.getAllPoolsInfo();
        console.log('Pools info:', poolData); // Debug log

        // Get total stakers count
        const totalStakers = await getActiveStakersCount();

        // Calculate total staked PEPE   
        const totalStaked = poolData.reduce((acc, pool) => 
            acc.add(pool.totalStaked), ethers.BigNumber.from(0));

        // Update UI elements
        document.getElementById('totalStakes').textContent = 
            `${Number(formatAmount(totalStaked)).toLocaleString()}`;
        document.getElementById('activeStakers').textContent = totalStakers;
        
        // Calculate pending rewards
        const pendingRewards = await calculatePendingRewards(poolData);
        document.getElementById('pendingRewards').textContent = 
            formatAmount(pendingRewards);

        // Update pool stats
        updatePoolStats(poolData);

        // Update contract USDT balance
        await updateContractBalance();

        return { pools: poolData, totalStakers, pendingRewards };
    } catch (error) {
        console.error('Error fetching contract data:', error);
        showNotification('Error fetching contract data', true);
    }
}

// Add helper function to get active stakers count
async function getActiveStakersCount() {
    try {
        const pools = await stakingContract.getAllPoolsInfo();
        let totalHolders = 0;
        for (const pool of pools) {
            totalHolders += Number(pool.currentHolders);
        }
        return totalHolders;
    } catch (error) {
        console.error('Error getting stakers count:', error);
        return 0;
    }
}

// Add helper function to calculate pending rewards
async function calculatePendingRewards(pools) {
    try {
        let totalPending = ethers.BigNumber.from(0);
        for (let poolId = 0; poolId < pools.length; poolId++) {
            const pool = pools[poolId];
            const stakes = await stakingContract.getUserStakes(userAddress);
            const poolStakes = stakes.filter(stake => Number(stake.poolId) === poolId);
               
            for (const stake of poolStakes) {
                if (!stake.hasClaimedReward && 
                    Date.now() / 1000 >= Number(stake.startTime) + LOCK_PERIOD) {
                    totalPending = totalPending.add(pool.rewardPerHolder);
                }
            }
        }
        return totalPending;
    } catch (error) {
        console.error('Error calculating pending rewards:', error);
        return ethers.BigNumber.from(0);
    }
}

// Add auto-refresh
function startAutoRefresh() {
    // Initial load with retry logic
    const tryUpdate = async (retries = 3) => {
        try {
            await getContractData();
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying update... (${retries} attempts left)`);
                setTimeout(() => tryUpdate(retries - 1), 2000);
            }
        }
    };

    // Start updates
    tryUpdate();
    
    // Regular updates every 30 seconds
    setInterval(() => tryUpdate(), 30000);

    // Check lock period every 10 seconds dengan error handling
    setInterval(async () => {
        try {
            const currentPeriod = await getCurrentLockPeriod();
            if (currentPeriod > 0) {
                const minutes = Math.floor(currentPeriod / 60);
                safeUpdateElement('stakingPeriod', `${minutes} Minutes (Testing)`);
            }
        } catch (error) {
            console.error('Error updating lock period:', error);
        }
    }, 10000);
}

// Add helper functions untuk format waktu
function calculateTimeRemaining(startTime) {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(startTime) + LOCK_PERIOD;
    const remaining = endTime - now;

    if (remaining <= 0) {
        return {
            remaining: 0,
            text: 'Completed'
        };
    }

    const days = Math.floor(remaining / (24 * 3600));
    const hours = Math.floor((remaining % (24 * 3600)) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    return {
        remaining,
        text: `${days}d ${hours}h ${minutes}m`
    };
}

// Perbaikan fungsi formatAmount
function formatAmount(amount, decimals = 18) {
    try {
        if (!amount) return "0";
        if (typeof amount === 'string') return amount;
        return ethers.utils.formatUnits(amount, decimals);
    } catch (error) {
        console.error('Error formatting amount:', error);
        return "0";
    }
}

// Pindahkan semua event listeners ke dalam DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Connect wallet button
    const connectWalletBtn = document.getElementById('connectWallet');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }

    // Other buttons
    const addUsdtButton = document.getElementById('addUsdtButton');
    if (addUsdtButton) {
        addUsdtButton.addEventListener('click', addUsdtToContract);
    }

    const setAdminButton = document.getElementById('setAdminButton');
    if (setAdminButton) {
        setAdminButton.addEventListener('click', setAdmin);
    }

    const setRewardTokenButton = document.getElementById('setRewardTokenButton');
    if (setRewardTokenButton) {
        setRewardTokenButton.addEventListener('click', setRewardToken);
    }

    const addToWhitelistButton = document.getElementById('addToWhitelistButton');
    if (addToWhitelistButton) {
        addToWhitelistButton.addEventListener('click', addToWhitelist);
    }

    const updatePoolButton = document.getElementById('updatePoolButton');
    if (updatePoolButton) {
        updatePoolButton.addEventListener('click', updatePool);
    }

    const distributeRewardsButton = document.getElementById('distributeRewardsButton');
    if (distributeRewardsButton) {
        distributeRewardsButton.addEventListener('click', distributeRewards);
    }

    // Check if wallet is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet().then(() => {
            startAutoRefresh();
        });
    }

    // Add setup button
    const navContainer = document.querySelector('nav .container');
    if (navContainer) {
        // Setup button
        const setupButton = document.createElement('button');
        setupButton.className = 'ml-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700';
        setupButton.innerHTML = '<i class="fas fa-cog mr-2"></i>Setup Contract';
        setupButton.onclick = setupInitialConfig;
        navContainer.appendChild(setupButton);

        // Whitelist button
        const whitelistButton = document.createElement('button');
        whitelistButton.className = 'ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700';
        whitelistButton.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Whitelist Test';
        whitelistButton.onclick = whitelistTestAddresses;
        navContainer.appendChild(whitelistButton);
    }
    
    // Update lock period display
    updateLockPeriod();
});

// Test addresses for whitelist
const TEST_ADDRESSES = [
    "0x67F8D45F011306476CcaEa5D5fD33c80a8f34f64", // Test wallet 1
    "0x8C41774Ac950B287D6dcFD51ABA48e46f0815eE1"  // Test wallet 2
];

// Whitelist function
async function whitelistTestAddresses() {
    try {
        console.log('Whitelisting test addresses...');
        for (const address of TEST_ADDRESSES) {
            const tx = await stakingContract.setWhitelist(address, true);
            await tx.wait();
            console.log(`Address ${address} whitelisted`);
        }
        
        showNotification('Test addresses whitelisted successfully');
    } catch (error) {
        console.error('Error whitelisting addresses:', error);
        showNotification(error.message, true);
    }
}

// Setup function
async function setupInitialConfig() {
    try {
        console.log('Starting initial setup...');
        
        // Set USDT as reward token
        const usdtAddress = CONFIG.dummyUSDT.address;
        console.log('Setting USDT address:', usdtAddress);
        const tx = await stakingContract.setRewardToken(usdtAddress);
        await tx.wait();
        console.log('USDT set as reward token');
        
        showNotification('USDT token set successfully');
        await updateUI();
    } catch (error) {
        console.error('Setup error:', error);
        showNotification(error.message, true);
    }
}

// Add Lock Period Management
async function setLockPeriod() {
    try {
        const days = document.getElementById('lockPeriodDays').value;
        if (!days || days <= 0) {
            showNotification('Please enter valid number of days', true);
            return;
        }
        const newPeriod = days * 24 * 60 * 60; // Convert days to seconds
        const tx = await stakingContract.setLockPeriod(newPeriod);
        await tx.wait();
        showNotification(`Lock period updated to ${days} days`);
        updateLockPeriod();
    } catch (error) {
        console.error('Error setting lock period:', error);
        showNotification(error.message, true);
    }
}

async function updateLockPeriod() {
    try {
        if (!stakingContract) {
            console.log("Contract not initialized yet");
            return;
        }
        const lockPeriod = await stakingContract.LOCK_PERIOD();
        const days = Math.floor(Number(lockPeriod) / (24 * 60 * 60));
        document.getElementById('currentLockPeriod').textContent = days;
    } catch (error) {
        console.error('Error getting lock period:', error);
    }
}

// Add to existing DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    updateLockPeriod(); // Add this line
});

// Lock Period Management Functions
async function setQuickLockPeriod() {
    try {
        // Set to 5 minutes (300 seconds)
        const period = 300; // 5 minutes in seconds
        const tx = await stakingContract.setLockPeriod(period);
        await tx.wait();
        
        // Important: Update display immediately
        await updateLockPeriodDisplay();
        showNotification('Lock period updated to 5 minutes');
    } catch (error) {
        console.error('Error setting lock period:', error);
        showNotification(error.message, true);
    }
}

async function setCustomLockPeriod() {
    try {
        const days = document.getElementById('customLockPeriod').value;
        if (!days || days <= 0) {
            showNotification('Please enter valid number of days', true);
            return;
        }
        const period = days * 24 * 60 * 60; // Convert days to seconds
        const tx = await stakingContract.setLockPeriod(period);
        await tx.wait();
        showNotification('Lock period updated successfully');
        updateLockPeriodDisplay();
    } catch (error) {
        console.error('Error setting lock period:', error);
        showNotification(error.message, true);
    }
}

async function updateLockPeriodDisplay() {
    try {
        if (!stakingContract) {
            console.log("Contract not initialized yet");
            return;
        }
        const lockPeriod = await stakingContract.LOCK_PERIOD();
        const days = Math.floor(Number(lockPeriod) / (24 * 60 * 60));
        document.getElementById('currentLockPeriod').textContent = days;
        document.getElementById('lockPeriodInSeconds').textContent = 
            `${Number(lockPeriod).toLocaleString()} seconds`;
    } catch (error) {
        console.error('Error updating lock period display:', error);
    }
}

// Add to existing DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    updateLockPeriodDisplay(); // Add this line
});

// Add after other helper functions
function safeUpdateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`Element not found: ${id}`);
    }
}

// Add helper function untuk get current lock period
async function getCurrentLockPeriod() {
    try {
        if (!stakingContract) return 0;
        const period = await stakingContract.LOCK_PERIOD();
        return Number(period);
    } catch (error) {
        console.error('Error getting lock period:', error);
        return 0;
    }
}

// Function untuk menghitung total rewards yang sudah didistribusikan
async function getTotalDistributedRewards() {
    try {
        const stakes = await stakingContract.getUserStakes(userAddress);
        const pools = await stakingContract.getAllPoolsInfo();
        
        let totalDistributed = ethers.BigNumber.from(0);
        
        // Hitung total rewards dari stakes yang sudah diklaim
        for (const stake of stakes) {
            if (stake.hasClaimedReward) {
                const pool = pools[stake.poolId];
                totalDistributed = totalDistributed.add(pool.rewardPerHolder);
            }
        }
        
        return totalDistributed;
    } catch (error) {
        console.error('Error calculating distributed rewards:', error);
        return ethers.BigNumber.from(0);
    }
}

// Tambahkan ini ke DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    
    // Panggil updateActiveStakes segera setelah admin terhubung
    if (document.getElementById('connectWallet')) {
        const connectButton = document.getElementById('connectWallet');
        const originalOnClick = connectButton.onclick;
        
        connectButton.onclick = async () => {
            if (originalOnClick) await originalOnClick();
            if (userAddress) {
                updateActiveStakes();
                setInterval(updateActiveStakes, 10000);
            }
        };
    }
    
    // Buat tombol refresh untuk stakes
    const activeStakesHeader = document.querySelector('#activeStakesContainer').closest('.bg-white').querySelector('h2');
    if (activeStakesHeader) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 ml-2';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Refresh';
        refreshButton.onclick = updateActiveStakes;
        activeStakesHeader.appendChild(refreshButton);
    }
    
    // ...existing code...
});