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
        console.log('Connecting wallet...'); // Debug log
        if (typeof window.ethereum === 'undefined') {
            showNotification('MetaMask is required', true);
            return;
        }

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chainId:', chainId); // Debug log
        
        if (chainId !== BSC_CONFIG.chainId) {
            showNotification('Please switch to BSC Testnet', true);
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        console.log('Connected address:', userAddress); // Debug log

        // Initialize contracts dengan ABI yang lengkap
        stakingContract = new ethers.Contract(
            CONFIG.pepeStaking.address,
            [
                ...CONFIG.pepeStaking.abi,
                "function owner() view returns (address)",
                "function isAdmin(address) view returns (bool)"
            ],
            signer
        );

        // Check if connected wallet is admin or owner
        const [isAdmin, owner] = await Promise.all([
            stakingContract.isAdmin(userAddress),
            stakingContract.owner()
        ]);

        console.log('Is admin:', isAdmin); // Debug log
        console.log('Owner address:', owner); // Debug log
        console.log('User address:', userAddress); // Debug log

        if (!isAdmin && owner.toLowerCase() !== userAddress.toLowerCase()) {
            showNotification('Access denied: Not an admin or owner', true);
            return;
        }

        // Update UI jika adalah admin
        connectWalletBtn.innerHTML = `<i class="fas fa-wallet mr-2"></i>${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        connectWalletBtn.classList.remove('bg-white', 'text-green-600');
        connectWalletBtn.classList.add('bg-green-100', 'text-green-800', 'cursor-default');

        // Initialize UI
        await updateUI();
        showNotification('Admin connected successfully!');

        // Start auto-refresh after successful connection
        await updateUI();
        startAutoRefresh();
        setInterval(updateActiveStakes, 10000); // Update stakes every 10 seconds
    } catch (error) {
        console.error('Connection error:', error);
        console.log('Error details:', error); // Debug log
        showNotification(error.message, true);
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
        console.log('Starting rewards distribution...');
        
        // Add gas estimation with buffer
        const gasEstimate = await stakingContract.estimateGas.distributeRewards()
            .catch(error => {
                console.error('Gas estimation failed:', error);
                throw new Error('No rewards to distribute or insufficient USDT balance');
            });

        const tx = await stakingContract.distributeRewards({
            gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        });
        
        console.log('Transaction hash:', tx.hash);
        showNotification('Processing reward distribution...');
        
        await tx.wait();
        console.log('Rewards distributed successfully');
        
        showNotification('Rewards distributed successfully!');
        await updateUI();
    } catch (error) {
        console.error('Error distributing rewards:', error);
        showNotification(error.message || 'Failed to distribute rewards', true);
    }
}

// Update UI
async function updateUI() {
    try {
        await getContractData();
        updateActiveStakes();
        updateContractBalance();
    } catch (error) {
        console.error('Error updating UI:', error);
        showNotification('Error updating display', true);
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

        // Get pools info
        const pools = await stakingContract.getAllPoolsInfo();
        poolsInfo = pools;

        // Get all user stakes
        const allStakes = [];
        
        // Get user stakes directly
        const stakes = await stakingContract.getUserStakes(userAddress);
        for (let i = 0; i < stakes.length; i++) {
            if (stakes[i].amount.gt(0)) {
                allStakes.push({
                    user: userAddress,
                    amount: stakes[i].amount,
                    startTime: Number(stakes[i].startTime),
                    poolId: Number(stakes[i].poolId),
                    hasClaimedReward: stakes[i].hasClaimedReward
                });
            }
        }

        // Update UI with stakes data
        const html = allStakes.length > 0 ? allStakes.map(stake => {
            const timeLeft = calculateTimeRemaining(stake.startTime);
            const status = timeLeft.remaining <= 0 ? 'Ready' : 'Locked';
            const statusColor = timeLeft.remaining <= 0 ? 'text-green-600' : 'text-yellow-600';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">Pool #${Number(stake.poolId) + 1}</td>
                    <td class="px-4 py-3 font-mono text-sm">${stake.user.slice(0, 8)}...${stake.user.slice(-6)}</td>
                    <td class="px-4 py-3">${formatAmount(stake.amount)} PEPE</td>
                    <td class="px-4 py-3">${timeLeft.text}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs ${statusColor} bg-opacity-10 ${status === 'Ready' ? 'bg-green-100' : 'bg-yellow-100'}">
                            ${status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No active stakes</td></tr>';
        
        container.innerHTML = html;
        userStakes = allStakes;

    } catch (error) {
        console.error('Error updating active stakes:', error);
        container.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">Error loading stakes</td></tr>';
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
    // Initial load
    getContractData();
    
    // Refresh every 30 seconds
    setInterval(getContractData, 30000);
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