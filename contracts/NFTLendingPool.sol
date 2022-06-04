// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./interface/INFTLendingPool.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTLendingPool is INFTLendingPool, ERC721Holder, ReentrancyGuard, Ownable

{
    using SafeERC20 for IERC20;
    // Variables

    uint256 public interestRateMolecular;
    uint256 public interestRateDenominator;
    IERC20 public USDC;
    uint256 public maxLoanMolecular = 7;
    uint256 public maxLoanDenominator = 10;
    uint256 public loanPeriod = 1 days;
    mapping(uint256 => Loan) public loans;
    uint256 public loanCounter = 0;

    // Events
    event Borrow(address indexed borrower, uint256 indexed loanId, uint256 amountBorrowed, uint256 startTime, uint256 endTime);
    event Repay(address indexed borrower, uint256 indexed loanId, uint256 amountRepaid);
    event Liquidate(address indexed liquidator, address indexed liquidatee, uint256 amountPaid, address collateralCollectionAddress, uint256 collateralTokenId);


    constructor(address _usdc, uint256 _interestRateMolecular, uint256 _interestRateDenominator){
        interestRateMolecular = _interestRateMolecular;
        interestRateDenominator = _interestRateDenominator;
        USDC = IERC20(_usdc);
    }

    // Admin functions

    function setMaxLoan(uint256 _maxLoanMolecular, uint256 _maxLoanDenominator) external onlyOwner{
        maxLoanMolecular = _maxLoanMolecular;
        maxLoanDenominator = _maxLoanDenominator;
    }
    function setInterestRate(uint256 _interestRateMolecular, uint256 _interestRateDenominator) external onlyOwner{
        interestRateMolecular = _interestRateMolecular;
        interestRateDenominator = _interestRateDenominator;
    }

    function setLoanPeriod(uint256 _loanPeriod) external onlyOwner{
        loanPeriod = _loanPeriod;
    }

    // Core Functions
    function borrow(uint256 _amount, IERC721 _collectionAddress, uint256 _id, uint256 _price) external {
        _addCollateral(_collectionAddress, _id);
        require(_amount * maxLoanDenominator <= _price  * maxLoanMolecular, "NFTLendingPool: Principal must be less than maximum loan amount.");
        USDC.safeTransfer(msg.sender,_amount);
        loans[loanCounter] = Loan(msg.sender, address(_collectionAddress), _id, _price, _amount, block.timestamp, block.timestamp+loanPeriod);
        loanCounter++;
        emit Borrow(msg.sender, _id, _amount, block.timestamp, block.timestamp+loanPeriod);

    }
    function repay(uint256 _loanId) external {
        Loan memory loan = loans[_loanId];
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
    function _calculatePayment(Loan memory loan) private view returns (uint256){
        uint256 timePassed = _calculateTimePassed(loan.startTime);
        uint256 interest = (loan.principal * interestRateMolecular * timePassed) / (365 days * interestRateDenominator);
        return loan.principal + interest;
    }

    function _calculateTimePassed(uint256 startTime) private view returns(uint256){
        return block.timestamp - startTime;
    }


}