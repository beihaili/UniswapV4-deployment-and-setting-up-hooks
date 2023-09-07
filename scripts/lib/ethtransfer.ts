import { BigNumber, ethers } from 'ethers';

// 连接到本地Hardhat网络
//let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
export const provider = new ethers.providers.JsonRpcProvider("http://10.130.157.196:3400");
// 使用您提供的私钥创建钱包
//let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
export const wallet  = new ethers.Wallet("ba75c5fd16ae1151dc9f961e94e219994c6335a5b4148c624142243fb76306d6",provider)

async function transfereth(toAddress: string, amount: Number) {
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
   //console.log(`Balance of ${address}: ${ethers.utils.formatEther(balance)};
    console.log(`Balance of ${address}: ${balance}`);
}
async function main() {
    // 查询某个地址的余额
    let address0 = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    let myaddress = wallet.address;
    await getBalance(myaddress);
    // 转账
    //await transfereth(myliquidityprovider, ethers.utils.parseEther("1.0"));
    //await transfereth(poolManager, ethers.utils.parseEther("1.0"));
    await transfereth(address0, 1);
    await getBalance(myaddress);
}

main().catch(console.error);
