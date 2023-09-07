import { BigNumber, Contract } from "ethers";
// @ts-ignore
//import { ethers } from "hardhat";
import { ethers } from "ethers";
import { poolManager } from "./address";
import { limitOrderPoolKey } from "./address";

async function getSlot0(poolKey) {
    let poolId = getPoolId(poolKey);
    console.log(`PoolId: ${poolId}`);
    let slot0 = await poolManager.getSlot0(poolId);
    console.log(`Returned slot0: ${JSON.stringify(slot0)}`);
    return slot0;
}
function getPoolId(poolKey) {
    return ethers.utils.solidityKeccak256(
        ["bytes"],
        [ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "uint24", "int24", "address"],
            [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
        )]
    );
}
async function getPoolPrice(poolKey) {
    let slot0 = await getSlot0(poolKey);
    const bigNumberValue = slot0[0].toString();
    console.log("bigNumberValue:", bigNumberValue);
    const divisor = ethers.BigNumber.from(2).pow(96);
    console.log("divisor:", divisor.toString());
    const dividedValue = slot0[0].div(divisor);
    console.log("dividedValue:", dividedValue.toString());
    const result = dividedValue.mul(dividedValue);
    console.log("result:", result.toString());
    return result;
}

async function main(){
    console.log(getPoolPrice(limitOrderPoolKey))
}
main()