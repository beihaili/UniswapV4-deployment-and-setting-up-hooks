import { ethers } from 'ethers';
const PoolManager = require('/Users/beihai/code/v4-core/artifacts/contracts/PoolManager.sol/PoolManager.json');
// 定义合约接口
const PoolManagerAbi = PoolManager.abi;

// 连接到本地Hardhat网络
let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// 使用您提供的私钥创建钱包
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
// 计算输出我的address
//console.log(`My address: ${wallet.address}`);

// 你的poolmanager合约地址
//const poolmanagerAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
const poolmanagerAddress = "0xFD471836031dc5108809D173A067e8486B9047A3";



// 连接到PM合约
let contract = new ethers.Contract(poolmanagerAddress, PoolManagerAbi, wallet);

async function initialize(fee,tickspacing,hooks,currency0,currency1,sqrtPriceX96) {
    let key = {
        currency0: currency0,
        currency1: currency1,
        fee: fee,
        tickSpacing: tickspacing,
        hooks: hooks,
    }; 
    let tick = await contract.initialize(key, sqrtPriceX96);
    console.log(`Returned tick: ${JSON.stringify(tick)}`);
}
//main function 
async function main() {
    const currency0 = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
    const currency1 = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"
    const fee = 500
    const tickspacing = 60
    let sqrtPriceX96 = ethers.FixedNumber.from('79228162514264337593543950336'); // This is 1 << 96
    const hooks =     "0x0000000000000000000000000000000000000000"
    await initialize(fee,tickspacing,hooks,currency0,currency1,sqrtPriceX96);
}

main().catch(console.error);
