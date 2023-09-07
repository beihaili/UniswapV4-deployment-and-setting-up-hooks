// SPDX-License-Identifier: UNLICENSED
// a uniswapV4 hook that allows the pool use dynamic fees
pragma solidity ^0.8.20;
import "hardhat/console.sol";
import {IPoolManager} from "./interfaces/IPoolManager.sol";
import {PoolId, PoolIdLibrary} from "./libraries/PoolId.sol";
import {Hooks} from "./libraries/Hooks.sol";
import {FullMath} from "./libraries/FullMath.sol";
import {SafeCast} from "./libraries/SafeCast.sol";
import {IERC20Minimal} from "./interfaces/external/IERC20Minimal.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {BaseHook} from "./BaseHook.sol";
import {Currency, CurrencyLibrary} from "./libraries/CurrencyLibrary.sol";
import {BalanceDelta} from "./types/BalanceDelta.sol";
import { IDynamicFeeManager } from "./interfaces/IDynamicFeeManager.sol";

contract DynamicFee is BaseHook, IDynamicFeeManager{
    using SafeCast for uint256;

    uint160 public lastPrice; 
    uint160 public nowPrice;
    uint256 public lastBlockNumber;
    uint24 public feeNow;


    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHooksCalls() public pure override returns (Hooks.Calls memory) {
        return Hooks.Calls({
            beforeInitialize: false,
            afterInitialize: true,
            beforeModifyPosition: false,
            afterModifyPosition: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false
        });
    }

    function afterInitialize(address, IPoolManager.PoolKey calldata key, uint160, int24)
        external
        override
        virtual
        returns (bytes4)
    {
        // Initializing the nowPrice during the initialization of the contract
        (nowPrice,,,,,) = poolManager.getSlot0(PoolIdLibrary.toId(key));
        //(nowPrice,,,,,) = poolManager.getSlot0(key.toId());
        lastBlockNumber = block.number;
        console.log("afterInitialize");
        return DynamicFee.afterInitialize.selector;
    }

    // function getFee(IPoolManager.PoolKey calldata) external view returns (uint24) {
    //     console.log("!!!!getFee!!!!!!");
    //     //IPoolManager.PoolKey toId
    //     //调用function getSlot0(PoolId id)
    //     //获取价格信息存入price_now
    //     //比较price_now和price_last
    //     //根据price波动率设定fee
    //     return 60;
    // }

    function getFee(IPoolManager.PoolKey calldata key) external returns (uint24) {
        if(block.number > lastBlockNumber) {
            lastPrice = nowPrice;
            uint160 currentPrice;
            (currentPrice,,,,,) = poolManager.getSlot0(PoolIdLibrary.toId(key));
            nowPrice = currentPrice;

            if(nowPrice > lastPrice) {
                console.log("nowPrice > lastPrice");
                console.log(nowPrice);
                console.log(lastPrice);
                feeNow = 30;
            } else {
                console.log("nowPrice <= lastPrice");
                console.log(nowPrice);
                console.log(lastPrice);
                feeNow = 5;
            }
            
            lastBlockNumber = block.number; // Update the last block number
        }
        console.log("getFee!!!!!!!!!!!!!!!!!!!!!!");
        return feeNow;
    }

    function afterSwap(address, IPoolManager.PoolKey calldata, IPoolManager.SwapParams calldata, BalanceDelta) external override virtual returns (bytes4) {
        // Update lastBlockNumber after the swap
        lastBlockNumber = block.number;

        console.log("afterSwap");
        return DynamicFee.afterSwap.selector;
    }
    

    function beforeInitialize(address, IPoolManager.PoolKey calldata, uint160) external override virtual returns (bytes4) {
        return DynamicFee.beforeInitialize.selector;
    }

    function beforeModifyPosition(address, IPoolManager.PoolKey calldata, IPoolManager.ModifyPositionParams calldata)
        external
        override
        virtual
        returns (bytes4)
    {
        return DynamicFee.beforeModifyPosition.selector;
    }

    function afterModifyPosition(
        address,
        IPoolManager.PoolKey calldata,
        IPoolManager.ModifyPositionParams calldata,
        BalanceDelta
    ) external override virtual returns (bytes4) {
        //revert HookNotImplemented();
        return DynamicFee.afterModifyPosition.selector; 
    }

    function beforeSwap(address, IPoolManager.PoolKey calldata, IPoolManager.SwapParams calldata)
        external
        override
        virtual
        returns (bytes4)
    {
        //revert HookNotImplemented();
        return DynamicFee.beforeSwap.selector;
    }

    function beforeDonate(address, IPoolManager.PoolKey calldata, uint256, uint256) external override virtual returns (bytes4) {
        //revert HookNotImplemented();
        return DynamicFee.beforeDonate.selector;
    }

    function afterDonate(address, IPoolManager.PoolKey calldata, uint256, uint256) external override virtual returns (bytes4) {
        //revert HookNotImplemented();
        return DynamicFee.afterDonate.selector;

    }
}