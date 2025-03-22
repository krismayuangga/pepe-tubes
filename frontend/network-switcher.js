// Network switcher functionality for PEPE Staking dApp
let currentNetwork = 'testnet'; // Default to testnet initially

// Store network configuration objects
const networks = {
    mainnet: {
        configUrl: 'mainnet-config.js',
        name: 'BSC Mainnet',
        chainId: '0x38',
        cssClass: 'mainnet',
        label: 'MAINNET'
    },
    testnet: {
        configUrl: 'bsc-config.js',
        name: 'BSC Testnet',
        chainId: '0x61',
        cssClass: 'testnet',
        label: 'TESTNET'
    }
};

// Function to switch networks
async function switchNetwork(networkName) {
    if (!networks[networkName]) return false;
    
    try {
        // Update UI
        const networkLabel = document.getElementById('networkLabel');
        if (networkLabel) {
            networkLabel.textContent = networks[networkName].label;
            networkLabel.className = `text-xs font-bold ml-2 network-badge ${networks[networkName].cssClass}`;
        }
        
        // Store current network selection
        localStorage.setItem('pepeStakingNetwork', networkName);
        currentNetwork = networkName;
        
        // Add/remove network-specific classes from body
        document.body.classList.remove('network-testnet', 'network-mainnet');
        document.body.classList.add(`network-${networkName}`);
        
        // Update network name display
        const networkName_el = document.getElementById('networkName');
        if (networkName_el) {
            networkName_el.textContent = networks[networkName].name;
        }
        
        // Reload configuration
        await loadNetworkConfig(networkName);
        
        // Reinitialize contracts with new config
        if (typeof window.initializeContracts === 'function') {
            await window.initializeContracts();
        } else if (typeof window.connectWallet === 'function' && window.ethereum && window.ethereum.selectedAddress) {
            // Re-connect wallet to refresh with new network config
            await window.connectWallet();
        }
        
        return true;
    } catch (error) {
        console.error('Network switch error:', error);
        return false;
    }
}

// Load network configuration dynamically
async function loadNetworkConfig(networkName) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = networks[networkName].configUrl + '?v=' + new Date().getTime(); // Cache busting
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load network config'));
        document.head.appendChild(script);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load network preference from localStorage
    const savedNetwork = localStorage.getItem('pepeStakingNetwork') || 'testnet';
    
    // Initialize network switcher UI
    const networkSwitch = document.getElementById('networkSwitch');
    if (networkSwitch) {
        // Set initial state based on saved preference
        networkSwitch.checked = savedNetwork === 'mainnet';
        
        // Add event listener
        networkSwitch.addEventListener('change', async () => {
            const newNetwork = networkSwitch.checked ? 'mainnet' : 'testnet';
            await switchNetwork(newNetwork);
            
            // Also switch the actual blockchain network in wallet if connected
            if (window.ethereum && window.ethereum.selectedAddress) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: networks[newNetwork].chainId }]
                    });
                } catch (error) {
                    console.error('Failed to switch chain in wallet:', error);
                    // Try to add the chain if it doesn't exist
                    if (error.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: networks[newNetwork].chainId,
                                    chainName: networks[newNetwork].name,
                                    rpcUrls: [newNetwork === 'mainnet' ? 
                                        'https://bsc-dataseed.binance.org/' : 
                                        'https://data-seed-prebsc-1-s1.binance.org:8545/'
                                    ],
                                    nativeCurrency: {
                                        name: 'BNB',
                                        symbol: 'BNB',
                                        decimals: 18
                                    },
                                    blockExplorerUrls: [newNetwork === 'mainnet' ? 
                                        'https://bscscan.com' : 
                                        'https://testnet.bscscan.com'
                                    ]
                                }]
                            });
                        } catch (addError) {
                            console.error('Error adding chain:', addError);
                        }
                    }
                }
            }
        });
    }
    
    // Initialize with saved network
    await switchNetwork(savedNetwork);
});
