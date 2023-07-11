pragma solidity ^0.8.20;

import {IPoolManager} from 'contracts/interfaces/IPoolManager.sol';
import {ILockCallback} from 'contracts/interfaces/callback/ILockCallback.sol';

contract MyLiquidityProvider is ILockCallback {
    IPoolManager public poolManager;

    IPoolManager.PoolKey public key;
    IPoolManager.ModifyPositionParams public positionParams;
    IPoolManager.SwapParams public swapParams;

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
    }

    function setPositionParameters(IPoolManager.PoolKey memory _key, IPoolManager.ModifyPositionParams memory _params) public {
        key = _key;
        positionParams = _params;
    }

    function setSwapParameters(IPoolManager.PoolKey memory _key, IPoolManager.SwapParams memory _params) public {
        key = _key;
        swapParams = _params;
    }

    function addLiquidity() external {
        poolManager.lock(abi.encode(key, positionParams));
    }

    function executeSwap() external {
        poolManager.lock(abi.encode(key, swapParams));
    }

    function lockAcquired(uint256 id, bytes calldata data) external override returns (bytes memory) {
        (IPoolManager.PoolKey memory key, IPoolManager.ModifyPositionParams memory positionParams, IPoolManager.SwapParams memory swapParams) = abi.decode(data, (IPoolManager.PoolKey, IPoolManager.ModifyPositionParams, IPoolManager.SwapParams));
        
        if (positionParams.liquidityDelta != 0) {
            poolManager.modifyPosition(key, positionParams);
        } else if (swapParams.amountSpecified != 0) {
            poolManager.swap(key, swapParams);
        }

        return bytes("");
    }
}
