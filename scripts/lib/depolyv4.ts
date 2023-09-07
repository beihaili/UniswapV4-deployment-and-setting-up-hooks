// scripts/deploy.ts
// @ts-ignore
import { ethers } from "hardhat";
const fs = require("fs");

export const provider = new ethers.providers.JsonRpcProvider("http://10.130.157.196:3400");
export const wallet  = new ethers.Wallet("ba75c5fd16ae1151dc9f961e94e219994c6335a5b4148c624142243fb76306d6", provider)

// export const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// export const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider)


async function isdepolyed(address: string) {
    let code = await provider.getCode(address);
    if (code !== "0x") {
        console.log("The contract has been deployed.");
    } else {
        console.log("The contract has not been deployed.");
        
    }
}

// 前面的代码不变

async function main() {
  const Factory = await ethers.getContractFactory("PoolManager", wallet);

  // 设置部署参数，这里假设controllerGasLimit为5000000
  const controllerGasLimit = 88888888888;
  const YOUR_GAS_LIMIT = 88888888888;

  // 获取预部署交易
  let deployTransaction = Factory.getDeployTransaction(controllerGasLimit);

  // 填充部分字段
  const nonce = await wallet.getTransactionCount();
  const gasPrice = await provider.getGasPrice();

  deployTransaction = {
      ...deployTransaction,
      nonce,
      gasPrice,
      // 注意，我们这里没有填充`to`字段，因为部署合约的交易没有`to`字段。
  };

  fs.writeFileSync("/Users/beihai/code/v4-core/scripts/frontend/lib/deploy_info.txt", JSON.stringify(deployTransaction, null, 2));

  console.log("Transaction data has been written to deploy_info.txt");
  const contract = await Factory.deploy(controllerGasLimit);
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);
  await isdepolyed(contract.address);
}

// 其他代码不变




main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });