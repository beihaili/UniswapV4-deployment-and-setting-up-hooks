import { BigNumber, Contract } from "ethers";
// @ts-ignore
import { ethers } from "hardhat";
import { token0Address, token1Address, hookAddress, myliquidityProviderAddress, poolmanagerAddress  } from "../lib/address";
import {wallet, provider} from "../lib/address"
import {poolManager, MyLiquidityProvider, hook, token0, token1} from "../lib/address"
import {limitOrderPoolKey} from "../lib/address"
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
    amountSpecified: BigNumber;
    sqrtPriceLimitX96: BigNumber;
}

interface ModifyPositionParams {
    tickLower: number;
    tickUpper: number;
    liquidityDelta: number;
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

async function executeSwap(contract:Contract, poolKey:PoolKey, swapParams:SwapParams){
    
    // Set position parameters
    console.log("begin swap")
    let to0params = {
        tickLower: 840000, // lower price 0.5
        tickUpper: 876600, // upper price 1.5
        liquidityDelta: 0
    }
    let tx1 = await contract.setPositionParameters(poolKey, to0params);
    await tx1.wait();
    let tx2 = await contract.setSwapParameters(poolKey, swapParams);
    console.log("begin swap1")
    await tx2.wait();
    console.log("Position parameters set successfully");
    // swap
    let tx3 = await contract.executeSwap();
    await tx3.wait();
}
async function getERC20Balance(contract:Contract, address: string) {
    // 查询ERC20余额
    let balance = await contract.balanceOf(address);
    console.log(`ERC20 Balance: ${balance.toString()}`);
    return balance;
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

async function swap(poolkey, fromamount ,zeroForOne){
    let sqrtPriceLimitX96 = zeroForOne?ethers.BigNumber.from('79228162514264337593543950336'):ethers.BigNumber.from('7922816251426433759354395033600');
    console.log("sqrtPriceLimitX96:",sqrtPriceLimitX96.toString())
    let swapParams = {
        zeroForOne: zeroForOne,
        amountSpecified: fromamount,
        sqrtPriceLimitX96: sqrtPriceLimitX96
    }
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
    //执行交易
    await executeSwap(MyLiquidityProvider, poolkey, swapParams);
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

async function main(){
    
    let token0beforswap = await getERC20Balance(token0,wallet.address);
    let token1beforswap = await getERC20Balance(token1,wallet.address);
    getPoolPrice(poolManager, limitOrderPoolKey);
    await swap(limitOrderPoolKey,ethers.utils.parseUnits("100", 18),false)
    hook.on('*', (event) => {
        console.log(event.event + " event emitted:");
        // Loop over the keys in the event object
        for (const key in event.args) {
            console.log(key + ": ", event.args[key].toString());
        }
    });
    
    let token0afterswap = await getERC20Balance(token0,wallet.address);
    let token1afterswap = await getERC20Balance(token1,wallet.address);

    console.log("price:",token1afterswap.sub(token1beforswap).toString()/token0afterswap.sub(token0beforswap).toString())
    // let slot0 = await getSlot0(MyLiquidityProvider, limitOrderPoolKey);
    getPoolPrice(poolManager, limitOrderPoolKey);
}
main()