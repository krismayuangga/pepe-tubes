console.log('Loading BSC Staking App...');

// Contract addresses and ABIs
const CONTRACTS = {
    pepeToken: {
        address: '0xf8FAbd399e2E3B57761929d04d5eEdA13bcA43a5',
        abi: [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ]
    },
    pepeStaking: {
        address: '0x34b520567306EdF17CA642A2A8EB392fC7C7853C',
        abi: [
            "function stake(uint256 amount)",
            "function unstake()",
            "function claimReward()",
            "function calculateReward(address) view returns (uint256)",
            "function stakes(address) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime)",
            "function totalStaked() view returns (uint256)",
            "function rewardToken() view returns (address)",
            "function rewardRate() view returns (uint256)"
        ]
    }
};

// BSC Testnet Configuration
const BSC_CONFIG = {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: {
        name: 'tBNB',
        symbol: 'tBNB',
        decimals: 18
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
};

let provider, signer, pepeToken, stakingContract, rewardToken;
let userAddress = null;

// UI Elements
const connectWalletBtn = document.getElementById('connectWallet');
const stakeAmountInput = document.getElementById('stakeAmount');
const stakeButton = document.getElementById('stakeButton');
const unstakeButton = document.getElementById('unstakeButton');
const claimButton = document.getElementById('claimButton');
const pepeBalanceEl = document.getElementById('pepeBalance');
const stakedBalanceEl = document.getElementById('stakedBalance');
const usdtBalanceEl = document.getElementById('usdtBalance');
const rewardAmountEl = document.getElementById('rewardAmount');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const metamaskModal = document.getElementById('metamaskModal');
const networkModal = document.getElementById('networkModal');

console.log('UI Elements initialized');

// Helper Functions
function showNotification(message, isError = false) {
    console.log('Showing notification:', message, isError);
    notification.className = `fixed bottom-4 right-4 ${isError ? 'bg-red-600' : 'bg-green-600'} text-white px-6 py-3 rounded-lg shadow-lg`;
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function formatAmount(amount, decimals = 18) {
    return ethers.utils.formatUnits(amount, decimals);
}

// Switch to BSC Testnet
async function switchToBSCTestnet() {
    console.log('Switching to BSC Testnet...');
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_CONFIG.chainId }],
        });
        networkModal.classList.add('hidden');
    } catch (switchError) {
        console.error('Error switching network:', switchError);
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [BSC_CONFIG],
                });
                networkModal.classList.add('hidden');
            } catch (addError) {
                console.error('Error adding network:', addError);
                showNotification('Failed to add BSC Testnet network', true);
            }
        } else {
            showNotification('Failed to switch network', true);
        }
    }
}

// Connect Wallet
async function connectWallet() {
    console.log('Connecting wallet...');
    try {
        if (typeof window.ethereum === 'undefined') {
            console.log('MetaMask not found, showing modal');
            metamaskModal.classList.remove('hidden');
            metamaskModal.querySelector('.bg-white').classList.add('scale-100', 'opacity-100');
            metamaskModal.querySelector('.bg-white').classList.remove('scale-95', 'opacity-0');
            return;
        }

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chainId:', chainId);
        if (chainId !== BSC_CONFIG.chainId) {
            console.log('Wrong network, showing modal');
            networkModal.classList.remove('hidden');
            networkModal.querySelector('.bg-white').classList.add('scale-100', 'opacity-100');
            networkModal.querySelector('.bg-white').classList.remove('scale-95', 'opacity-0');
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        console.log('Connected wallet address:', userAddress);

        // Initialize contracts
        pepeToken = new ethers.Contract(
            CONTRACTS.pepeToken.address,
            CONTRACTS.pepeToken.abi,
            signer
        );

        stakingContract = new ethers.Contract(
            CONTRACTS.pepeStaking.address,
            CONTRACTS.pepeStaking.abi,
            signer
        );

        // Get reward token address
        const rewardTokenAddress = await stakingContract.rewardToken();
        console.log('Reward token address:', rewardTokenAddress);
        rewardToken = new ethers.Contract(
            rewardTokenAddress,
            CONTRACTS.pepeToken.abi,
            signer
        );

        // Update UI
        connectWalletBtn.innerHTML = `<i class="fas fa-wallet mr-2"></i>${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        connectWalletBtn.classList.remove('bg-white', 'text-yellow-600', 'hover:bg-yellow-50');
        connectWalletBtn.classList.add('bg-yellow-100', 'text-yellow-800', 'cursor-default');

        // Enable buttons
        stakeButton.disabled = false;
        unstakeButton.disabled = false;
        claimButton.disabled = false;

        // Update balances
        await updateBalances();
        setInterval(updateRewards, 10000);

        showNotification('Wallet connected successfully!');
    } catch (error) {
        console.error('Connection error:', error);
        showNotification(error.message || 'Failed to connect wallet', true);
    }
}

// Update Balances
async function updateBalances() {
    console.log('Updating balances...');
    try {
        if (!userAddress || !pepeToken || !stakingContract || !rewardToken) return;

        const [pepeBalance, stake, rewardTokenBalance, decimals] = await Promise.all([
            pepeToken.balanceOf(userAddress),
            stakingContract.stakes(userAddress),
            rewardToken.balanceOf(userAddress),
            pepeToken.decimals()
        ]);

        console.log('Balances:', {
            pepe: formatAmount(pepeBalance, decimals),
            staked: formatAmount(stake.amount, decimals),
            usdt: formatAmount(rewardTokenBalance, 18)
        });

        pepeBalanceEl.textContent = `${Number(formatAmount(pepeBalance, decimals)).toLocaleString()} PEPE`;
        stakedBalanceEl.textContent = `${Number(formatAmount(stake.amount, decimals)).toLocaleString()} PEPE`;
        usdtBalanceEl.textContent = `${Number(formatAmount(rewardTokenBalance, 18)).toLocaleString()} USDT`;

    } catch (error) {
        console.error('Error updating balances:', error);
        showNotification('Error updating balances', true);
    }
}

// Update Rewards
async function updateRewards() {
    console.log('Updating rewards...');
    try {
        if (!userAddress || !stakingContract) return;

        const reward = await stakingContract.calculateReward(userAddress);
        console.log('Current reward:', formatAmount(reward));
        rewardAmountEl.textContent = `${Number(formatAmount(reward)).toLocaleString()} USDT`;

    } catch (error) {
        console.error('Error updating rewards:', error);
    }
}

// Stake Tokens
async function stakeTokens() {
    console.log('Staking tokens...');
    try {
        const amount = ethers.utils.parseEther(stakeAmountInput.value);
        console.log('Stake amount:', formatAmount(amount));
        
        console.log('Approving tokens...');
        const approveTx = await pepeToken.approve(CONTRACTS.pepeStaking.address, amount);
        await approveTx.wait();
        
        console.log('Staking tokens...');
        const stakeTx = await stakingContract.stake(amount);
        await stakeTx.wait();
        
        showNotification('Tokens staked successfully!');
        stakeAmountInput.value = '';
        updateBalances();
    } catch (error) {
        console.error('Error staking tokens:', error);
        showNotification(error.message, true);
    }
}

// Unstake Tokens
async function unstakeTokens() {
    console.log('Unstaking tokens...');
    try {
        const tx = await stakingContract.unstake();
        await tx.wait();
        
        showNotification('Tokens unstaked successfully!');
        updateBalances();
    } catch (error) {
        console.error('Error unstaking tokens:', error);
        showNotification(error.message, true);
    }
}

// Claim Rewards
async function claimRewards() {
    console.log('Claiming rewards...');
    try {
        const tx = await stakingContract.claimReward();
        await tx.wait();
        
        showNotification('Rewards claimed successfully!');
        updateBalances();
    } catch (error) {
        console.error('Error claiming rewards:', error);
        showNotification(error.message, true);
    }
}

// Event Listeners
window.addEventListener('load', () => {
    console.log('Page loaded, setting up event listeners');
    connectWalletBtn.addEventListener('click', connectWallet);
    stakeButton.addEventListener('click', stakeTokens);
    unstakeButton.addEventListener('click', unstakeTokens);
    claimButton.addEventListener('click', claimRewards);

    // Add event listener for Get MetaMask button
    document.querySelector('#metamaskModal a').addEventListener('click', () => {
        console.log('Opening MetaMask website');
    });

    // Add event listener for network switch button
    document.querySelector('#networkModal button').addEventListener('click', switchToBSCTestnet);

    if (window.ethereum && window.ethereum.selectedAddress) {
        console.log('Wallet already connected, reconnecting...');
        connectWallet();
    }
});
