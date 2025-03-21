let provider, signer, pepeToken, stakingContract, usdtToken;  // Add usdtToken here
let userAddress = null;
let poolsInfo = [];
let userStakes = [];
let selectedPoolId = 0;

const LOCK_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds

// Helper Functions
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    notification.className = `fixed bottom-4 right-4 max-w-md ${isError ? 'bg-red-600' : 'bg-green-600'} text-white px-6 py-3 rounded-lg shadow-lg`;
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 3000);
}

function formatAmount(amount, decimals = 18) {
    if (typeof amount === 'string') {
        return amount;
    }
    return ethers.utils.formatUnits(amount, decimals);
}

// Pool Card Template
async function createPoolCard(pool, index) {
    if (!pool || !CONFIG.pepeStaking.pools[index]) return '';

    // Get current lock period from contract
    const lockPeriod = await stakingContract.LOCK_PERIOD();
    
    // Cari stake yang aktif di pool ini
    const activeStake = userStakes.find(stake => 
        Number(stake.poolId) === index && 
        !stake.hasClaimedReward
    );
    
    const poolConfig = CONFIG.pepeStaking.pools[index];
    const totalStaked = formatAmount(pool.totalStaked);

    return `
        <div class="pool-card rounded-xl p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-bold text-white">${poolConfig.name}</h3>
                    <p class="text-[#B4B4B4] text-sm">Lock Period: ${formatLockPeriod()}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-[#00FFA3]">${poolConfig.reward} USDT</p>
                    <p class="text-[#B4B4B4] text-sm">Fixed Reward</p>
                </div>
            </div>
            
            <div class="space-y-3 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-[#B4B4B4]">Required Stake:</span>
                    <span class="font-medium text-white">${poolConfig.minPepe} PEPE</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-[#B4B4B4]">Total Staked:</span>
                    <span class="font-medium text-white">${Number(totalStaked).toLocaleString()} PEPE</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-[#B4B4B4]">Slots:</span>
                    <span class="font-medium text-white">${pool.currentHolders}/${pool.maxHolders}</span>
                </div>
                ${activeStake ? generateActiveStakeInfo(activeStake, lockPeriod) : ''}
            </div>

            <div class="space-y-2">
                ${activeStake ? 
                    generateUnstakeButton(index, activeStake, lockPeriod) : 
                    generateStakeButton(poolConfig.minPepe, index)}
            </div>
        </div>
    `;
}

// Add helper function untuk generate active stake info
function generateActiveStakeInfo(stake, lockPeriod) {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(stake.startTime) + Number(lockPeriod);
    const timeLeft = endTime - now;
    const status = timeLeft <= 0 ? '🟢 READY' : '🟡 LOCKED';
    const statusColor = timeLeft <= 0 ? 'text-[#00FFA3]' : 'text-yellow-500';

    return `
        <div class="border-t border-gray-700 pt-3 mt-3">
            <div class="flex justify-between text-sm">
                <span class="text-[#B4B4B4]">Your Stake:</span>
                <span class="font-medium text-white">${Number(formatAmount(stake.amount)).toLocaleString()} PEPE</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-[#B4B4B4]">Time Left:</span>
                <span class="font-medium">${timeLeft > 0 ? timeLeft + " seconds" : "COMPLETED"}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-[#B4B4B4]">Status:</span>
                <span class="font-medium ${statusColor}">${status}</span>
            </div>
        </div>
    `;
}

// Modifikasi fungsi generateUnstakeButton untuk menampilkan opsi early unstake
function generateUnstakeButton(poolId, stake, lockPeriod) {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(stake.startTime) + Number(lockPeriod);
    const canUnstake = now >= endTime;
    
    return `
        <div class="space-y-2">
            <button onclick="unstakeFromPool(${poolId})" 
                    class="w-full ${canUnstake ? 'border border-[#00FFA3] text-[#00FFA3]' : 'bg-gray-600 text-gray-400'} py-2 rounded-lg font-semibold transition-colors"
                    ${!canUnstake ? 'disabled' : ''}>
                ${canUnstake ? 'Unstake with Reward' : 'Locked'}
            </button>
            ${!canUnstake ? `
                <button onclick="unstakeEarlyFromPool(${poolId})" 
                        class="w-full border border-red-500 text-red-500 py-2 rounded-lg font-semibold hover:bg-red-500 hover:text-white transition-colors">
                    Early Unstake (No Reward)
                </button>
            ` : ''}
        </div>
    `;
}

// Add helper function untuk generate buttons
function generateUnstakeButton(poolId, stake, lockPeriod) {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(stake.startTime) + Number(lockPeriod);
    const canUnstake = now >= endTime;
    
    return `
        <button onclick="unstakeFromPool(${poolId})" 
                class="w-full ${canUnstake ? 'border border-[#00FFA3] text-[#00FFA3]' : 'bg-gray-600 text-gray-400'} py-2 rounded-lg font-semibold transition-colors"
                ${!canUnstake ? 'disabled' : ''}>
            ${canUnstake ? 'Unstake' : 'Locked'}
        </button>
    `;
}

function generateStakeButton(minPepe, poolId) {
    return `
        <button onclick="openStakeModal(${poolId})" 
                class="w-full gradient-button text-black py-2 rounded-lg font-semibold">
            Stake ${minPepe} PEPE
        </button>
    `;
}

// Helper function untuk menghitung sisa waktu
function calculateTimeRemaining(startTime) {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(startTime) + LOCK_PERIOD;
    const remaining = endTime - now;
    return remaining > 0 ? remaining : 0;
}

// Helper function untuk format waktu
function formatTimeRemaining(seconds) {
    if (!seconds) return 'N/A';
    if (seconds <= 0) return 'Completed';
    
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
}

// Modal Functions
function openStakeModal(poolId) {
    selectedPoolId = poolId;
    const poolConfig = CONFIG.pepeStaking.pools[poolId];
    document.getElementById('stakeModal').classList.remove('hidden');
    document.getElementById('minStake').textContent = `${poolConfig.minPepe} PEPE`;
    document.getElementById('poolReward').textContent = `${poolConfig.reward} USDT`;
}

function closeStakeModal() {
    document.getElementById('stakeModal').classList.add('hidden');
}

function closeMetaMaskModal() {
    document.getElementById('metamaskModal').classList.add('hidden');
}

// Pool Actions
async function confirmStake() {
    try {
        console.log('Starting stake process...'); // Debug log
        console.log('Selected pool:', selectedPoolId); // Debug log
                
        const pool = poolsInfo[selectedPoolId];
        const amount = pool.minStakeAmount;
        console.log('Stake amount:', ethers.utils.formatEther(amount)); // Debug log
                
        // Check PEPE balance first
        const balance = await pepeToken.balanceOf(userAddress);
        console.log('Current PEPE balance:', ethers.utils.formatEther(balance)); // Debug log
                
        if (balance.lt(amount)) {
            showNotification('Insufficient PEPE balance', true);
            return;
        }
                
        console.log('Approving PEPE tokens...'); // Debug log
        const approveTx = await pepeToken.approve(CONFIG.pepeStaking.address, amount);
        console.log('Approval tx:', approveTx.hash); // Debug log
        await approveTx.wait();
        console.log('Approval confirmed'); // Debug log
                
        console.log('Staking tokens...'); // Debug log
        const stakeTx = await stakingContract.stake(selectedPoolId, amount);
        console.log('Stake tx:', stakeTx.hash); // Debug log
        await stakeTx.wait();
        console.log('Stake confirmed'); // Debug log
                
        showNotification('Berhasil stake PEPE tokens!');
        closeStakeModal();
        updateUI();
    } catch (error) {
        console.error('Staking error:', error); // Debug log
        showNotification(error.message, true);
    }
}

// Perbaikan fungsi unstake
async function unstakeFromPool(poolId) {
    try {
        console.log('Starting unstake process for pool:', poolId);
        
        if (!stakingContract || !userAddress) {
            showNotification('Please connect your wallet first', true);
            return;
        }

        // Cari stake dengan poolId yang sesuai
        const stakes = await stakingContract.getUserStakes(userAddress);
        let stakeIndex = -1;
        
        for (let i = 0; i < stakes.length; i++) {
            if (Number(stakes[i].poolId) === Number(poolId) && !stakes[i].hasClaimedReward) {
                stakeIndex = i;
                break;
            }
        }
        
        if (stakeIndex === -1) {
            showNotification('No active stake found for this pool', true);
            return;
        }
        
        console.log(`Found stake at index ${stakeIndex}`);
        
        // Eksekusi unstake dengan gas limit yang dioptimasi
        const tx = await stakingContract.unstake(stakeIndex, {
            gasLimit: 300000 // Gunakan gas limit yang lebih kecil tapi cukup
        });
        
        showNotification('Unstaking transaction sent. Please wait...');
        await tx.wait();
        
        showNotification('Successfully unstaked tokens!');
        await updateUI();
    } catch (error) {
        console.error('Error unstaking:', error);
        showNotification(error.message, true);
    }
}

// Perbaikan function unstakeByIndex
async function unstakeByIndex(index) {
    try {
        console.log(`Unstaking by index: ${index}`);
        
        if (!stakingContract || !userAddress) {
            showNotification('Please connect your wallet first', true);
            return;
        }
        
        // Gunakan gas limit yang dioptimasi
        const tx = await stakingContract.unstake(index, {
            gasLimit: 300000 // Cukup untuk proses unstake tapi tidak berlebihan
        });
        
        showNotification('Unstaking transaction sent. Please wait...');
        await tx.wait();
        
        showNotification('Successfully unstaked tokens!');
        await updateUI();
    } catch (error) {
        console.error('Error unstaking:', error);
        showNotification(error.message, true);
    }
}

// Tambahkan fungsi untuk early unstake
async function unstakeEarlyFromPool(poolId) {
    try {
        if (!stakingContract || !userAddress) {
            showNotification('Please connect your wallet first', true);
            return;
        }

        // Konfirmasi kehilangan reward
        if (!confirm('WARNING: You will lose all rewards if you unstake now. Continue?')) {
            return;
        }

        // Cari stake dengan poolId yang sesuai
        const stakes = await stakingContract.getUserStakes(userAddress);
        let stakeIndex = -1;
        
        for (let i = 0; i < stakes.length; i++) {
            if (Number(stakes[i].poolId) === Number(poolId) && !stakes[i].hasClaimedReward) {
                stakeIndex = i;
                break;
            }
        }
        
        if (stakeIndex === -1) {
            showNotification('No active stake found for this pool', true);
            return;
        }
        
        console.log(`Found stake at index ${stakeIndex} for early unstake`);
        
        // Eksekusi unstakeEarly dengan gas limit yang dioptimasi
        const tx = await stakingContract.unstakeEarly(stakeIndex, {
            gasLimit: 300000
        });
        
        showNotification('Early unstaking transaction sent. Please wait...');
        await tx.wait();
        
        showNotification('Successfully unstaked tokens (without reward)');
        await updateUI();
    } catch (error) {
        console.error('Error during early unstake:', error);
        showNotification(error.message, true);
    }
}

// Update UI
async function updateUI() {
    try {
        if (!stakingContract || !userAddress) return;

        // Get fresh data
        const [allStakes, pools, lockPeriod, pepeBalance] = await Promise.all([
            stakingContract.getUserStakes(userAddress),
            stakingContract.getAllPoolsInfo(),
            stakingContract.LOCK_PERIOD(),
            pepeToken.balanceOf(userAddress)
        ]);

        // Calculate total staked amount
        const totalStakedAmount = allStakes.reduce((acc, stake) => 
            !stake.hasClaimedReward ? acc.add(stake.amount) : acc, 
            ethers.BigNumber.from(0)
        );

        // Calculate available (unstaked) balance
        const availableBalance = pepeBalance;

        // Update UI elements with clear labeling
        document.getElementById('pepeBalance').textContent = 
            `${Number(formatAmount(availableBalance)).toLocaleString()} PEPE (Available)`;
        document.getElementById('stakedBalance').textContent = 
            `${Number(formatAmount(totalStakedAmount)).toLocaleString()} PEPE (Staked)`;

        // Add total balance display if needed
        const totalBalance = availableBalance.add(totalStakedAmount);
        if (document.getElementById('totalBalance')) {
            document.getElementById('totalBalance').textContent = 
                `${Number(formatAmount(totalBalance)).toLocaleString()} PEPE (Total)`;
        }

        // Update lock period display
        const minutes = Math.floor(Number(lockPeriod) / 60);
        const stakingPeriodEl = document.getElementById('stakingPeriod');
        if (stakingPeriodEl) {
            stakingPeriodEl.textContent = `${minutes} Minutes (Testing)`;
            stakingPeriodEl.classList.remove('text-gray-500');
            stakingPeriodEl.classList.add('text-[#00FFA3]');
        }

        // Filter stakes dan update pools
        userStakes = allStakes.filter(stake => !stake.hasClaimedReward);
        poolsInfo = pools;

        // Update USDT balance
        const usdtBalance = await usdtToken.balanceOf(userAddress);

        // Update UI elements
        document.getElementById('usdtBalance').textContent = 
            `${Number(formatAmount(usdtBalance)).toLocaleString()} USDT`;

        // Update active stakes info
        await updateActiveStakesInfo();

        // Update pools display
        const poolsContainer = document.getElementById('poolsContainer');
        if (pools && poolsContainer) {
            const poolsHTML = await Promise.all(pools.map(async (pool, index) => {
                return createPoolCard(pool, index);
            }));
            poolsContainer.innerHTML = poolsHTML.join('');
        }
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Add helper function untuk format lock period
function formatLockPeriod() {
    // For testing we show 5 minutes
    return "5 Minutes (Testing)";
}

// Connect Wallet
async function connectWallet() {
    try {
        console.log('Connecting wallet...'); // Debug log
        if (typeof window.ethereum === 'undefined') {
            document.getElementById('metamaskModal').classList.remove('hidden');
            return;
        }

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chainId:', chainId); // Debug log
        if (chainId !== BSC_CONFIG.chainId) {
            console.log('Wrong network, switching to BSC Testnet...'); // Debug log
            document.getElementById('networkModal').classList.remove('hidden');
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        console.log('Connected address:', userAddress); // Debug log

        // Initialize contracts
        pepeToken = new ethers.Contract(
            CONFIG.pepeToken.address,
            CONFIG.pepeToken.abi,
            signer
        );

        stakingContract = new ethers.Contract(
            CONFIG.pepeStaking.address,
            CONFIG.pepeStaking.abi,
            signer
        );

        // Add USDT contract initialization
        usdtToken = new ethers.Contract(
            CONFIG.dummyUSDT.address,
            CONFIG.dummyUSDT.abi,
            signer
        );

        // Check PEPE balance
        const pepeBalance = await pepeToken.balanceOf(userAddress);
        console.log('PEPE balance:', ethers.utils.formatEther(pepeBalance)); // Debug log

        // Update UI
        const connectWalletBtn = document.getElementById('connectWallet');
        connectWalletBtn.innerHTML = `<i class="fas fa-wallet mr-2"></i>${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        connectWalletBtn.classList.remove('bg-white', 'text-green-600');
        connectWalletBtn.classList.add('bg-green-100', 'text-green-800', 'cursor-default');

        await updateUI();
        showNotification('Wallet berhasil terhubung!');
    } catch (error) {
        console.error('Connection error:', error);
        showNotification(error.message, true);
    }
}

// Network Functions
async function switchToBSCTestnet() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_CONFIG.chainId }],
        });
        document.getElementById('networkModal').classList.add('hidden');
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [BSC_CONFIG],
                });
                document.getElementById('networkModal').classList.add('hidden');
            } catch (addError) {
                showNotification('Gagal menambahkan BSC Testnet', true);
            }
        } else {
            showNotification('Gagal mengganti network', true);
        }
    }
}

// Update UI setiap detik untuk timer
function startTimers() {
    setInterval(async () => {
        if (userStakes.length > 0) {
            await updateUI();
        }
        
        // Update lock period separately
        try {
            const lockPeriod = await stakingContract.LOCK_PERIOD();
            const minutes = Math.floor(Number(lockPeriod) / 60);
            const stakingPeriodEl = document.getElementById('stakingPeriod');
            if (stakingPeriodEl) {
                stakingPeriodEl.textContent = `${minutes} Minutes (Testing)`;
            }
        } catch (error) {
            console.error('Error updating lock period:', error);
        }
    }, 10000);
}

// Event Listeners
window.addEventListener('load', () => {
    // Display initial pool cards
    updateUI();
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
    window.ethereum.on('accountsChanged', () => {
        window.location.reload();
    });
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
    startTimers();
});

async function updateActiveStakesInfo() {
    const container = document.getElementById('activeStakesInfo');
    if (!stakingContract || !container) return;

    const stakes = await stakingContract.getUserStakes(userAddress);
    const lockPeriod = await stakingContract.LOCK_PERIOD();
    const activeStakes = stakes.filter(stake => !stake.hasClaimedReward);

    if (activeStakes.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No active stakes</p>';
        return;
    }

    const stakesHTML = await Promise.all(activeStakes.map(async (stake, index) => {
        const now = Math.floor(Date.now() / 1000);
        const endTime = Number(stake.startTime) + Number(lockPeriod);
        const timeLeft = endTime - now;
        const status = timeLeft <= 0 ? '🟢 READY' : '🟡 LOCKED';
        const statusColor = timeLeft <= 0 ? 'text-[#00FFA3]' : 'text-yellow-500';

        return `
            <div class="border-b border-gray-700 last:border-0 pb-2">
                <div class="flex justify-between mb-1">
                    <span class="text-[#B4B4B4]">Pool #${Number(stake.poolId) + 1}</span>
                    <span class="font-medium text-white">${formatAmount(stake.amount)} PEPE</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-[#B4B4B4]">Status:</span>
                    <span class="${statusColor}">${status}</span>
                </div>
                ${timeLeft <= 0 ? `
                <div class="flex justify-end mt-2">
                    <button onclick="unstakeFromPool(${stake.poolId})" 
                        class="w-full mt-2 border border-[#00FFA3] text-[#00FFA3] py-1 rounded text-sm hover:bg-[#00FFA3] hover:text-black transition-colors">
                        Unstake
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }));

    container.innerHTML = stakesHTML.join('');
}

// Emergency recovery function
async function emergencyRecovery() {
    try {
        if (!stakingContract || !userAddress) {
            showNotification('Please connect your wallet first', true);
            return;
        }
        
        console.log('Starting emergency recovery process...');
        showNotification('Emergency recovery initiated');
        
        // Coba gunakan recoverTokens jika user adalah owner
        try {
            const owner = await stakingContract.owner();
            const isOwner = owner.toLowerCase() === userAddress.toLowerCase();
            
            if (isOwner) {
                const stakes = await stakingContract.getUserStakes(userAddress);
                if (stakes.length === 0) {
                    showNotification('No active stakes found', true);
                    return;
                }
                
                // Temukan stake pertama yang belum diklaim
                let activeStake = null;
                for (const stake of stakes) {
                    if (!stake.hasClaimedReward) {
                        activeStake = stake;
                        break;
                    }
                }
                
                if (!activeStake) {
                    showNotification('No unclaimed stakes found', true);
                    return;
                }
                
                // Recover tokens as owner
                const tx = await stakingContract.recoverTokens(
                    CONFIG.pepeToken.address, 
                    activeStake.amount,
                    { gasLimit: 300000 }
                );
                
                await tx.wait();
                showNotification('Emergency recovery successful!');
                await refreshBalances();
                await refreshStakes();
                return;
            }
        } catch (error) {
            console.error('Owner recovery failed:', error);
        }
        
        // Jika bukan owner, coba emergency unstake
        await emergencyUnstake();
        
    } catch (error) {
        console.error('Emergency recovery error:', error);
        showNotification(`Recovery error: ${error.message}`, true);
    }
}

// Tambahkan ke event listeners
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    
    // Tambahkan event listener untuk tombol emergency
    const emergencyButton = document.getElementById('emergency-recovery');
    if (emergencyButton) {
        emergencyButton.addEventListener('click', emergencyRecovery);
    }
    
    // ...existing code...
});