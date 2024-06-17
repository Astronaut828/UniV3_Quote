// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IQuoterV2} from "node_modules/@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";

contract PriceCall {
    IQuoterV2 immutable quoter;

    constructor() {
        quoter = IQuoterV2(0x61fFE014bA17989E743c5F6cB21bF9697530B21e);
    }

    // WETH / USDC
    function getQuote_5(address _token0, address _token1) public returns (uint256, uint160, uint32, uint256) {
        // get pool based on fee token 1 token 0 
        // call pool .slot0*(  to get the sqrt price

        // uint256 price before
        IQuoterV2.QuoteExactOutputSingleParams memory params = IQuoterV2.QuoteExactOutputSingleParams({
            tokenIn: _token0, // WETH9
            tokenOut: _token1, // USDC
            amount: 1e18, // 1 WETH
            fee: 500, // 0.05% Pool Fee for WETH/USDC
            sqrtPriceLimitX96: 0
        });

        // 
        (uint256 amountOut, uint160 sqrtPriceX96, uint32 ticksCrossed, uint256 gas) =
            quoter.quoteExactOutputSingle(params);
        // diviude by type(uint96).max -> square 

        return (amountOut, sqrtPriceX96, ticksCrossed, gas);
    }

    function getQuote_3(address _token0, address _token1) public returns (uint256, uint160, uint32, uint256) {
        IQuoterV2.QuoteExactOutputSingleParams memory params = IQuoterV2.QuoteExactOutputSingleParams({
            tokenIn: _token0, // PEPE
            tokenOut: _token1, // WETH9
            amount: 1e18, // 1 PEPE
            fee: 3000, // 0.3% Pool Fee for WETH/PEPE
            sqrtPriceLimitX96: 0
        });

        (uint256 amountOut, uint160 sqrtPriceX96, uint32 ticksCrossed, uint256 gas) =
            quoter.quoteExactOutputSingle(params);
        return (amountOut, sqrtPriceX96, ticksCrossed, gas);
    }
}
