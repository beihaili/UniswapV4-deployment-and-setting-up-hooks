import { BigNumber, ethers } from 'ethers';

// 连接到本地Hardhat网络
let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// 使用您提供的私钥创建钱包
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);


async function transfereth(toAddress: string, amount: BigNumber) {
    // 创建并发送交易
    let tx = await wallet.sendTransaction({
        to: toAddress,
        value: amount
    });
    // 等待交易被挖矿
    let receipt = await tx.wait();
    console.log(`Transaction hash: ${receipt.transactionHash}`);
}
async function getBalance(address: string) {
    // 查询余额
    let balance = await provider.getBalance(address);
    console.log(`Balance: ${balance.toString()}`);
}
async function main() {
    // 查询某个地址的余额
    await getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    await transfereth("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", ethers.utils.parseEther("1.0"));
    await getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
}

main().catch(console.error);
