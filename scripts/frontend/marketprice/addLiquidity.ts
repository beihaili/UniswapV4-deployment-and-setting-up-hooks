import { BigNumber, Contract } from "ethers";
// @ts-ignore
//import { ethers } from "hardhat";
import { ethers } from "ethers";
//import { token0Address, token1Address, hookAddress, myliquidityProviderAddress, poolmanagerAddress  } from "../lib/address";
import {wallet, provider} from "../lib/address"
import {poolManager, MyLiquidityProvider, hook, token0, token1} from "../lib/address"
import {limitOrderPoolKey} from "../lib/address"
import {caculateLiqDetla,calculateTickFromPriceWithSpacing} from "../lib/cauculateliq"
import Big from 'big.js';

interface PoolKey {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
}

interface SwapParams {
    zeroForOne: boolean;
    amountSpecified: number;
    sqrtPriceLimitX96: number;
}

interface ModifyPositionParams {
    tickLower: number;
    tickUpper: number;
    liquidityDelta: BigNumber;
}

async function modifyPosition(contract:Contract, poolKey:PoolKey, modifyPositionParams:ModifyPositionParams) {
    // Set position parameters
    let tx = await contract.setPositionParameters(poolKey, modifyPositionParams);
    await tx.wait();
    console.log("Position parameters set successfully");
    // Add liquidity
    tx = await contract.addLiquidity();
    await tx.wait();
}

async function approveERC20(contract:Contract, toAddress: string, amount: ethers.BigNumber) {
    // 批准ERC20代币
    let tx = await contract.approve(toAddress, amount);
    // 等待交易被挖矿
    let receipt = await tx.wait();
    console.log(`Transaction hash: ${receipt.transactionHash}`);
}

async function getSlot0(contract:Contract, poolKey: PoolKey) {
    let poolId = getPoolId(poolKey);
    
    console.log(`PoolId: ${poolId}`);
    let slot0 = await contract.getSlot0(poolId);
    console.log(`Returned slot0: ${JSON.stringify(slot0)}`);
    return slot0;
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
// async function getPoolPrice(contract:Contract, poolKey: PoolKey): Promise<number> {
//     let slot0 = await getSlot0(contract, poolKey);
//     const bigNumberValue = slot0[0].toString();
//     console.log("bigNumberValue:", bigNumberValue);
//     const divisor = ethers.BigNumber.from(2).pow(96);
//     console.log("divisor:", divisor.toString());
//     const dividedValue = slot0[0].div(divisor);
//     console.log("dividedValue:", dividedValue.toString());
//     const result = dividedValue.mul(dividedValue);
//     console.log("result:", result.toString());
//     return result;
// }


async function getPoolPrice(contract:Contract, poolKey: PoolKey): Promise<number> {
    let slot0 = await getSlot0(contract, poolKey);
    const bigNumberValue = slot0[0].toString();
    console.log("bigNumberValue:", bigNumberValue);

    // 使用 Big.js
    const valueBig = new Big(bigNumberValue);
    const divisor = new Big(2).pow(96);
    console.log("divisor:", divisor.toString());

    const dividedValue = valueBig.div(divisor);
    console.log("dividedValue:", dividedValue.toString());

    const result = dividedValue.mul(dividedValue);
    console.log("result:", result.toString());

    return result.toNumber(); // 注意，转换回数字可能导致精度丢失，如果这是一个问题，您可能需要返回字符串或Big对象
}

async function isapproved(contract:Contract, ownerAddress: string, spenderAddress: string, amount: ethers.BigNumber) {
    // Check the amount of tokens that an owner allowed to a spender
    let allowance = await contract.allowance(ownerAddress, spenderAddress);
    console.log(`Allowance: ${allowance.toString()}`);
    if (allowance >= amount) {
        return true;
    }
    else {
        return false;
    }

}
export async function addLiq(priceLower,priceUpper,amount0,amount1,poolKey){
    let pricecur = await getPoolPrice(poolManager, poolKey);
    let liqdelta = caculateLiqDetla(priceLower,pricecur,priceUpper,amount0,amount1).toString()
    console.log(liqdelta)
    let lowertick  = calculateTickFromPriceWithSpacing(priceLower, poolKey.tickSpacing)
    let uppertick =  calculateTickFromPriceWithSpacing(priceUpper, poolKey.tickSpacing)
    let modifyPositionParams: ModifyPositionParams = {
        tickLower: lowertick, 
        tickUpper: uppertick,
        liquidityDelta: ethers.BigNumber.from(liqdelta)
        };
    //检查ERC20代币余额是否足够
    let balance0 = await token0.balanceOf(wallet.address);
    let balance1 = await token1.balanceOf(wallet.address);
    //待完成
    //检查是否批准足够ERC20代币
    if(await isapproved(token0, wallet.address, MyLiquidityProvider.address, ethers.utils.parseUnits("21000000", 18))==false){
        await approveERC20(token0,MyLiquidityProvider.address,ethers.utils.parseUnits("21000000", 18))
    }
    if(await isapproved(token1, wallet.address, MyLiquidityProvider.address, ethers.utils.parseUnits("21000000", 18))==false){
        await approveERC20(token1,MyLiquidityProvider.address,ethers.utils.parseUnits("21000000", 18))
    }
    //添加流动性
    await modifyPosition(MyLiquidityProvider, poolKey, modifyPositionParams);
    return 0;
}
async function getERC20Balance(contract:Contract, address: string) {
    // 查询ERC20余额
    let balance = await contract.balanceOf(address);
    console.log(`ERC20 Balance: ${balance.toString()}`);
    return balance;
}

async function main(){
    //let token0beforswap = await getERC20Balance(token0,wallet.address);
    //let token1beforswap = await getERC20Balance(token1,wallet.address);
    let priceLower =50
    let priceUpper =200
    let amount0 = ethers.utils.parseUnits("1000", 18)
    let amount1 = ethers.utils.parseUnits("1000", 18)
    await addLiq(priceLower,priceUpper,amount0,amount1,limitOrderPoolKey)
    await getPoolPrice(poolManager, limitOrderPoolKey);
    
    //let token0afterswap = await getERC20Balance(token0,wallet.address);
    //let token1afterswap = await getERC20Balance(token1,wallet.address);

    //console.log("token0 change:",token0afterswap.sub(token0beforswap).toString())
    //console.log("token1 change:",token1afterswap.sub(token1beforswap).toString())

}
main()

