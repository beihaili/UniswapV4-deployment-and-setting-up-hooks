//import { ethers } from 'ethers';
const ethers = require('ethers');

const PoolManager = require('/Users/beihai/code/v4-core/artifacts/contracts/PoolManager.sol/PoolManager.json');

const PoolManagerAbi = PoolManager.abi;

let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

const poolmanagerAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";

let contract = new ethers.Contract(poolmanagerAddress, PoolManagerAbi, wallet);

interface PoolKey {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
}

function getPoolId(poolKey: PoolKey): string {
    return ethers.utils.solidityKeccak256(
        ["bytes"],
        [ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "uint24", "int24", "address"],
            [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
        )]
    );
}


let poolKey: PoolKey = {
    currency0: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    currency1: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    fee: 500,
    tickSpacing: 60,
    hooks:     "0x0000000000000000000000000000000000000000",
};

async function initialize(fee,tickspacing,hooks,currency0,currency1,sqrtPriceX96) {
    let key = {
        fee: fee,
        tickSpacing: tickspacing,
        hooks: hooks,
        currency0: currency0,
        currency1: currency1,
    }; 
    let tick = await contract.initialize(key, sqrtPriceX96);
    console.log(`Returned tick: ${JSON.stringify(tick)}`);
}

async function getPool() {
    let pool = await contract.getPool();
    console.log(`Returned pool: ${JSON.stringify(pool)}`);
}

async function getSlot0() {
    let poolId = getPoolId(poolKey);
    console.log(`PoolId: ${poolId}`);
    let slot0 = await contract.getSlot0(poolId);
    console.log(`Returned slot0: ${JSON.stringify(slot0)}`);
}

//main function 
async function main() {
    await getSlot0();
}

main().catch(console.error);
