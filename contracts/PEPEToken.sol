// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
/$$$$$$$  /$$$$$$$$ /$$$$$$$  /$$$$$$$$       /$$$$$$$$ /$$   /$$ /$$$$$$$  /$$$$$$$$  /$$$$$$ 
| $$__  $$| $$_____/| $$__  $$| $$_____/      |__  $$__/| $$  | $$| $$__  $$| $$_____/ /$$__  $$
| $$  \ $$| $$      | $$  \ $$| $$               | $$   | $$  | $$| $$  \ $$| $$      | $$  \__/
| $$$$$$$/| $$$$$   | $$$$$$$/| $$$$$            | $$   | $$  | $$| $$$$$$$ | $$$$$   |  $$$$$$ 
| $$____/ | $$__/   | $$____/ | $$__/            | $$   | $$  | $$| $$__  $$| $$__/    \____  $$
| $$      | $$      | $$      | $$               | $$   | $$  | $$| $$  \ $$| $$       /$$  \ $$
| $$      | $$$$$$$$| $$      | $$$$$$$$         | $$   |  $$$$$$/| $$$$$$$/| $$$$$$$$|  $$$$$$/
|__/      |________/|__/      |________/         |__/    \______/ |_______/ |________/ \______/
*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PEPEToken is ERC20, Ownable {
    constructor() ERC20("PEPE Token", "PEPE") Ownable(msg.sender) {
        _mint(msg.sender, 100_000_000_000 * 10 ** decimals()); // 100 Billion PEPE
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
