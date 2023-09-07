const { expect } = require("chai");
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

const provider = new ethers.providers.JsonRpcProvider("http://10.130.157.196:3400");
const wallet  = new ethers.Wallet("ba75c5fd16ae1151dc9f961e94e219994c6335a5b4148c624142243fb76306d6", provider)
//let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
//let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider)
console.log("myaddress:",wallet.address)
const PoolManager = require('/Users/beihai/code/v4-core/artifacts/contracts/PoolManager.sol/PoolManager.json');
// 定义合约接口
//const PoolManagerAbi = PoolManager.abi;
const ERC20 = require('/Users/beihai/code/v4-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');
const erc20Abi = ERC20.abi;

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
    liquidityDelta: number;
}

async function isdepolyed(address) {
    let code = await provider.getCode(address);
    if (code !== "0x") {
        console.log(`The contract ${address} has been deployed.`);
    } else {
        console.log(`The contract ${address} has not been deployed. `);
    }
}

async function donate(contract, poolKey, amount0, amount1) {
    // Donate
    console.log("begin donate")
    let to0params = {
        tickLower: 840000, // lower price 0.5
        tickUpper: 876600, // upper price 1.5
        liquidityDelta: 0
    }
    let tx1 = await contract.setPositionParameters(poolKey, to0params);
    await tx1.wait();
    let swapParams = {
        zeroForOne: false,
        amountSpecified: 0,
        sqrtPriceLimitX96: 0
    }
    let tx2 = await contract.setSwapParameters(poolKey, swapParams);    
    await tx2.wait();
    
    let tx3 = await contract.setDonateParameters(poolKey, amount0, amount1);
    await tx3.wait();

    let tx4 = await contract.donate();
    await tx4.wait();

    console.log("donate successfully");
}

async function initialize(contract:Contract, key:PoolKey ,sqrtPriceX96) {
    let tick = await contract.initialize(key, sqrtPriceX96);
    console.log(`Returned tick: ${JSON.stringify(tick)}`);
}

async function approveERC20(contract:Contract, toAddress: string, amount: ethers.BigNumber) {
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

async function getETHBalance(address: string) {
    // 查询余额
    let balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${balance.toString()}`);
}

async function depolyContractwithwallet(contractName: string, params?: any): Promise<Contract> {
    const Factory = await ethers.getContractFactory(contractName, wallet);
    let contract;
    if (params === undefined) {
        contract = await Factory.deploy();
    } else {
        //console.log(`params: ${JSON.stringify(params)}`);
        contract = await Factory.deploy(params);
        //depolyContract("depoly1");
    }
    await contract.deployed();
    console.log(`${contractName} deployed to ${contract.address}`);
    return contract;
}

async function depolyContractwitoutwallet(contractName: string, params?: any): Promise<Contract> {
    const Factory = await ethers.getContractFactory(contractName, wallet);
    let contract;
    if (params === undefined) {
        contract = await Factory.deploy();
    } else {
        //console.log(`params: ${JSON.stringify(params)}`);
        contract = await Factory.deploy(params);
        //depolyContract("depoly1");
    }
    await contract.deployed();
    console.log(`${contractName} deployed to ${contract.address}`);
    return contract;
}

async function transfereth(toAddress: string, amount: BigNumber) {
    // 创建并发送交易
    let tx = await wallet.sendTransaction({
        to: toAddress,
        value: amount
    });
    // 等待交易被挖矿
    let receipt = await tx.wait();
    console.log(`Transaction hash: ${receipt.transactionHash}`);
}

async function main () {
    let token0: Contract;
    let token1: Contract;
    let token0Address: string;
    let token1Address: string;
    let poolManager: Contract;
    let MyLiquidityProvider: Contract;

    
        //depoly the contract before all test cases
        //depoly erc20 token0 and token1
        token0 = await depolyContractwithwallet("Token0");
        token1 = await depolyContractwithwallet("Token1");
        //const totalSupply0 = await token0.totalSupply();
        //console.log(`Token0 deployed to ${token0.address} with an initial supply ${totalSupply0}`);
        //const totalSupply1 = await token1.totalSupply();
        //console.log(`Token1 deployed to ${token1.address} with an initial supply ${totalSupply1}`);
        getERC20Balance(token0,wallet.address);
        getERC20Balance(token1,wallet.address);
        token0Address = token0.address<token1.address?token0.address:token1.address;
        token1Address = token0.address>token1.address?token0.address:token1.address;
        //await isdepolyed(token0Address);
        //await isdepolyed(token1Address);

        //depoly poolManager
        poolManager = await depolyContractwitoutwallet("PoolManager", 88888888888);
        console.log("PoolManager Contract deployed to:", poolManager.address);
        await isdepolyed(poolManager.address);

        //depoly MyLiquidityProvider
        MyLiquidityProvider = await depolyContractwitoutwallet("MyLiquidityProvider", poolManager.address);
        //console.log("MyContract deployed to:", MyLiquidityProvider.address);
        //await isdepolyed(MyLiquidityProvider.address);

        //depoly hook
        let feehook = await depolyContractwitoutwallet("LimitOrder", poolManager.address);
        console.log("feehook deployed to:", feehook.address);
    
        let sqrtPriceX96 = "792281625142643375935439503360"// price = 100 token1/token0
        //uint24 public constant DYNAMIC_FEE_FLAG = 0x800000; // 1000
        //const DYNAMIC_FEE_FLAG = 0x800000;
        let poolKey: PoolKey = {
            currency0: token0Address,
            currency1: token1Address,
            fee: 60,
            tickSpacing: 60,
            hooks:     feehook.address,
        };
        //await initialize(poolManager,poolKey,sqrtPriceX96);
        getSlot0(poolManager, poolKey);
        //approve ERC20 token to MyLiquidityProvider
        approveERC20(token0,MyLiquidityProvider.address,ethers.utils.parseUnits("21000000", 18))
        
        await getERC20Balance(token1,wallet.address);
        //transfer 1 ETH to PoolManager
        let deltaamount = ethers.BigNumber.from("55242086959925679280");
        //await transfereth(MyLiquidityProvider.address, deltaamount);
        console.log("MyLiquidityProvider address:",MyLiquidityProvider.address)
        await getETHBalance(MyLiquidityProvider.address);
        console.log("currency0 = ",token0Address)
        console.log("currency1 = ",token1Address)
        console.log("hookaddress = ",feehook.address)
        console.log("myliquidityProvideraddress = ",MyLiquidityProvider.address)
        console.log("poolmanagerAddress = ",poolManager.address)
        
        
    }
    main();