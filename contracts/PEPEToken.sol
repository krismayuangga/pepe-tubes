// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
.______    _______ .______    _______    .___________. __    __  .______    _______     _______.
|   _  \  |   ____||   _  \  |   ____|   |           ||  |  |  | |   _  \  |   ____|   /       |
|  |_)  | |  |__   |  |_)  | |  |__      `---|  |----`|  |  |  | |  |_)  | |  |__     |   (----`
|   ___/  |   __|  |   ___/  |   __|         |  |     |  |  |  | |   _  <  |   __|     \   \    
|  |      |  |____ |  |      |  |____        |  |     |  `--'  | |  |_)  | |  |____.----)   |   
| _|      |_______|| _|      |_______|       |__|      \______/  |______/  |_______|_______/    
*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PEPEToken is ERC20, Ownable {
    // Define max supply constant (100 billion tokens)
    uint256 public constant MAX_SUPPLY = 100_000_000_000 * 10**18;

    constructor() ERC20("PEPE Token", "PEPE") Ownable(msg.sender) {
        // Mint entire supply to deployer
        _mint(msg.sender, MAX_SUPPLY);
    }

    // Instead, we'll explicitly override it to disable minting
    function mint(address, uint256) public pure {
        revert("PEPEToken: minting disabled - fixed supply");
    }
    
    // Allow users to burn their own tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    // Add informational getter to show max supply
    function getMaxSupply() public pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
