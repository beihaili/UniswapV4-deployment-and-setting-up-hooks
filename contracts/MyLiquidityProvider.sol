pragma solidity ^0.8.20;

import "hardhat/console.sol";
import {IPoolManager} from 'contracts/interfaces/IPoolManager.sol';
import {BalanceDelta} from 'contracts/PoolManager.sol';
import {ILockCallback} from 'contracts/interfaces/callback/ILockCallback.sol';
import {PoolManager} from 'contracts/PoolManager.sol';
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {CurrencyLibrary, Currency} from 'contracts/libraries/CurrencyLibrary.sol';

struct CallbackData {
    address sender;
    IPoolManager.PoolKey key;
    uint256 amount0;
    uint256 amount1;
}

contract MyLiquidityProvider is ILockCallback {
    IPoolManager public poolManager;
    IPoolManager.PoolKey public key;
    IPoolManager.ModifyPositionParams public positionParams;
    IPoolManager.SwapParams public swapParams;
    address public myaddress;
    uint256 public amount0;
    uint256 public amount1; 

    error SwapExpired();
    error OnlyPoolManager();
    using SafeERC20 for IERC20;
    using CurrencyLibrary for Currency;

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        //myaddress = msg.sender;
    }

    function setPositionParameters(IPoolManager.PoolKey memory _key, IPoolManager.ModifyPositionParams memory _params) public {
        myaddress = msg.sender;
        key = _key;
        positionParams = _params;
        console.log("p1111111111111111111111 ");
    }

    function setSwapParameters(IPoolManager.PoolKey memory _key, IPoolManager.SwapParams memory _params) public {
        myaddress = msg.sender;
        key = _key;
        swapParams = _params;
        console.log("SwapParams and key22222222222222222222 ");
    }

    function setDonateParameters(IPoolManager.PoolKey memory _key, uint256 _amount0, uint256 _amount1) public {
        key = _key;
        myaddress = msg.sender;
        amount0 = _amount0;
        amount1 = _amount1;
        //console.log("SwapParams and key ");
    }

    function addLiquidity() external {
        //console.log("addliq0");
        //console.log("PoolManager:",address(poolManager));
        poolManager.lock(abi.encode(key, positionParams, swapParams, amount0, amount1));
        //string memory a = abi.decode(data,(string));
        //console.log(a);
        //poolManager.lock(abi.encode("1"));
        //console.log("addliq1");
    }

    function executeSwap() external {
        //console.log("SWAP0");
        poolManager.lock(abi.encode(key, positionParams, swapParams, amount0, amount1));
        //console.log("SWAP1");
    }

    function donate() external {
        //console.log("donate0");
        poolManager.lock(abi.encode(key, positionParams, swapParams, amount0, amount1));
        //console.log("donate1");
    }

    function lockAcquired(uint256 id, bytes calldata data) external override returns (bytes memory) {
        console.log("lockAcquired0");
        (IPoolManager.PoolKey memory key, IPoolManager.ModifyPositionParams memory positionParams,IPoolManager.SwapParams memory swapParams, uint256 address0, uint256 address1) = abi.decode(data, (IPoolManager.PoolKey, IPoolManager.ModifyPositionParams, IPoolManager.SwapParams, uint256, uint256));
        //console.log(int128(positionParams.liquidityDelta));
         if (positionParams.liquidityDelta != 0) {
             //console.log("lockAcquired liq0");
             BalanceDelta delta = poolManager.modifyPosition(key, positionParams);
             console.log("lockAcquired liq1");
             _settleCurrencyBalance(key.currency0, delta.amount0());
             //console.log("lockAcquired liq2");
             _settleCurrencyBalance(key.currency1, delta.amount1());
             //positionParams.liquidityDelta = 0;
             //console.log("lockAcquired liq3");
         } else if (swapParams.amountSpecified != 0) {
             //console.log("lockAcquired swap0");
             BalanceDelta delta = poolManager.swap(key, swapParams);
             //console.log("lockAcquired swap1");
             _settleCurrencyBalance(key.currency0, delta.amount0());
             //console.log("lockAcquired swap2");
             _settleCurrencyBalance(key.currency1, delta.amount1());
             //swapParams.amountSpecified = 0;
         } else if (address0 != 0 || address1 != 0) {
             //console.log("lockAcquired donate0");
             BalanceDelta delta = poolManager.donate(key, address0, address1);
             //console.log("lockAcquired donate1");
             _settleCurrencyBalance(key.currency0, delta.amount0());
             //console.log("lockAcquired donate2");
             _settleCurrencyBalance(key.currency1, delta.amount1());
             //address0 = 0;
             //address1 = 0;
         } else {
             //console.log("lockAcquired else0");
             revert("invalid params");
         }
         
        
        return bytes("");
    }

    function _settleCurrencyBalance(
        Currency currency,
        int128 deltaAmount
    ) private {
        //console.log("_settleCurrencyBalance0");
        if (deltaAmount < 0) {
            //console.log("_settleCurrencyBalance1");
            //poolManager.take(currency, 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, uint128(-deltaAmount));
            poolManager.take(currency, myaddress, uint128(-deltaAmount));
            return;
        }

        if (currency.isNative()) {
            console.log("_settleCurrencyBalance2");
            console.log("deltaAmount",uint128(deltaAmount));
            console.log("msg.sender",msg.sender);
            console.log("poolManager",address(poolManager));
            //console balanceofthis address
            console.log("balanceofthis",address(this).balance);
            console.log("balanceofmyaddress",myaddress.balance);
            console.log("addressofthis",address(this));
            //tx.oregin
            poolManager.settle{value: uint128(deltaAmount)}(currency);
            console.log("_settleCurrencyBalance3");
            return;
        }
        //console.log("_settleCurrencyBalance3");
        ////console.log(Currency.unwrap(currency));
        //console.log("msgsender:",msg.sender);
        //console.log("poolManager:",address(poolManager));
        ////console.log(IERC20(Currency.unwrap(currency)).balanceOf(msg.sender));
        
        //msg.sender.approve
        //GXGToken.approve(msg.sender,_amount);
        //console.log("daltaAmount",uint128(deltaAmount));
        IERC20(Currency.unwrap(currency)).safeTransferFrom(
           //msg.sender,
           myaddress,
           address(poolManager),
           uint128(deltaAmount)
        );
        
        //console.log("_settleCurrencyBalance4");
        poolManager.settle(currency);
    }
}
