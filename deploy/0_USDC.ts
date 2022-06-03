import { ethers } from "hardhat";

require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }: any) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Config
  console.log(`Deploying USDC Contract... from ${deployer}`);

  let USDC = await deploy("USDC", {
    from: deployer,
    args: [],
  });
};

module.exports.tags = ["USDC"];
