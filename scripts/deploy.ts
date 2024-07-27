import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance));

  const DisperseCollect = await ethers.getContractFactory("DisperseCollect");
  const disperseCollect = await DisperseCollect.deploy();

  console.log("Waiting for contract deployment...");
  await disperseCollect.deployed();

  console.log("DisperseCollect deployed to:", disperseCollect.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
