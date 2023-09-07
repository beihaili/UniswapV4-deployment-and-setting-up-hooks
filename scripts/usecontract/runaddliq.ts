const { expect } = require("chai");
import { BigNumber, Contract } from "ethers";
// @ts-ignore
import { ethers } from "hardhat";


let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider)
console.log("myaddress:",wallet.address)
// 定义合约接口
const PoolM = require('/Users/beihai/code/v4-core/artifacts/contracts/PoolManager.sol/PoolManager.json');
const poolManagerAbi = PoolM.abi;
const ERC20 = require('/Users/beihai/code/v4-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');
const erc20Abi = ERC20.abi;
const Mylp = require('/Users/beihai/code/v4-core/artifacts/contracts/MyLiquidityProvider.sol/MyLiquidityProvider.json')
const myliquidityProviderAbi = Mylp.abi;


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

function calculateTickFromPrice(price: number, tickSpacing=60): number {
    let unroundedTick = Math.floor(Math.log(price) / Math.log(1.0001));
    return Math.round(unroundedTick / tickSpacing) * tickSpacing;
}

async function checkAllowance(contract:Contract, ownerAddress: string, spenderAddress: string) {
    // Check the amount of tokens that an owner allowed to a spender
    let allowance = await contract.allowance(ownerAddress, spenderAddress);
    console.log(`Allowance: ${allowance.toString()}`);
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

async function modifyPosition(contract:Contract, poolKey:PoolKey, modifyPositionParams:ModifyPositionParams) {
    // Set position parameters
    let tx = await contract.setPositionParameters(poolKey, modifyPositionParams);
    await tx.wait();
    console.log("Position parameters set successfully");
    // Add liquidity
    tx = await contract.addLiquidity();
    await tx.wait();
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

async function getETHBalance(address: string) {
    // 查询余额
    let balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${balance.toString()}`);
    return balance;
}

async function depolyContract(contractName: string, params?: any): Promise<Contract> {
    const Factory = await ethers.getContractFactory(contractName);
    let contract;
    if (params === undefined) {
        contract = await Factory.deploy();
    } else {
        console.log(`params: ${JSON.stringify(params)}`);
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
    let hookaddress: string;
    let myliquidityProvideraddress: string;
    let poolmanagerAddress: string;

    token0Address = "0x22753E4264FDDc6181dc7cce468904A80a363E44"
    token1Address = "0xA7c59f010700930003b33aB25a7a0679C860f29c"
    hookaddress = "0x3347B4d90ebe72BeFb30444C9966B2B990aE9FcB"
    myliquidityProvideraddress = "0x276C216D241856199A83bf27b2286659e5b877D3"
    poolmanagerAddress = "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c"

    

    token0 = new ethers.Contract(token0Address, erc20Abi, wallet);
    token1 = new ethers.Contract(token1Address, erc20Abi, wallet);
    poolManager = new ethers.Contract(poolmanagerAddress,poolManagerAbi,wallet);
    MyLiquidityProvider = new ethers.Contract(myliquidityProvideraddress,myliquidityProviderAbi,wallet);

    


    let modifyPositionParams = {
        tickLower: 45000, // lower price 90
        tickUpper: 46980, // upper price 110
        //liquidityDelta: 194868329805051412324060
        liquidityDelta: ethers.BigNumber.from('10000000000000000000000')// 10000token0 10000token1
        };
        //token1 is depoly to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 use erc20 abi
        //PoolManager is depoly to  use poolmanager abi
        //myliquidityProvider is
        //await getERC20Balance(token1,wallet.address);
        //transfer 1 ETH to PoolManager
        let deltaamount = ethers.BigNumber.from("55242086959925679280");
        //await transfereth(MyLiquidityProvider.address, deltaamount);
        //console.log("MyLiquidityProvider address:",MyLiquidityProvider.address)
        //await getETHBalance(MyLiquidityProvider.address);
        const DYNAMIC_FEE_FLAG = 0x800000;
        let poolKey: PoolKey = {
            currency0: token0Address,
            currency1: token1Address,
            fee: DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks:     hookaddress,
        };
        
        //approve ERC20 to hook
        await approveERC20(token0,hookaddress,ethers.utils.parseUnits("21000000", 18))
        await approveERC20(token1,hookaddress,ethers.utils.parseUnits("21000000", 18))
        //approve ERC20 to MyLiquidityProvider
        await approveERC20(token0,MyLiquidityProvider.address,ethers.utils.parseUnits("21000000", 18))
        await approveERC20(token1,MyLiquidityProvider.address,ethers.utils.parseUnits("21000000", 18))
        //eth change
        // let before = await getETHBalance(wallet.address);
        // await modifyPosition(MyLiquidityProvider, poolKey, modifyPositionParams);
        // console.log("Liquidity added successfully");
        // let after = await getETHBalance(wallet.address);
        // console.log("eth change:",after.sub(before).toString())

        //token change
        let before0 = await getERC20Balance(token0,wallet.address);
        let before1 = await getERC20Balance(token1,wallet.address);
        await modifyPosition(MyLiquidityProvider, poolKey, modifyPositionParams);
        console.log("Liquidity added successfully");
        let after0 = await getERC20Balance(token0,wallet.address);
        let after1 = await getERC20Balance(token1,wallet.address);


        console.log("token0 change:",after0.sub(before0).toString())
        console.log("token1 change:",after1.sub(before1).toString())

        //get liquidity
        await getSlot0(poolManager, poolKey);
        await getLiquidity(poolManager, poolKey);
        
        // //swap
        let sqrtpricelimit=ethers.BigNumber.from('7922816251426433759354395033600')//price = 10000
        let amountswap = ethers.BigNumber.from('123456789101112134')
        console.log("amountswap:",amountswap.toString())
    
        let swapParams = {
            zeroForOne: false,
            amountSpecified: amountswap,
            sqrtPriceLimitX96: sqrtpricelimit
        }
        //console.log("sprtprice to price",sqrtPricetoPrice(pricetoSqrtPrice(110)))
    
        let token0beforswap = await getERC20Balance(token0,wallet.address);
        let token1beforswap = await getERC20Balance(token1,wallet.address);
     
    
        await executeSwap(MyLiquidityProvider, poolKey, swapParams);
    
        console.log("swap successfully");
        let token0afterswap = await getERC20Balance(token0,wallet.address);
        let token1afterswap = await getERC20Balance(token1,wallet.address);
    
        //console.log("token0 change:",token0afterswap.sub(token0beforswap).toString())
        //console.log("token1 change:",token1afterswap.sub(token1beforswap).toString())
        //price=token0 change/token1 change
        console.log("price:",token1afterswap.sub(token1beforswap).toString()/token0afterswap.sub(token0beforswap).toString())
        
        await getSlot0(poolManager, poolKey);
    }
    main();