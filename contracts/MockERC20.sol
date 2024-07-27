// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20, Ownable {
    constructor() ERC20("Mock ERC-20", "MT") {
        _mint(msg.sender, 1000000 * 10 ** uint256(decimals()));
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
