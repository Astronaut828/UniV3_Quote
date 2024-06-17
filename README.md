# UniV3_Quote
Allows getting the expected amount out for a given swap without executing the swap
In this example, we use the QuoterV2 contract to get the expected amount out, there is a version of the call in Solidity as well as Typescript.

TS: 
npx ts-node PriceCall.ts

SOL: 
forge script script/Pricecall.s.sol --fork-url https://eth-mainnet.alchemyapi.io/v2/<YOUR_ALCHEMY_API_KEY> --sender <CALLER_ADDRESS> --private-key <CALLER_PRIVATE_KEY> --chain-id 1 