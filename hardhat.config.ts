import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import fs from "fs";

const PRIVATE_ADDRESS: string = `0x${process.env.PRIVATE_ADDRESS}`;
const ALCHEMY_APIKEY = process.env.ALCHEMY_APIKEY;

task("export-abi", "Export the ABI of the contract")
  .setAction(async ({}, { ethers }) => {
    const DisperseCollectABI = JSON.stringify(JSON.parse(fs.readFileSync("./artifacts/contracts/DisperseCollect.sol/DisperseCollect.json", "utf8")).abi, null, 2);
    const MockERC20ABI = JSON.stringify(JSON.parse(fs.readFileSync("./artifacts/contracts/MockERC20.sol/MockERC20.json", "utf8")).abi, null, 2);

    fs.writeFileSync("../wallet_manager-backend/config/abi/disperse_collect.json", DisperseCollectABI);
    fs.writeFileSync("../wallet_manager-backend/config/abi/erc20.json", MockERC20ABI);

    console.log("ABI exported to ../wallet_manager-backend/config/abi/");
});

task("deploy", "Deploy the contract")
  .setAction(async ({}, { ethers }) => {
    const [ deployer ] = await ethers.getSigners();

    console.log("Owner address:", deployer.address);

    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance));

    const DisperseCollect = await ethers.getContractFactory("DisperseCollect");
    const disperseCollect = await DisperseCollect.deploy();

    console.log("Waiting for contract deployment...");
    await disperseCollect.deployed();

    console.log("DisperseCollect deployed to:", disperseCollect.address);
});

task("mock-erc20", "Deploy the MockERC20 contract")
  .setAction(async ({}, { ethers }) => {
    const [ deployer ] = await ethers.getSigners();

    console.log("Owner address:", deployer.address);

    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance));

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();

    console.log("Waiting for contract deployment...");
    await mockERC20.deployed();

    console.log("MockERC20 deployed to:", mockERC20.address);
    
});

task("mint-erc20", "Mint ERC20 tokens")
  .addPositionalParam("address", "The address of the ERC20 contract")
  .addPositionalParam("to", "The address to mint tokens to")
  .addPositionalParam("amount", "The amount of tokens to mint")
  .setAction(async ({ address, to, amount }, { ethers }) => {
    const [ deployer ] = await ethers.getSigners();

    console.log("Owner address:", deployer.address);

    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance));

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = MockERC20.attach(address);

    console.log("Minting tokens...");
    const amountTokens = ethers.utils.parseEther(amount);
    await mockERC20.mint(to, amountTokens);

    console.log(`Minted ${amount} tokens to ${to}`);

    const balanceOf = await mockERC20.balanceOf(to);
    console.log(`Balance of ${to}: ${balanceOf}`);
});

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: [PRIVATE_ADDRESS],
    },
    binanceSmartChain: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: [PRIVATE_ADDRESS],
    },
    testnetBinanceSmartChain: {
      url: "https://data-seed-prebsc-1-s3.binance.org:8545/",
      chainId: 97,
      accounts: [PRIVATE_ADDRESS],
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_APIKEY}`,
      accounts: [PRIVATE_ADDRESS],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_APIKEY}`,
      accounts: [PRIVATE_ADDRESS],
    },
    baseTestnet: {
      url: `https://goerli.base.org:8545`,
      accounts: [PRIVATE_ADDRESS],
    },
  },
  etherscan: {
    apiKey: ALCHEMY_APIKEY,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};

export default {
  ...config,
  abiExporter: {
    path: "./ABI/",
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [],
    spacing: 2,
    pretty: false,
  },
  gasReporter: {
    enabled: true,
    gasPrice: 2,
  },
};
