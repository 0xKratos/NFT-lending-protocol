import { ethers } from "hardhat";

require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }: any) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Config
  console.log(`Deploying NFTLendingPool Contract... from ${deployer}`);
  let usdc = await ethers.getContract("USDC", deployer);

  let NFTLendingPool = await deploy("NFTLendingPool", {
    from: deployer,
    args: [usdc.address, 1, 10],
  });

  
};

module.exports.tags = ["NFTLendingPool"];
