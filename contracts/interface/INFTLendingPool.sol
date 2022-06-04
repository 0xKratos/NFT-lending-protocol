// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
interface INFTLendingPool {

    struct Loan {
        address borrower;
        address collateralCollectionAddress;
        uint256 collateralTokenId;
        uint256 collateralPrice;
        uint256 principal;
        uint256 startTime;
        uint256 endTime;
    }
    function borrow(uint256 _amount, IERC721 _collectionAddress, uint256 _id, uint256 _price) external;
    function repay(uint256 _loanId) external;
    function liquidate(uint256 _loanId) external;
    function canLiquidate(uint256 _loanId) external view returns (bool);

}
