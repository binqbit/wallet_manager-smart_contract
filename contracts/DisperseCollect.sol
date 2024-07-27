// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DisperseCollect is Ownable, ReentrancyGuard {
    event DisperseEther(address indexed from, address[] recipients, uint256[] values);
    event DisperseToken(address indexed from, address token, address[] recipients, uint256[] values);
    event CollectEther(address indexed to, uint256 total);
    event CollectToken(address indexed to, address[] from, address token, uint256 total);

    // Disperse ETH to multiple addresses
    function disperseEther(address[] calldata recipients, uint256[] calldata values) external payable nonReentrant {
        require(recipients.length == values.length, "Arrays must be of equal length");

        uint256 total = 0;
        unchecked {
            for (uint256 i = 0; i < values.length; i++) {
                total += values[i];
            }
        }
        require(msg.value >= total, "Insufficient ETH balance");

        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success, ) = recipients[i].call{value: values[i]}("");
            require(success, "Transfer failed");
        }

        emit DisperseEther(msg.sender, recipients, values);
    }

    // Disperse ETH by percentages
    function disperseEtherByPercent(address[] calldata recipients, uint256[] calldata percentages) external payable nonReentrant {
        require(recipients.length == percentages.length, "Arrays must be of equal length");
        require(msg.value > 0, "No ETH sent");

        uint256 totalPercent = 0;
        unchecked {
            for (uint256 i = 0; i < percentages.length; i++) {
                totalPercent += percentages[i];
            }
        }
        require(totalPercent == 100, "Percentages must add up to 100");

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 value = (msg.value * percentages[i]) / 100;
            (bool success, ) = recipients[i].call{value: value}("");
            require(success, "Transfer failed");
        }

        emit DisperseEther(msg.sender, recipients, percentages);
    }

    // Disperse ERC20 tokens to multiple addresses
    function disperseToken(address token, address[] calldata recipients, uint256[] calldata values) external nonReentrant {
        require(recipients.length == values.length, "Arrays must be of equal length");
        
        IERC20 erc20Token = IERC20(token);
        uint256 total = 0;
        unchecked {
            for (uint256 i = 0; i < values.length; i++) {
                total += values[i];
            }
        }
        require(erc20Token.balanceOf(msg.sender) >= total, "Insufficient token balance");
        require(erc20Token.allowance(msg.sender, address(this)) >= total, "Insufficient allowance");
    
        for (uint256 i = 0; i < recipients.length; i++) {
            require(erc20Token.transferFrom(msg.sender, recipients[i], values[i]), "Transfer failed");
        }

        emit DisperseToken(msg.sender, token, recipients, values);
    }

    // Disperse ERC20 tokens by percentages
    function disperseTokenByPercent(address token, address[] calldata recipients, uint256[] calldata percentages) external nonReentrant {
        require(recipients.length == percentages.length, "Arrays must be of equal length");
        
        IERC20 erc20Token = IERC20(token);
        uint256 total = erc20Token.allowance(msg.sender, address(this));
        require(total > 0, "No allowance");

        uint256 totalPercent = 0;
        unchecked {
            for (uint256 i = 0; i < percentages.length; i++) {
                totalPercent += percentages[i];
            }
        }
        require(totalPercent == 100, "Percentages must add up to 100");

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 value = (total * percentages[i]) / 100;
            require(erc20Token.transferFrom(msg.sender, recipients[i], value), "Transfer failed");
        }

        emit DisperseToken(msg.sender, token, recipients, percentages);
    }
    
    // Collect ETH from sender to one address
    function collectEther(address payable recipient) external payable onlyOwner nonReentrant {
        uint256 totalCollected = msg.value;
        require(totalCollected > 0, "No ETH sent");
        recipient.transfer(totalCollected);
        emit CollectEther(recipient, totalCollected);
    }

    // Collect ERC20 tokens from multiple addresses
    function collectToken(address token, address recipient, address[] calldata contributors, uint256[] calldata values) external onlyOwner nonReentrant {
        require(contributors.length == values.length, "Arrays must be of equal length");
        
        IERC20 erc20Token = IERC20(token);
        uint256 totalCollected = 0;

        for (uint256 i = 0; i < contributors.length; i++) {
            require(erc20Token.allowance(contributors[i], address(this)) >= values[i], "Insufficient allowance from contributor");
            require(erc20Token.balanceOf(contributors[i]) >= values[i], "Insufficient balance of contributor");
            require(erc20Token.transferFrom(contributors[i], address(this), values[i]), "TransferFrom failed");
            totalCollected += values[i];
        }

        require(erc20Token.transfer(recipient, totalCollected), "Transfer failed");

        emit CollectToken(recipient, contributors, token, totalCollected);
    }

    // Allow contract to receive ether
    receive() external payable {}
}
