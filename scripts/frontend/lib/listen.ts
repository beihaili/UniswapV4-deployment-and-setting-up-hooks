import { BigNumber, Contract } from "ethers";
// @ts-ignore
import { ethers } from "hardhat";
import { token0Address, token1Address, hookAddress, myliquidityProviderAddress, poolmanagerAddress  } from "../lib/address";
import {wallet, provider} from "../lib/address"
import {poolManager, MyLiquidityProvider, hook, token0, token1} from "../lib/address"
import {limitOrderPoolKey} from "../lib/address"

async function listenAllEvent() {
    hook.on('*', (event) => {
        console.log(event.event + " event emitted:");
        // Loop over the keys in the event object
        for (const key in event.args) {
            console.log(key + ": ", event.args[key].toString());
        }
    });
}

async function listenPlaceEvent() {
    await contract.once("Place", (owner, epoch, key, tickLower, zeroForOne, liquidity, event) => {
        console.log("Place event emitted:");
        console.log("Owner: ", owner);
        console.log("Epoch: ", epoch.toString());
        console.log("Key: ", key);
        console.log("TickLower: ", tickLower.toString());
        console.log("ZeroForOne: ", zeroForOne);
        console.log("Liquidity: ", liquidity.toString());
    });
}

async function listenKillEvent() {
    await hook.once("Kill", (owner, epoch, key, tickLower, zeroForOne, liquidity, event) => {
        console.log("Kill event emitted:");
        console.log("Owner: ", owner);
        console.log("Epoch: ", epoch.toString());
        console.log("Key: ", key);
        console.log("TickLower: ", tickLower.toString());
        console.log("ZeroForOne: ", zeroForOne);
        console.log("Liquidity: ", liquidity.toString());
    
        // Handle event here
    });
}

async function listenWithdrawEvent() {
    await hook.once("Withdraw", (owner, epoch, liquidity, event) => {
        console.log("Withdraw event emitted:");
        console.log("Owner: ", owner);
        console.log("Epoch: ", epoch.toString());
        console.log("Liquidity: ", liquidity.toString());
    });
}

async function listenFillEvent() {
    await hook.once("Fill", (owner, epoch, key, tickLower, zeroForOne, liquidity, event) => {
        console.log("Fill event emitted:");
        console.log("Owner: ", owner);
        console.log("Epoch: ", epoch.toString());
        console.log("Key: ", key);
        console.log("TickLower: ", tickLower.toString());
        console.log("ZeroForOne: ", zeroForOne);
        console.log("Liquidity: ", liquidity.toString());
    
        // Handle event here
    });
}

async function main () {
    await listenAllEvent();
}
main()