// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title USDC
 * @dev Mock USDC.
 */
contract USDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
