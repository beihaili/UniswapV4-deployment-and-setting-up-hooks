//addliquidity.ts
import { FixedNumber, ethers } from "ethers";
const MyLiquidityProvider = require ("../artifacts/contracts/MyLiquidityProvider.sol/MyLiquidityProvider.json");

const MyLiquidityProviderAbi = MyLiquidityProvider.abi;

// Connect to local Hardhat network
let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

const interfaceAddr = "0x82e01223d51Eb87e16A03E24687EDF0F294da6f1"
//const interfaceAddr = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed"
interface PoolKey {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
}

let contract = new ethers.Contract(interfaceAddr, MyLiquidityProviderAbi, wallet);

function calculateTickFromPrice2(price: number): number {
    return Math.floor(Math.log(price) / Math.log(1.0001));
}


let modifyPositionParams = {
    tickLower: calculateTickFromPrice2(0.5), // lower price 0.5
    tickUpper: calculateTickFromPrice2(1.5), // upper price 1.5
    liquidityDelta: ethers.BigNumber.from("3414213562373095612252")
};

console.log(`modifyPositionParams: ${JSON.stringify(modifyPositionParams)}`);

let poolKey: PoolKey = {
    currency0: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    currency1: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    fee: 500,
    tickSpacing: 60,
    hooks:     "0x0000000000000000000000000000000000000000",
};

console.log(`Poolkey: ${JSON.stringify(poolKey)}`);

async function modifyPosition(poolKey, modifyPositionParams) {
    // Set position parameters
    let tx = await contract.setPositionParameters(poolKey, modifyPositionParams);
    await tx.wait();
    console.log("Position parameters set successfully");
    // Add liquidity
    tx = await contract.addLiquidity();
    await tx.wait();
}

async function main() {
    await modifyPosition(poolKey, modifyPositionParams);
    console.log("Liquidity added successfully");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
