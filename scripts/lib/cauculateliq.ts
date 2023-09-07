// @ts-ignore
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

function calculateTickFromPriceWithSpacing(price: number, tickSpacing=60): number {
    let unroundedTick = Math.floor(Math.log(price) / Math.log(1.0001));
    return Math.round(unroundedTick / tickSpacing) * tickSpacing;
}
function calculateTickFromPrice(price: number): number {
    let unroundedTick = Math.floor(Math.log(price) / Math.log(1.0001));
    return Math.round(unroundedTick);
}

function calculatePriceFromTick(tick: number): number {
    return Math.exp(tick * Math.log(1.0001));
}
const two96 = ethers.BigNumber.from("2").pow(96);
const x96 = 2 ** 96;

console.log(calculateTickFromPrice(100)); // testing with a price of 2
console.log(calculatePriceFromTick(calculateTickFromPrice(100))); // testing with a tick of 60
console.log("price=90:tick round=", calculateTickFromPriceWithSpacing(90));
console.log("price=110:tick round=", calculateTickFromPriceWithSpacing(110));
console.log("price=90:tick=", calculateTickFromPrice(90));
console.log("price=110:tick=", calculateTickFromPrice(110));

const q96 = BigInt(2) ** BigInt(96);

function priceToSqrtPrice(price: number): BigInt {
    return BigInt(Math.floor(Math.sqrt(price) * Number(q96)));
}

function sqrtPricetoPrice(sqrtprice: ethers.BigNumber) {
    return sqrtprice.mul(sqrtprice).div(two96).div(two96);
}

function pricetoSqrtPrice(price: number) {
    let sqrtPrice = Math.sqrt(price);
    let sqrtPriceX96 = ethers.Bignumber.from((sqrtPrice * x96).toString());
    return sqrtPriceX96;
}

function liquidity0(amount: number, pa: BigInt, pb: BigInt): BigInt {
    if (pa > pb) {
        [pa, pb] = [pb, pa];
    }
    return BigInt(amount) * pa * pb / q96 / (pb - pa);
}

function liquidity1(amount: number, pa: BigInt, pb: BigInt): BigInt {
    if (pa > pb) {
        [pa, pb] = [pb, pa];
    }
    return BigInt(amount) * q96 / (pb - pa);
}

function caculateLiqDetla(pricelow,pricecur,priceupp,amount0,amount1)
{
    let sqrt_low = priceToSqrtPrice(pricelow);
    let sqrt_cur = priceToSqrtPrice(pricecur);
    let sqrt_upp = priceToSqrtPrice(priceupp);
    let liq0 = liquidity0(amount0, sqrt_cur, sqrt_upp);
    let liq1 = liquidity1(amount1, sqrt_cur, sqrt_low);
    let liq = liq0 < liq1 ? liq0 : liq1;
    console.log(liq.toString());
    return liq;
}

function main(){
    caculateLiqDetla(100,110,120,100,100);
}


