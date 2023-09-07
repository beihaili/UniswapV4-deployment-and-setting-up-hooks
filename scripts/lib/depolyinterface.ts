import { ethers } from "hardhat";

// 连接到本地Hardhat网络
let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// 使用您提供的私钥创建钱包
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

async function isdepolyed(address: string) {
    let code = await provider.getCode(address);
    if (code !== "0x") {
        console.log("The contract has not been deployed.");
    } else {
        console.log("The contract has been deployed.");
    }
}

async function main() {
    const Factory = await ethers.getContractFactory("MyLiquidityProvider", wallet);


    // PoolManager 的地址，你需要替换为实际的地址
    const poolManagerAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";

    const contract = await Factory.deploy(poolManagerAddress);
    await contract.deployed();
    console.log("Contract deployed to:", contract.address);
    await isdepolyed(contract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
