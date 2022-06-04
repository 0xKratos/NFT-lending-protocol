//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    constructor() ERC721("Mock", "Mock") {}
    function mint(address _to, uint256 _tokenId) public {
        _mint(_to, _tokenId);
    }
}
