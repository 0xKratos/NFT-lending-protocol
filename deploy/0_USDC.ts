import { ethers } from "hardhat";

require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }: any) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Config
  console.log(`Deploying NFTLendingPool Contract... from ${deployer}`);

  let NFTLendingPool = await deploy("NFTLendingPool", {
    from: deployer,
    args: [],
  });
};

module.exports.tags = ["NFTLendingPool"];
