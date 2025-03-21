// Variables
let provider, signer, stakingContract, pepeToken, usdtToken;
let userAddress = null;

// Helper Functions
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    notification.className = `fixed bottom-4 right-4 max-w-md ${isError ? 'bg-red-600' : 'bg-green-600'} text-white px-6 py-3 rounded-lg shadow-lg`;
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 5000);
}

function formatAmount(amount, decimals = 18) {
    if (!amount) return '0';
    if (typeof amount === 'string') return amount;
    return ethers.utils.formatUnits(amount, decimals);
}

// Main Functions
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showNotification('MetaMask is required for this application', true);
            return;
        }
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Initialize contracts
        stakingContract = new ethers.Contract(
            CONFIG.pepeStaking.address,
            CONFIG.pepeStaking.abi,
            signer
        );
        
        pepeToken = new ethers.Contract(
            CONFIG.pepeToken.address,
            CONFIG.pepeToken.abi,
            signer
        );
        
        usdtToken = new ethers.Contract(
            CONFIG.dummyUSDT.address,
            CONFIG.dummyUSDT.abi,
            signer
        );
        
        // Check if connected wallet is owner
        const owner = await stakingContract.owner();
        if (owner.toLowerCase() !== userAddress.toLowerCase()) {
            showNotification('You are not the contract owner', true);
            document.getElementById('connectWallet').innerHTML = 
              `<i class="fas fa-exclamation-triangle mr-2"></i>Not Admin`;
            return;
        }
        
        // Update UI
        document.getElementById('connectWallet').innerHTML = 
          `<i class="fas fa-check-circle mr-2"></i>${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        
        await updateContractInfo();
        showNotification('Connected as contract owner');
    } catch (error) {
        console.error('Connection error:', error);
        showNotification(error.message, true);
    }
}

async function updateContractInfo() {
    try {
        document.getElementById('contractAddress').textContent = CONFIG.pepeStaking.address;
        
        const owner = await stakingContract.owner();
        document.getElementById('contractOwner').textContent = owner;
        
        const [pepeBalance, usdtBalance] = await Promise.all([
            pepeToken.balanceOf(CONFIG.pepeStaking.address),
            usdtToken.balanceOf(CONFIG.pepeStaking.address)
        ]);
        
        document.getElementById('contractPepeBalance').textContent = 
            `${Number(formatAmount(pepeBalance)).toLocaleString()} PEPE`;
            
        document.getElementById('contractUsdtBalance').textContent = 
            `${Number(formatAmount(usdtBalance)).toLocaleString()} USDT`;
    } catch (error) {
        console.error('Error updating contract info:', error);
    }
}

async function recoverTokens() {
    try {
        const address = document.getElementById('userAddress').value;
        const tokenType = document.getElementById('tokenType').value;
        const amount = document.getElementById('recoverAmount').value;
        
        if (!ethers.utils.isAddress(address)) {
            showNotification('Invalid address format', true);
            return;
        }
        
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            showNotification('Please enter a valid amount', true);
            return;
        }
        
        const tokenAddress = tokenType === 'pepe' ? 
            CONFIG.pepeToken.address : CONFIG.dummyUSDT.address;
        
        const tokenAmount = ethers.utils.parseEther(amount);
        
        // Execute recovery
        const tx = await stakingContract.recoverTokens(tokenAddress, tokenAmount);
        showNotification('Recovery transaction sent...');
        
        await tx.wait();
        showNotification('Tokens successfully recovered!');
        
        await updateContractInfo();
    } catch (error) {
        console.error('Recovery error:', error);
        showNotification(error.message, true);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('recoverButton').addEventListener('click', recoverTokens);
    document.getElementById('checkStakesButton').addEventListener('click', checkUserStakes);

    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});

async function checkUserStakes() {
    try {
        const address = document.getElementById('checkAddress').value;
        
        if (!ethers.utils.isAddress(address)) {
            showNotification('Invalid address format', true);
            return;
        }
        
        const stakes = await stakingContract.getUserStakes(address);
        const stakesInfoEl = document.getElementById('stakesInfo');
        
        if (stakes.length === 0) {
            stakesInfoEl.innerHTML = `<p class="text-center text-gray-500">No stakes found for this address</p>`;
            return;
        }
        
        const lockPeriod = await stakingContract.LOCK_PERIOD();
        const now = Math.floor(Date.now() / 1000);
        
        let html = '';
        for (let i = 0; i < stakes.length; i++) {
            const stake = stakes[i];
            const endTime = Number(stake.startTime) + Number(lockPeriod);
            const isUnlocked = now >= endTime;
            const timeLeft = endTime - now;
            
            html += `
                <div class="border-b border-gray-200 pb-3 last:border-0">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Stake #${i}</span>
                        <span class="text-xs px-2 py-1 rounded-full ${isUnlocked ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                    </div>
                    <div class="mt-1 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Pool ID:</span>
                            <span>${Number(stake.poolId) + 1}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Amount:</span>
                            <span>${formatAmount(stake.amount)} PEPE</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Claimed:</span>
                            <span>${stake.hasClaimedReward ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Start Time:</span>
                            <span>${new Date(Number(stake.startTime) * 1000).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        stakesInfoEl.innerHTML = html;
    } catch (error) {
        console.error('Error checking stakes:', error);
        showNotification(error.message, true);
    }
}
