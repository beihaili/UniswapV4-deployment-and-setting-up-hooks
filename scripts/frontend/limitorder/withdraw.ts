import { BigNumber, Contract } from "ethers";
// @ts-ignore
import { ethers } from "hardhat";
import { token0Address, token1Address, hookAddress, myliquidityProviderAddress, poolmanagerAddress  } from "../lib/address";
import {wallet, provider} from "../lib/address"
import {poolManager, MyLiquidityProvider, hook, token0, token1} from "../lib/address"
import { limitOrderPoolKey } from "../lib/address"

async function withdrawLimitOrder(epoch, to) {
    let tx = await hook.withdraw(epoch, to);
    await tx.wait();
    console.log("limit order withdraw successfully");
    await hook.once("Withdraw", (owner, epoch, liquidity, event) => {
        console.log("Withdraw event emitted:");
        console.log("Owner: ", owner);
        console.log("Epoch: ", epoch.toString());
        console.log("Liquidity: ", liquidity.toString());
    });
}

async function main(){
    let epoch = 2
    let to = wallet.address 
    await withdrawLimitOrder(epoch, to);
}
main()
