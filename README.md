# lending-protocol
Sample generic lending protocol

Considerations
1. Can the user deposit collateral without taking a loan to earn interest (like in money markets)? Assumption: Users can only deposit collateral when borrowing.
Assumption: Price of NFT remains constant during the period of time it is deposited.
2. Usually there are lenders who earn % interest rate, borrowers will pay the % interest rate to these lenders, and the lending protocol profits from the gap and the interest rate model is carefully built out mathematically. 
Assumption: protocol has sufficient USDC to loan and there are only two actors: Liquidator and Borrower
3. If the borrower fails to repay the loan by the deadline, allow any user to liquidate the collateral
by making a payment equal to the principal + the interest. Does that mean if borrowed amount(loan principal) is only 10% of NFT’s price and interest is not that high, user can liquidate for way cheaper than the NFT price? 
Assumption: Yes, users can liquidate for way cheaper than NFT price if borrower does not manage to pay back the loan before the deadline.

Documentation

struct Loan {
        address borrower; //address of borrower
        address collateralCollectionAddress; //address of NFT deployed contract
        uint256 collateralTokenId; //token id of specific NFT
        uint256 collateralPrice; //price of NFT at the time of depositing
        uint256 principal; //amount borrowed
        uint256 startTime; //time in which loan is created
        uint256 endTime; //time which loan needs to be repaid by
    }
This is a Loan structure to detail the essential information required to the protocol to process Loans.

uint256 public interestRateMolecular;
uint256 public interestRateDenominator;
These are used for interest rate calculation, they can be initialised through the constructor.

IERC20 public USDC;
Address of the USDC token, wrapped in IERC20.

uint256 public maxLoanMolecular = 7;
uint256 public maxLoanDenominator = 10;
These are used for maximum borrowable amount calculation, they are initialised to 70%, but can be modified through an admin function.

uint256 public loanPeriod = 1 days;
Amount of time before loan has to be repaid. It is initialised to 24 hours but can be modified through an admin function.

mapping(uint256 => Loan) public loans;
This is a mapping of loanId to a specific loan.

uint256 public loanCounter = 0;
This is a counter for loans. It will increment every single time a loan is taken and used as a simple way to acquire loanIds for this simple protocol.

event Borrow(address indexed borrower, uint256 indexed loanId, uint256 amountBorrowed, uint256 startTime, uint256 endTime);
event Repay(address indexed borrower, uint256 indexed loanId, uint256 amountRepaid);
event Liquidate(address indexed liquidator, address indexed liquidatee, uint256 amountPaid, address collateralCollectionAddress, uint256 collateralTokenId);
The events are emitted appropriately according to what function is called.

constructor(address _usdc, uint256 _interestRateMolecular, uint256 _interestRateDenominator)
Constructor of NFTLendingPool contract. On deployment, the address of USDC (or any other token that we want to use as borrowed principal) must be initialised along with an initial interest rate. 1 for molecular and 10 for denominator means 1/10, 10% interest rate.

function setMaxLoan(uint256 _maxLoanMolecular, uint256 _maxLoanDenominator) external onlyOwner
 
function setInterestRate(uint256 _interestRateMolecular, uint256 _interestRateDenominator) external onlyOwner
 
function setLoanPeriod(uint256 _loanPeriod) external onlyOwner
These are all admin functions to set parameters. Can only be called by owner. (Can be upgraded to have different roles through AccessControl.sol and also in production admin functions require a TimeLock to mitigate centralisation concerns.)

function borrow(uint256 _amount, IERC721 _collectionAddress, uint256 _id, uint256 _price) external nonReentrant
This function is used to deposit an ERC721 collateral and borrow an amount up to 70% of the current price of the NFT.

function liquidate(uint256 _loanId) external nonReentrant
This function is used by any other user to liquidate the NFT collateral of a certain loan if the deadline is already up and the borrower has not repaid the loan.

function repay(uint256 _loanId) external nonReentrant
This function is used by the borrower to repay the debt that is owed to the contract.

 function canLiquidate(uint256 _loanId) public view returns (bool)
This function checks whether the loan can be liquidated (whether the block timestamp has passed the endTime)

function _addCollateral(IERC721 _collectionAddress, uint256 _id) private
function _removeCollateral(IERC721 _collectionAddress, uint256 _id) private
These functions are to add and remove the NFT collateral respectively. They transfer the collateral to and from the contract. Assuming NFTLendingPool will not be inherited, private is used instead of internal to optimise gas.

function _calculatePayment(Loan memory loan) private view returns (uint256)
This function calculates a payment for a loan based on interest rate over time. The set interest rate in the constructor is per year, hence the interest rate for the loan will be pro rated over how long a borrower takes to repay, or how long after the loan deadline that a liquidator tries to liquidate the asset.

function _calculateTimePassed(uint256 startTime) private view returns(uint256)
This function calculates time passed since a given startTime.


Test Cases

Test cases are thought out based on the actor framework. We think of all possible use cases of each actor, and then write test cases based on that.

A simple lending protocol will have the below actors with their possible interactions.:

Borrower:
Deposit NFT
Borrow USDC up to 70% of nft price
Repay loan
Withdraw NFT

Lender: (Not applicable to this assignment)
Deposit USDC to earn interest
Claim usdc + interest (in USDC) *not separate

Liquidator:
Pay principal + interest in USDC
Receive NFT after step 1


Since in the assumptions I have excluded the lender actor out of this assignment, the test cases are written based on the Borrower and Liquidator actors.


Borrower:
Should be able to borrow a specified amount of USDC and successfully deposit NFT collateral.
Should not be able to borrow more than 70% of NFT’s current price.
Should be able to repay loan with the correct amount of interest and have NFT returned.

Liquidator:
Should be able to liquidate a loan after deadline has passed and receive NFT.
Should not be able to liquidate a loan if deadline is not passed.

These test cases test all functions sufficiently.

