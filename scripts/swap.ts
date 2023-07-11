const key = {
    fee: ..., // 费用
    tickSpacing: ..., // tick间距
    hooks: ..., // 钩子
    currency0: ..., // 货币0
    currency1: ..., // 货币1
};

const sqrtPriceX96 = ...; // 平方根价格

// 假设你的合约实例是 contractInstance
contractInstance.methods.initialize(key, sqrtPriceX96).send({ from: yourAccountAddress });
