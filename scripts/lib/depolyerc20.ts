// @ts-ignore
import { ethers } from "hardhat";

// // 连接到本地Hardhat网络
// let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// // 使用您提供的私钥创建钱包
// let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
export const provider = new ethers.providers.JsonRpcProvider("http://10.130.157.196:3400");
export const wallet  = new ethers.Wallet("ba75c5fd16ae1151dc9f961e94e219994c6335a5b4148c624142243fb76306d6", provider)


async function isdepolyed(address: string) {
    let code = await provider.getCode(address);
    if (code !== "0x") {
        console.log("The contract has been deployed.");
    } else {
        console.log("The contract has not been deployed.");
    }
}
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function main() {

  const Token0 = await ethers.getContractFactory("Token0",wallet);
  const Token1 = await ethers.getContractFactory("Token1",wallet);
  
  let token0 = await Token0.deploy();
  await token0.deployed();
  
  const totalSupply = await token0.totalSupply()
  console.log(`Token deployed to ${token0.address} with an initialSupply ${totalSupply}`); 

  let token1 = await Token1.deploy();
  await token1.deployed();
  
  const totalSupply1 = await token1.totalSupply()
  console.log(`Token deployed to ${token1.address} with an initialSupply ${totalSupply1}`);

  if (token0.address >= token1.address) {
    //change token0 and token1
    let temp = token0;
    token0 = token1;
    token1 = temp;
  }
  //await sleep(20000);  // wait for 5 seconds
  await isdepolyed(token0.address);
  await isdepolyed(token1.address);
  //return contract token0 and token1
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
