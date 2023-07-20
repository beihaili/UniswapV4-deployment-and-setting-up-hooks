const { expect } = require("chai");
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";


let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider)
console.log("myaddress:",wallet.address)
const PoolManager = require('/Users/beihai/code/v4-core/artifacts/contracts/PoolManager.sol/PoolManager.json');
// 定义合约接口
const PoolManagerAbi = PoolManager.abi;
const ERC20 = require('/Users/beihai/code/v4-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');
const erc20Abi = ERC20.abi;
function calculateTickFromPrice(price: number, tickSpacing=60): number {
    let unroundedTick = Math.floor(Math.log(price) / Math.log(1.0001));
    return Math.round(unroundedTick / tickSpacing) * tickSpacing;
}

async function checkAllowance(contract:Contract, ownerAddress: string, spenderAddress: string) {
    // Check the amount of tokens that an owner allowed to a spender
    let allowance = await contract.allowance(ownerAddress, spenderAddress);
    console.log(`Allowance: ${allowance.toString()}`);
}

async function isdepolyed(address: string) {
    let code = await provider.getCode(address);
    if (code !== "0x") {
        console.log(`The contract ${address} has been deployed.`);
    } else {
        console.log(`The contract ${address} has not been deployed. `);
    }
}

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

async function modifyPosition(contract, poolKey, modifyPositionParams) {
    // Set position parameters
    let tx = await contract.setPositionParameters(poolKey, modifyPositionParams);
    await tx.wait();
    console.log("Position parameters set successfully");
    // Add liquidity
    tx = await contract.addLiquidity();
    await tx.wait();
}
async function initialize(contract:Contract, fee:number, tickspacing:number ,hooks:string, currency0:string ,currency1:string,sqrtPriceX96) {
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

async function approveERC20(contract,toAddress: string, amount: ethers.BigNumber) {
    // 批准ERC20代币
    let tx = await contract.approve(toAddress, amount);
    // 等待交易被挖矿
    let receipt = await tx.wait();
    console.log(`Transaction hash: ${receipt.transactionHash}`);
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

async function getSlot0(contract:Contract, poolKey: PoolKey) {
    let poolId = getPoolId(poolKey);
    console.log(`PoolId: ${poolId}`);
    let slot0 = await contract.getSlot0(poolId);
    console.log(`Returned slot0: ${JSON.stringify(slot0)}`);
}

async function getLiquidity(contract:Contract, poolKey: PoolKey) {
    let poolId = getPoolId(poolKey);
    console.log(`PoolId: ${poolId}`);
    //let liq0 = await contract.getLiquidity(poolId);
    let liq0 = await contract.functions['getLiquidity(bytes32)'](poolId);

    console.log(`Returned liquidity: ${liq0}`);
}

async function getERC20Balance(contract:Contract, address: string) {
    // 查询ERC20余额
    let balance = await contract.balanceOf(address);
    console.log(`ERC20 Balance: ${balance.toString()}`);
    return balance;
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
describe("MyLiquidityProvider", function() {
    it("Should return the new greeting once it's changed", async function() {
    //depoly erc20 token0 and token1
    const Token0 = await ethers.getContractFactory("Token0");
    const Token1 = await ethers.getContractFactory("Token1");

    const token0 = await Token0.deploy();
    await token0.deployed();
    const totalSupply0 = await token0.totalSupply();
    console.log(`Token0 deployed to ${token0.address} with an initial supply ${totalSupply0}`);

    const token1 = await Token1.deploy();
    await token1.deployed();
    const totalSupply1 = await token1.totalSupply();
    console.log(`Token1 deployed to ${token1.address} with an initial supply ${totalSupply1}`);
    getERC20Balance(token0,wallet.address);
    getERC20Balance(token1,wallet.address);
    const token0Address = token0.address<token1.address?token0.address:token1.address;
    const token1Address = token0.address>token1.address?token0.address:token1.address;
    await isdepolyed(token0Address);
    await isdepolyed(token1Address);
    //depoly poolManager
    const Factory = await ethers.getContractFactory("PoolManager");
    const controllerGasLimit = 88888888888;
    const contractpm = await Factory.deploy(controllerGasLimit);
    await contractpm.deployed();
    const poolManagerAddress = contractpm.address;
    console.log("PoolManager Contract deployed to:", poolManagerAddress);
    await isdepolyed(poolManagerAddress);
    //initial poolManager
    const fee = 500
    const tickspacing = 60
    let sqrtPriceX96 = "792281625142643375935439503360"// price = 100 token1/token0
    //console.log("sprtprice to price",sqrtPricetoPrice(sqrtPriceX96))
    const hooks =     "0x0000000000000000000000000000000000000000"
    await initialize(contractpm,fee,tickspacing,hooks,token0Address,token1Address,sqrtPriceX96);
    let poolKey: PoolKey = {
         currency0: token0Address,
         currency1: token1Address,
         fee: 500,
         tickSpacing: 60,
         hooks:     "0x0000000000000000000000000000000000000000",
     };
     getSlot0(contractpm, poolKey);
    //depoly MyLiquidityProvider
    const Factory0 = await ethers.getContractFactory("MyLiquidityProvider");
    const myContract = await Factory0.deploy(poolManagerAddress);
    await myContract.deployed();
    console.log("MyContract deployed to:", myContract.address);
    await isdepolyed(myContract.address);
    //approve ERC20 token to MyLiquidityProvider
    approveERC20(token0,myContract.address,ethers.utils.parseUnits("21000000", 18))
    approveERC20(token1,myContract.address,ethers.utils.parseUnits("21000000", 18))
    // check my allowance
    checkAllowance(token0, wallet.address, poolManagerAddress);
    checkAllowance(token1, wallet.address, poolManagerAddress);
    checkAllowance(token0, wallet.address, myContract.address);
    checkAllowance(token1, wallet.address, myContract.address);


    //add liquidity
    // let modifyPositionParams = {
    // tickLower: calculateTickFromPrice(5000), // lower price 0.5
    // tickUpper: calculateTickFromPrice(10000), // upper price 1.5
    // liquidityDelta: ethers.utils.parseEther('0.5')
    // };
    let modifyPositionParams = {
    tickLower: 45000, // lower price 90
    tickUpper: 46980, // upper price 110
    //liquidityDelta: 194868329805051412324060
    liquidityDelta: ethers.BigNumber.from('10000000000000000000000')// 10000token0 10000token1
    };

    //console.log(`modifyPositionParams: ${JSON.stringify(modifyPositionParams)}`);

    //console.log(`Poolkey: ${JSON.stringify(poolKey)}`);
    await getERC20Balance(token0,wallet.address);
    await getERC20Balance(token1,wallet.address);

    await modifyPosition(myContract, poolKey, modifyPositionParams);
    console.log("Liquidity added successfully");

    await getERC20Balance(token0,wallet.address);
    await getERC20Balance(token1,wallet.address);

    //get liquidity
    //await getSlot0(contractpm, poolKey);
    await getLiquidity(contractpm, poolKey);
    
    //swap
    let sqrtpricelimit=ethers.BigNumber.from('7922816251426433759354395033600')//price = 10000
    let amountswap = ethers.BigNumber.from('123456789101112134')

    let swapParams = {
        zeroForOne: false,
        amountSpecified: amountswap,
        sqrtPriceLimitX96: sqrtpricelimit
    }
    //console.log("sprtprice to price",sqrtPricetoPrice(pricetoSqrtPrice(110)))

    let token0beforswap = await getERC20Balance(token0,wallet.address);
    let token1beforswap = await getERC20Balance(token1,wallet.address);
 

    await executeSwap(myContract, poolKey, swapParams);

    console.log("swap successfully");
    let token0afterswap = await getERC20Balance(token0,wallet.address);
    let token1afterswap = await getERC20Balance(token1,wallet.address);

    console.log("token0 change:",token0afterswap.sub(token0beforswap).toString())
    console.log("token1 change:",token1afterswap.sub(token1beforswap).toString())
    //price=token0 change/token1 change
    console.log("price:",token1afterswap.sub(token1beforswap).toString()/token0afterswap.sub(token0beforswap).toString())
    

    //donate

  });
});