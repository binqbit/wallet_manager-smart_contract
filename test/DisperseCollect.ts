import { expect } from "chai";
import { ethers } from "hardhat";
import { Wallet, Signer } from "ethers";
import { DisperseCollect, MockERC20 } from "../typechain-types/contracts";

describe("DisperseCollect Contract", function () {
  let owner: Signer;
  let recipient1: Wallet, recipient2: Wallet, recipient3: Wallet;
  let disperseCollect: DisperseCollect, mockERC20: MockERC20;
  let recipient1Address: string, recipient2Address: string, recipient3Address: string;

  // Constants for frequently used values
  const ETH_UNIT = ethers.utils.parseEther("0.00000001");
  const TOKEN_UNIT = ethers.utils.parseUnits("1", 18);
  const TOTAL_TOKEN_UNITS = ethers.utils.parseUnits("5", 18);

  before(async () => {
    // Get owner and create random wallets for testing
    [owner] = await ethers.getSigners();
    recipient1 = Wallet.createRandom().connect(ethers.provider);
    recipient2 = Wallet.createRandom().connect(ethers.provider);
    recipient3 = Wallet.createRandom().connect(ethers.provider);

    // Generate wallet addresses
    recipient1Address = await recipient1.getAddress();
    recipient2Address = await recipient2.getAddress();
    recipient3Address = await recipient3.getAddress();

    // Deploy DisperseCollect contract
    const DisperseCollect = await ethers.getContractFactory("DisperseCollect");
    disperseCollect = await DisperseCollect.deploy();
    await disperseCollect.deployed();

    // Deploy MockERC20 contract
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();
  });

  it("Should disperse ETH to multiple addresses", async () => {
    const recipients = [recipient1Address, recipient2Address];
    const values = [ETH_UNIT, ETH_UNIT];

    const initialRecipient1Balance = await ethers.provider.getBalance(recipient1Address);
    const initialRecipient2Balance = await ethers.provider.getBalance(recipient2Address);

    // Disperse ETH to multiple addresses
    await disperseCollect.disperseEther(recipients, values, { value: ETH_UNIT.mul(2) });

    const finalRecipient1Balance = await ethers.provider.getBalance(recipient1Address);
    const finalRecipient2Balance = await ethers.provider.getBalance(recipient2Address);

    // Check if the balance of the recipients increased by the expected amount
    expect(finalRecipient1Balance).to.be.equal(initialRecipient1Balance.add(ETH_UNIT));
    expect(finalRecipient2Balance).to.be.equal(initialRecipient2Balance.add(ETH_UNIT));
  });

  it("Should disperse ETH by percentages", async () => {
    const recipients = [recipient1Address, recipient2Address];
    const percentages = [25, 75];

    const initialRecipient1Balance = await ethers.provider.getBalance(recipient1Address);
    const initialRecipient2Balance = await ethers.provider.getBalance(recipient2Address);

    // Disperse ETH to multiple addresses by percentages
    await disperseCollect.disperseEtherByPercent(recipients, percentages, { value: ETH_UNIT.mul(2) });

    const finalRecipient1Balance = await ethers.provider.getBalance(recipient1Address);
    const finalRecipient2Balance = await ethers.provider.getBalance(recipient2Address);

    // Check if the balance of the recipients increased by the expected amount
    expect(finalRecipient1Balance).to.be.equal(initialRecipient1Balance.add(ETH_UNIT.div(2)));
    expect(finalRecipient2Balance).to.be.equal(initialRecipient2Balance.add(ETH_UNIT.add(ETH_UNIT.div(2))));
  });

  it("Should disperse ERC20 tokens to multiple addresses", async () => {
    const recipients = [recipient1Address, recipient2Address];
    const values = [TOKEN_UNIT, TOKEN_UNIT.mul(2)];

    const initialRecipient1TokenBalance = await mockERC20.balanceOf(recipient1Address);
    const initialRecipient2TokenBalance = await mockERC20.balanceOf(recipient2Address);

    // Mint and approve tokens for the DisperseCollect contract
    await mockERC20.mint(await owner.getAddress(), TOKEN_UNIT.mul(3));
    await mockERC20.approve(disperseCollect.address, TOKEN_UNIT.mul(3));
    
    // Disperse ERC20 tokens to multiple addresses
    await disperseCollect.disperseToken(mockERC20.address, recipients, values);

    const finalRecipient1TokenBalance = await mockERC20.balanceOf(recipient1Address);
    const finalRecipient2TokenBalance = await mockERC20.balanceOf(recipient2Address);

    // Check if the token balance of the recipients increased by the expected amount
    expect(finalRecipient1TokenBalance).to.be.equal(initialRecipient1TokenBalance.add(TOKEN_UNIT));
    expect(finalRecipient2TokenBalance).to.be.equal(initialRecipient2TokenBalance.add(TOKEN_UNIT.mul(2)));
  });

  it("Should disperse ERC20 tokens by percentages", async () => {
    const recipients = [recipient1Address, recipient2Address];
    const percentages = [40, 60];

    const initialRecipient1TokenBalance = await mockERC20.balanceOf(recipient1Address);
    const initialRecipient2TokenBalance = await mockERC20.balanceOf(recipient2Address);

    // Mint and approve tokens for the DisperseCollect contract
    await mockERC20.mint(await owner.getAddress(), TOTAL_TOKEN_UNITS);
    await mockERC20.approve(disperseCollect.address, TOTAL_TOKEN_UNITS);
    
    // Disperse ERC20 tokens to multiple addresses by percentages
    await disperseCollect.disperseTokenByPercent(mockERC20.address, recipients, percentages);

    const finalRecipient1TokenBalance = await mockERC20.balanceOf(recipient1Address);
    const finalRecipient2TokenBalance = await mockERC20.balanceOf(recipient2Address);

    // Check if the token balance of the recipients increased by the expected amount
    expect(finalRecipient1TokenBalance).to.be.equal(initialRecipient1TokenBalance.add(TOKEN_UNIT.mul(2))); // 40% of 5
    expect(finalRecipient2TokenBalance).to.be.equal(initialRecipient2TokenBalance.add(TOKEN_UNIT.mul(3))); // 60% of 5
  });

  it("Should collect ETH from the sender to a recipient", async () => {
    const initialRecipient1Balance = await ethers.provider.getBalance(recipient1Address);

    // Collect ETH from the contract to the recipient address
    await disperseCollect.collectEther(recipient1Address, { value: ETH_UNIT });

    const finalRecipient1Balance = await ethers.provider.getBalance(recipient1Address);

    // Check if the balance of the recipient increased by the expected amount
    expect(finalRecipient1Balance).to.be.equal(initialRecipient1Balance.add(ETH_UNIT));
  });

  it("Should collect ERC20 tokens from multiple addresses to a recipient", async () => {
    const contributors = [recipient1Address, recipient2Address];
    const values = [TOKEN_UNIT, TOKEN_UNIT];
    
    // Send funds to recipients' addresses for testing
    await owner.sendTransaction({ to: recipient1Address, value: ethers.utils.parseEther("0.001") });
    await owner.sendTransaction({ to: recipient2Address, value: ethers.utils.parseEther("0.001") });

    const initialRecipient1TokenBalance = await mockERC20.balanceOf(recipient1Address);
    const initialRecipient2TokenBalance = await mockERC20.balanceOf(recipient2Address);
    const initialRecipient3TokenBalance = await mockERC20.balanceOf(recipient3Address);

    // Approve tokens for collection by DisperseCollect contract
    await mockERC20.connect(recipient1).approve(disperseCollect.address, TOKEN_UNIT);
    await mockERC20.connect(recipient2).approve(disperseCollect.address, TOKEN_UNIT);
    await disperseCollect.collectToken(mockERC20.address, recipient3Address, contributors, values);

    const finalRecipient1TokenBalance = await mockERC20.balanceOf(recipient1Address);
    const finalRecipient2TokenBalance = await mockERC20.balanceOf(recipient2Address);
    const finalRecipient3TokenBalance = await mockERC20.balanceOf(recipient3Address);

    // Check if the token balance of the contributors decreased by the expected amount, and the collector's balance increased
    expect(finalRecipient1TokenBalance).to.be.equal(initialRecipient1TokenBalance.sub(TOKEN_UNIT));
    expect(finalRecipient2TokenBalance).to.be.equal(initialRecipient2TokenBalance.sub(TOKEN_UNIT));
    expect(finalRecipient3TokenBalance).to.be.equal(initialRecipient3TokenBalance.add(TOKEN_UNIT.mul(2)));
  });
});
