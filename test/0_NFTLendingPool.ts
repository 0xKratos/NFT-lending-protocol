import { deployments, ethers } from "hardhat";

import { NFTLendingPool } from "./../typechain/contracts/NFTLendingPool";
import { MockERC721 } from "./../typechain/contracts/MockERC721";
import { USDC } from "./../typechain/contracts/USDC";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Signer } from "ethers";
import { USDC__factory } from "../typechain";

describe("NFT lending protocol contract", function () {
  let lendingPool: NFTLendingPool;
  let usdc: USDC;
  let nft: MockERC721;
  let owner:SignerWithAddress, bob, mary: SignerWithAddress;
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
it("should be able to repay loan and have NFT returned", async function () {
  //incomplete, need double check interest rate and proper repayment amount
  await nft.connect(owner).approve(lendingPool.address, 1);
  await lendingPool.connect(owner).borrow(ethers.utils.parseEther("3000"), nft.address,1, ethers.utils.parseEther("10000"));
  await usdc.connect(owner).approve(lendingPool.address, ethers.utils.parseEther("100000000000"));
  console.log((await usdc.balanceOf(owner.address)).toString());
  await lendingPool.connect(owner).repay(0);
  console.log((await usdc.balanceOf(owner.address)).toString());
  expect(await nft.ownerOf(1)).to.equal(owner.address);

});
});
});
