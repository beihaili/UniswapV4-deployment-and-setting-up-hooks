import { ethers } from 'ethers';

// 连接到本地Hardhat网络
let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// 使用您提供的私钥创建钱包
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
// 计算输出我的address
//console.log(`My address: ${wallet.address}`);

const addr="0x68B1D87F95878fE05B998F19b66F4baba5De1aed"

async function isdepolyed(address: string) {
    let code = await provider.getCode(address);
    if (code !== "0x") {
        console.log("The contract has been deployed.");
    } else {
        console.log("The contract has not been deployed.");
    }
}

async function main() {
    isdepolyed(addr);}

main()