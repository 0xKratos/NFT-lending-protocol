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
  console.log(`Deployed MockERC721 at ${MockERC721.address}`);
};
  

module.exports.tags = ["MockERC721"];
