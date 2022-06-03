import { ethers } from "hardhat";

require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }: any) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Config
  console.log(`Deploying MockERC721 Contract... from ${deployer}`);

  let MockERC721 = await deploy("MockERC721", {
    from: deployer,
    args: [],
  });
};

module.exports.tags = ["MockERC721"];
