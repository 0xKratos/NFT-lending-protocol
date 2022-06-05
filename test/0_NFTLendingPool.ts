import { deployments, ethers, network } from "hardhat";

import { NFTLendingPool } from "./../typechain/contracts/NFTLendingPool";
import { MockERC721 } from "./../typechain/contracts/MockERC721";
import { USDC } from "./../typechain/contracts/USDC";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";

async function getCurrentBlockTimestamp(): Promise<BigNumber> {
  let currentBlockNumber = await ethers.provider.getBlockNumber();
  return BigNumber.from(
    (await ethers.provider.getBlock(currentBlockNumber)).timestamp
  );
}

async function skipTo(startTime: BigNumber, days: Number): Promise<any> {
  await network.provider.send("evm_setNextBlockTimestamp", [
    startTime.add(BigNumber.from(+days*86400)).add(1).toNumber(),
  ]);
  await network.provider.send("evm_mine");
  console.log(`🕓 | Skipped ${days} days`);
}

describe("NFT lending protocol contract", function () {
  let lendingPool: NFTLendingPool;
  let usdc: USDC;
  let nft: MockERC721;
  let owner:SignerWithAddress, bob: SignerWithAddress, mary: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    await deployments.fixture([
      "MockERC721",
      "USDC",
      "NFTLendingPool"
    ]);
    // Get the ContractFactory and Signers here.
    [owner, bob, mary, ...addrs] = await ethers.getSigners();
    lendingPool = await ethers.getContract("NFTLendingPool", owner);
    usdc = await ethers.getContract("USDC", owner);
    nft = await ethers.getContract("MockERC721", owner);
    await usdc.mint(owner.address, ethers.utils.parseEther("10000000"));
    await usdc.mint(bob.address, ethers.utils.parseEther("10000000"));
    await usdc.mint(mary.address, ethers.utils.parseEther("10000000"));
    await usdc.mint(lendingPool.address, ethers.utils.parseEther("10000000000"));
    await nft.mint(owner.address,1);
    await nft.mint(bob.address,2);
  });


  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      expect(await lendingPool.owner()).to.equal(owner.address);
    });

  });

  describe("Borrower", function () {
    it("should borrow sufficient amount and successfully deposit NFT", async function () {
      await nft.connect(owner).approve(lendingPool.address, 1);
      await lendingPool.connect(owner).borrow(ethers.utils.parseEther("3000"), nft.address,1, ethers.utils.parseEther("10000"));
      expect(await usdc.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("10000000").add(ethers.utils.parseEther("3000")));
      expect(await nft.ownerOf(1)).to.equal(lendingPool.address);
  
  });
    it("should not be able to borrow more than 70% of NFT price", async function () {
    await nft.connect(owner).approve(lendingPool.address, 1);
    await expect(lendingPool.connect(owner).borrow(ethers.utils.parseEther("8000"), nft.address,1, ethers.utils.parseEther("10000"))).to.be.revertedWith("NFTLendingPool: Principal must be less than maximum loan amount.");
  
  });
    it("should be able to repay loan with correct amount of interest and have NFT returned", async function () {
  
      await nft.connect(owner).approve(lendingPool.address, 1);
      let currentTime = await getCurrentBlockTimestamp();
 
      await network.provider.send("evm_setNextBlockTimestamp", [currentTime.toNumber()+1]);
      await network.provider.send("evm_mine");
      await lendingPool.connect(owner).borrow(ethers.utils.parseEther("3000"), nft.address,1, ethers.utils.parseEther("10000"));
      await usdc.connect(owner).approve(lendingPool.address, ethers.utils.parseEther("100000000000"));
      console.log((await lendingPool.loans(0)).startTime.toString());
      let beforeBalance = await usdc.balanceOf(owner.address);
      await skipTo(currentTime, 0.3)
      currentTime = await getCurrentBlockTimestamp();
      console.log("After skip: ",currentTime.toNumber());
   
      let timePassed = currentTime.add(1).sub( (await lendingPool.loans(0)).startTime);
      console.log("Time passed: ",timePassed.toString());
      let interest = (((await lendingPool.loans(0)).principal).mul(1).mul(timePassed)).div(31536000*10);
    
      await lendingPool.connect(owner).repay(0);
      let afterBalance = await usdc.balanceOf(owner.address);
      console.log("Principal: ",(await lendingPool.loans(0)).principal.toString());
      console.log("Amount repaid: ",beforeBalance.sub(afterBalance).toString());
      console.log("Interest calculated: ",interest.toString());
      let actualInterest = beforeBalance.sub(afterBalance).sub((await lendingPool.loans(0)).principal);
      console.log("Actual interest: ",actualInterest.toString());
      expect(interest).to.equal(actualInterest);
      expect(await nft.ownerOf(1)).to.equal(owner.address);

  });
});

describe("Liquidator", function () {
  it("should be able to liquidate a loan after deadline has passed and receive NFT", async function () {
    await nft.connect(owner).approve(lendingPool.address, 1);
    await lendingPool.connect(owner).borrow(ethers.utils.parseEther("3000"), nft.address,1, ethers.utils.parseEther("10000"));
    await skipTo(await getCurrentBlockTimestamp(), 1);
    await usdc.connect(bob).approve(lendingPool.address, ethers.utils.parseEther("100000000"));
    await lendingPool.connect(bob).liquidate(0);
    expect(await nft.ownerOf(1)).to.equal(bob.address);

});
it("should not be able to liquidate a loan if deadline is not passed", async function () {
  await nft.connect(owner).approve(lendingPool.address, 1);
  await lendingPool.connect(owner).borrow(ethers.utils.parseEther("3000"), nft.address,1, ethers.utils.parseEther("10000"));
  await skipTo(await getCurrentBlockTimestamp(), 0.5);
  await usdc.connect(bob).approve(lendingPool.address, ethers.utils.parseEther("100000000"));
  await expect(lendingPool.connect(bob).liquidate(0)).to.be.revertedWith("NFTLendingPool: Loan cannot be liquidated.");

});

});
});
