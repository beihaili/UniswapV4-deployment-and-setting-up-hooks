import { ethers } from "hardhat";

// 连接到本地Hardhat网络
let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// 使用您提供的私钥创建钱包
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

async function isdepolyed(address: string) {
    let code = await provider.getCode(address);
    if (code !== "0x") {
        console.log("The contract has been deployed.");
    } else {
        console.log("The contract has not been deployed.");
    }
}


async function main() {
  const initialSupply = 10000;
  
  const Token0 = await ethers.getContractFactory("Token0", wallet);
  const Token1 = await ethers.getContractFactory("Token1", wallet);
  
  const token = await Token0.deploy();
  await token.deployed();
  
  const totalSupply = await token.totalSupply()
  console.log(`Token0 deployed to ${token.address} with an initialSupply ${totalSupply}`); 

  const token1 = await Token1.deploy();
  await token1.deployed();
  
  const totalSupply1 = await token1.totalSupply()
  console.log(`Token1 deployed to ${token1.address} with an initialSupply ${totalSupply1}`);

  await isdepolyed(token.address);
  await isdepolyed(token1.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
