// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./interface/INFTLendingPool.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTLendingPool is INFTLendingPool, ERC721Holder, ReentrancyGuard, Ownable

{
    // Variables
    struct Loan {
        address borrower;
        address collateralCollectionAddress;
        uint256 collateralTokenId;
        uint256 collateralPrice;
        uint256 principal;
        uint256 startTime;
        uint256 endTime;
    }



    uint256 public interestRateMolecular;
    uint256 public interestRateDenominator;
    IERC20 public USDC;
    uint256 public maxLoanMolecular = 7;
    uint256 public maxLoanDenominator = 10;
    uint256 public loanPeriod = 1 days;


    mapping(uint256 => Loan) public loans;
    uint256 public loanCounter = 0;
    event Borrow(address indexed borrower, uint256 indexed loanId, uint256 amountBorrowed, uint256 startTime, uint256 endTime);
    event Repay();
    event Liquidate();

    // Functions
    constructor(address _usdc, uint256 _interestRateMolecular, uint256 _interestRateDenominator){
        interestRateMolecular = _interestRateMolecular;
        interestRateDenominator = _interestRateDenominator;
        USDC = IERC20(_usdc);
    }
    
    function borrow(uint256 _amount, IERC721 _collectionAddress, uint256 _id, uint256 _price) external {
        _addCollateral(_collectionAddress, _id);
        require(_amount * maxLoanDenominator <= _price  * maxLoanMolecular, "NFTLendingPool: Principal must be less than maximum loan amount");
        USDC.safeTransfer(msg.sender,_amount);
        loans[loanCounter] = Loan(msg.sender, _collectionAddress, _id, _price, _amount, block.timestamp, block.timestamp+loanPeriod);
        loanCounter++;
        emit Borrow(msg.sender, _id, _amount, block.timestamp, block.timestamp+loanPeriod);

    }
    function repay(uint256 _loanId) external {
        Loans memory loan = loans[loanId];
        require(loan.borrower == msg.sender, "NFTLendingPool: Only borrower can repay loan!");
        uint256 repaymentAmount = _calculatePayment(loan);
        USDC.safeTransferFrom(msg.sender,address(this),repaymentAmount);
        _removeCollateral(IERC721(loan.collateralCollectionAddress), loan.collateralTokenId);
        emit Repay(msg.sender, _loanId, repaymentAmount);
    }
    function liquidate(uint256 _loanId) external {
        require(canLiquidate(_loanId), "NFTLendingPool: Loan cannot be liquidated.");
        Loan memory loan = loans[_loanId];
        uint256 payment = _calculatePayment(loan);
        USDC.safeTransferFrom(msg.sender,address(this),payment);
        _removeCollateral(IERC721(loan.collateralCollectionAddress), loan.collateralTokenId);
        emit Liquidate(msg.sender, loan.borrower, payment, loan.collateralCollectionAddress, loan.collateralTokenId);
    }
    function canLiquidate(uint256 _loanId) public view returns (bool) {
        Loan memory loan = loans[_loanId];
        return block.timestamp >= loan.endTime;
    }
    function _addCollateral(IERC721 _collectionAddress, uint256 _id) private {
        _collectionAddress.safeTransferFrom(msg.sender,address(this),_id);
    }
    function _removeCollateral(IERC721 _collectionAddress, uint256 _id) private{
        _collectionAddress.safeTransferFrom(address(this),msg.sender,_id);
    }
    function _calculateRepayment(Loan loan) private returns (uint256);

    function _calculateTimePassed(uint256 startTime) private returns(uint256);


}