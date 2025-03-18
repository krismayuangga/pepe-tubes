let provider, signer, pepeToken, stakingContract;
let userAddress = null;
let poolsInfo = [];
let userStakes = [];
let selectedPoolId = 0;

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
    const userStake = userStakes[index]?.amount ? formatAmount(userStakes[index].amount) : "0";
    
    return `
        <div class="pool-card bg-white rounded-xl shadow-lg p-6 border-2 ${pool.isActive ? 'border-green-200' : 'border-gray-200'}">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-bold">${poolConfig.name}</h3>
                    <p class="text-gray-600 text-sm">Lock 30 hari</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-green-600">${poolConfig.reward} USDT</p>
                    <p class="text-gray-600 text-sm">Reward per holder</p>
                </div>
            </div>
            
            <div class="space-y-3 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Min/Max Stake:</span>
                    <span class="font-medium">${poolConfig.minPepe} PEPE</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Staked:</span>
                    <span class="font-medium">${Number(totalStaked).toLocaleString()} PEPE</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Holders:</span>
                    <span class="font-medium">${pool.currentHolders || 0}/${poolConfig.maxHolders}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Your Stake:</span>
                    <span class="font-medium">${Number(userStake).toLocaleString()} PEPE</span>
                </div>
            </div>

            <div class="space-y-2">
                ${(!pool.currentHolders || pool.currentHolders < poolConfig.maxHolders) ? `
                    <button onclick="openStakeModal(${index})" 
                            class="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                        Stake PEPE
                    </button>
                ` : `
                    <button disabled 
                            class="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold cursor-not-allowed">
                        Pool Penuh
                    </button>
                `}
                ${userStakes[index]?.amount > 0 ? `
                    <button onclick="unstakeFromPool(${index})" 
                            class="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                        Unstake
                    </button>
                ` : ''}
            </div>
        </div>
    `;
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
        const pool = poolsInfo[selectedPoolId];
        
        // Approve dulu
        const approveTx = await pepeToken.approve(CONFIG.pepeStaking.address, pool.minStakeAmount);
        await approveTx.wait();
        
        // Lakukan stake
        const stakeTx = await stakingContract.stake(selectedPoolId);
        await stakeTx.wait();
        
        showNotification('Berhasil stake PEPE tokens!');
        closeStakeModal();
        updateUI();
    } catch (error) {
        console.error('Error staking:', error);
        showNotification(error.message, true);
    }
}

async function unstakeFromPool(poolId) {
    try {
        const tx = await stakingContract.unstake(poolId);
        await tx.wait();
        showNotification('Berhasil unstake PEPE tokens!');
        updateUI();
    } catch (error) {
        console.error('Error unstaking:', error);
        showNotification(error.message, true);
    }
}

// Update UI
async function updateUI() {
    try {
        // Update pools display
        document.getElementById('poolsContainer').innerHTML = 
            CONFIG.pools.map((poolConfig, index) => {
                const pool = poolsInfo[index] || {
                    minStakeAmount: "0",
                    totalStaked: "0",
                    currentHolders: 0,
                    isActive: true
                };
                return createPoolCard(pool, index);
            }).join('');

        if (stakingContract) {
            // Get pools info if connected
            poolsInfo = await stakingContract.getAllPoolsInfo();
            if (userAddress) {
                userStakes = await stakingContract.getUserStakes(userAddress);
                
                // Update balances
                const pepeBalance = await pepeToken.balanceOf(userAddress);
                document.getElementById('pepeBalance').textContent = 
                    `${Number(formatAmount(pepeBalance)).toLocaleString()} PEPE`;

                // Calculate total staked
                let totalStaked = ethers.BigNumber.from(0);
                for (let i = 0; i < poolsInfo.length; i++) {
                    if (userStakes[i]?.amount) {
                        totalStaked = totalStaked.add(userStakes[i].amount);
                    }
                }
                document.getElementById('totalStaked').textContent = 
                    `${Number(formatAmount(totalStaked)).toLocaleString()} PEPE`;
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
        if (typeof window.ethereum === 'undefined') {
            document.getElementById('metamaskModal').classList.remove('hidden');
            return;
        }

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_CONFIG.chainId) {
            document.getElementById('networkModal').classList.remove('hidden');
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

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

// Event Listeners
window.addEventListener('load', () => {
    // Display initial pool cards
    updateUI();
    
    // Setup event listeners
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});

// Handle account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => {
        window.location.reload();
    });

    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}
