let provider, signer, pepeToken, stakingContract;
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
function createPoolCard(pool, index) {
    const poolConfig = CONFIG.pools[index];
    const totalStaked = pool.totalStaked ? formatAmount(pool.totalStaked) : "0";
    const userStake = userStakes.find(stake => Number(stake.poolId) === index);
    const hasStake = userStake && Number(formatAmount(userStake.amount)) > 0;
    
    // Hitung sisa waktu staking
    const timeRemaining = hasStake ? calculateTimeRemaining(userStake.startTime) : null;
    const canClaim = hasStake && (Date.now() / 1000 >= Number(userStake.startTime) + LOCK_PERIOD);

    return `
        <div class="pool-card rounded-xl p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-bold text-white">${poolConfig.name}</h3>
                    <p class="text-[#B4B4B4] text-sm">Lock Period: 30 days</p>
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
                    <span class="font-medium text-white">${pool.currentHolders || 0}/${poolConfig.maxHolders}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-[#B4B4B4]">Your Stake:</span>
                    <span class="font-medium text-white">${hasStake ? Number(formatAmount(userStake.amount)).toLocaleString() : "0"} PEPE</span>
                </div>
                
                ${hasStake ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-[#B4B4B4]">Time Remaining:</span>
                        <span class="font-medium ${canClaim ? 'text-[#00FFA3]' : ''}">${formatTimeRemaining(timeRemaining)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-[#B4B4B4]">Status:</span>
                        <span class="font-medium ${canClaim ? 'text-[#00FFA3]' : 'text-yellow-600'}">
                            ${canClaim ? 'Ready to Claim' : 'Locked'}
                        </span>
                    </div>
                ` : ''}
            </div>

            <div class="space-y-2">
                ${(!pool.currentHolders || pool.currentHolders < poolConfig.maxHolders) && pool.isActive ? `
                    <button onclick="openStakeModal(${index})" 
                            class="w-full gradient-button text-black py-2 rounded-lg font-semibold">
                        Stake ${poolConfig.minPepe} PEPE
                    </button>
                ` : `
                    <button disabled 
                            class="w-full bg-gray-800 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed">
                        Pool Full
                    </button>
                `}
                
                ${hasStake ? `
                    <button onclick="unstakeFromPool(${index})" 
                            class="w-full border border-[#00FFA3] text-[#00FFA3] py-2 rounded-lg font-semibold hover:bg-[#00FFA3] hover:text-black transition-colors">
                        Unstake ${Number(formatAmount(userStake.amount)).toLocaleString()} PEPE
                    </button>
                ` : ''}
            </div>
        </div>
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
    const poolConfig = CONFIG.pools[poolId];
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

async function unstakeFromPool(poolId) {
    try {
        console.log('Starting unstake process for pool:', poolId);
        console.log('Available stakes:', userStakes);

        // Find stake index (hapus duplikasi)
        const stakeIndex = userStakes.findIndex(stake => Number(stake.poolId) === Number(poolId));
        console.log('Found stake at index:', stakeIndex);

        if (stakeIndex === -1) {
            showNotification('No stake found for this pool', true);
            return;
        }

        // Confirm unstake
        if (!confirm('Are you sure you want to unstake? If it\'s before 30 days, you will not receive rewards.')) {
            return;
        }

        // Execute unstake transaction
        const tx = await stakingContract.unstake(stakeIndex);
        console.log('Unstake transaction sent:', tx.hash);
        
        showNotification('Unstaking in progress...');
        await tx.wait();
        
        showNotification('Successfully unstaked PEPE tokens!');
        await updateUI();
    } catch (error) {
        console.error('Error unstaking:', error);
        showNotification(error.message, true);
    }
}

// Update UI
async function updateUI() {
    try {
        if (stakingContract && userAddress) {
            // Get user stakes
            userStakes = await stakingContract.getUserStakes(userAddress);
            console.log('Current user stakes:', userStakes);

            // Get pools info
            poolsInfo = await stakingContract.getAllPoolsInfo();
            console.log('Pools info:', poolsInfo);
        }

        // Update pools display
        document.getElementById('poolsContainer').innerHTML = CONFIG.pools.map((poolConfig, index) => {
            const pool = poolsInfo[index] || {
                minStakeAmount: "0",
                totalStaked: "0",
                currentHolders: 0,
                isActive: true
            };
            return createPoolCard(pool, index);
        }).join('');

        if (stakingContract) {
            if (userAddress) {
                const pepeBalance = await pepeToken.balanceOf(userAddress);
                document.getElementById('pepeBalance').textContent = 
                    `${Number(formatAmount(pepeBalance)).toLocaleString()} PEPE`;

                // Calculate total staked
                let totalStaked = ethers.BigNumber.from(0);
                for (let i = 0; i < userStakes.length; i++) {
                    totalStaked = totalStaked.add(userStakes[i].amount);
                }
                document.getElementById('totalStaked').textContent = 
                    `${Number(formatAmount(totalStaked)).toLocaleString()} PEPE`;

                // Calculate total rewards
                let totalRewards = ethers.BigNumber.from(0);
                for (let i = 0; i < userStakes.length; i++) {
                    const stake = userStakes[i];
                    const pool = poolsInfo[stake.poolId];
                    if (Date.now() / 1000 >= stake.startTime + LOCK_PERIOD && !stake.hasClaimedReward) {
                        totalRewards = totalRewards.add(pool.rewardPerHolder);
                    }
                }
                document.getElementById('totalRewards').textContent = 
                    `${Number(formatAmount(totalRewards)).toLocaleString()} USDT`;

                // Reset total staked if user has no active stakes
                if (totalStaked.isZero()) {
                    document.getElementById('totalStaked').textContent = "0 PEPE";
                }
            } else {
                // Reset balances if user is not connected
                document.getElementById('totalStaked').textContent = "0 PEPE";
                document.getElementById('pepeBalance').textContent = "0 PEPE";
                document.getElementById('totalRewards').textContent = "0 USDT";
            }

            // Update pools display with contract data
            document.getElementById('poolsContainer').innerHTML = 
                poolsInfo.map((pool, index) => createPoolCard(pool, index)).join('');
        }
    } catch (error) {
        console.error('Error updating UI:', error);
        showNotification('Error updating display', true);
    }
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

        // Check PEPE balance
        const pepeBalance = await pepeToken.balanceOf(userAddress);
        console.log('PEPE balance:', ethers.utils.formatEther(pepeBalance)); // Debug log

        // Update UI
        const connectWalletBtn = document.getElementById('connectWallet');
        connectWalletBtn.innerHTML = `<i class="fas fa-wallet mr-2"></i>${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        connectWalletBtn.classList.remove('bg-white', 'text-green-600');
        connectWalletBtn.classList.add('bg-green-100', 'text-green-800', 'cursor-default');

        await updateUI();
        setInterval(updateUI, 10000);

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
    setInterval(() => {
        if (userStakes.length > 0) {
            updateUI();
        }
    }, 1000);
}

// Event Listeners
window.addEventListener('load', () => {
    // Display initial pool cards
    updateUI();

    // Setup event listeners
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
});