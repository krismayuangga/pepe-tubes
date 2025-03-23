// Network Switcher Logic
class NetworkSwitcher {
    constructor() {
        this.currentNetwork = 'testnet'; // Default ke testnet
        this.initialized = false;
        
        // Network configurations
        this.networks = {
            testnet: {
                config: BSC_CONFIG,
                contracts: CONFIG
            },
            mainnet: {
                config: MAINNET_CONFIG,
                contracts: MAINNET_CONTRACTS
            }
        };
        
        // Initialize network dari localStorage jika tersedia
        this.initFromStorage();
    }
    
    initFromStorage() {
        const savedNetwork = localStorage.getItem('pepe_network');
        if (savedNetwork && this.networks[savedNetwork]) {
            this.currentNetwork = savedNetwork;
            console.log(`Loaded network from storage: ${this.currentNetwork}`);
        }
    }
    
    // Get active network configuration
    getCurrentNetwork() {
        return this.currentNetwork;
    }
    
    // Get network config object
    getNetworkConfig() {
        return this.networks[this.currentNetwork].config;
    }
    
    // Get contracts config object
    getContractsConfig() {
        return this.networks[this.currentNetwork].contracts;
    }
    
    // Switch between networks
    async switchNetwork(networkName) {
        if (!this.networks[networkName]) {
            console.error(`Network ${networkName} not found`);
            return false;
        }
        
        // Store in localStorage
        localStorage.setItem('pepe_network', networkName);
        this.currentNetwork = networkName;
        
        // Reset contract states and connections
        if (window.provider) {
            try {
                // Attempt to switch network in MetaMask
                const targetConfig = this.getNetworkConfig();
                await this.switchChainInMetaMask(targetConfig);
            } catch (error) {
                console.error("Error switching chain in MetaMask:", error);
            }
        }
        
        // Refresh page to reinitialize everything with new network
        window.location.reload();
        return true;
    }
    
    // Helper to switch chain in MetaMask
    async switchChainInMetaMask(networkConfig) {
        try {
            if (!window.ethereum) return false;
            
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }],
            });
            return true;
        } catch (switchError) {
            // Error code indicates that chain belum ditambahkan ke MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: networkConfig.chainId,
                                chainName: networkConfig.chainName,
                                nativeCurrency: networkConfig.nativeCurrency,
                                rpcUrls: networkConfig.rpcUrls,
                                blockExplorerUrls: networkConfig.blockExplorerUrls
                            }
                        ],
                    });
                    return true;
                } catch (addError) {
                    console.error("Error adding network to MetaMask:", addError);
                    return false;
                }
            }
            console.error("Error switching network:", switchError);
            return false;
        }
    }
    
    // Update UI elements to reflect current network
    updateNetworkUI() {
        const networkBadge = document.getElementById('network-badge');
        const networkSelector = document.getElementById('network-selector');
        
        if (networkBadge) {
            // Update badge color and text
            if (this.currentNetwork === 'mainnet') {
                networkBadge.textContent = 'MAINNET';
                networkBadge.className = 'px-2 py-1 bg-green-600 text-white text-xs rounded-full';
            } else {
                networkBadge.textContent = 'TESTNET';
                networkBadge.className = 'px-2 py-1 bg-yellow-500 text-white text-xs rounded-full';
            }
        }
        
        if (networkSelector) {
            networkSelector.value = this.currentNetwork;
        }
    }
}

// Initialize network switcher
const networkSwitcher = new NetworkSwitcher();

// Handle network switch from UI
function handleNetworkSwitch(event) {
    const newNetwork = event.target.value;
    console.log(`Switching to ${newNetwork}...`);
    
    // Show confirmation dialog
    if (confirm(`Are you sure you want to switch to ${newNetwork.toUpperCase()}? This will reload the page.`)) {
        networkSwitcher.switchNetwork(newNetwork);
    } else {
        // Reset selector to current network
        event.target.value = networkSwitcher.getCurrentNetwork();
    }
}

// Document ready handler
document.addEventListener('DOMContentLoaded', function() {
    // Update UI when DOM is ready
    networkSwitcher.updateNetworkUI();
    
    // Add event listener to network selector if it exists
    const networkSelector = document.getElementById('network-selector');
    if (networkSelector) {
        networkSelector.addEventListener('change', handleNetworkSwitch);
    }
});