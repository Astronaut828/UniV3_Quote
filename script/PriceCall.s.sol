// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {PriceCall} from "../src/PriceCall.sol";
import "forge-std/Test.sol";

contract Pricecall is Script , Test {
    function setUp() public {}

    function run() public {
        // Get Alchemy API Key
        string memory ALCHEMY_API_KEY = vm.envString("ALCHEMY_API_KEY");
        // Concatenation of Alchemy API Key and Mainnet URL
        string memory forkUrl = string(abi.encodePacked("https://eth-mainnet.alchemyapi.io/v2/", ALCHEMY_API_KEY));
        // Create a fork of mainnet
        uint256 mainnetFork = vm.createFork(forkUrl);

        vm.selectFork(mainnetFork);

        vm.startBroadcast();

        // Token addresses
        address WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        address PEPE = 0x6982508145454Ce325dDbE47a25d4ec3d2311933;

        PriceCall pricecall = new PriceCall();

        // Call to get price of WETH in USDC
        (uint256 amountOut_A,,,) = pricecall.getQuote_5(USDC, WETH9);

        // Call to get price of APE in WETH
        (uint256 amountOut_B,,,) = pricecall.getQuote_3(PEPE, WETH9);

        // get block number this call was made
        uint256 blockNumber = vm.getBlockNumber();
        console.log("Block Number:", blockNumber);

        // Price calculations for native shop token in ETH and USDC
         emit log_named_decimal_uint("1 WETH in USDC", amountOut_A, 6);
         emit log_named_decimal_uint("1 WETH in PEPE", amountOut_B, 18);

        // If a item is 20 PEPE, how much is it in WETH and how much is it in USDC?
        uint256 itemPriceInPEPE = 20e18;

        // Calculate WETH per Item (Pepe Price)
        uint256 itemPriceInWETH = itemPriceInPEPE * 1e18 / amountOut_B;

        // Calculate USDC per Item (Pepe Price)
        uint256 itemPriceInUSDC = (itemPriceInWETH * amountOut_A) / 1e18;

        console.log("Item Price in PEPE:", itemPriceInPEPE / 1e18);
        emit log_named_decimal_uint("Item Price in WETH", itemPriceInWETH, 18);
        emit log_named_decimal_uint("Item Price in USDC", itemPriceInUSDC, 6);

    }
}
