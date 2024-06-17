import {
    createPublicClient,
    createWalletClient,
    http,
    getContract,
} from "viem";
import dotenv from "dotenv";
import IQuoterV2 from "@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoterV2.sol/IQuoterV2.json";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const FORK_URL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;

// Set up the account with the private key
const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);

// Set up the public client for price Call
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(FORK_URL),
});

// Set up the wallet client for price Call
const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(FORK_URL),
});

// QuoterV2 contract address on mainnet
const QUOTER_CONTRACT_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";

// Create the contract instance
const quoterContract = getContract({
    address: QUOTER_CONTRACT_ADDRESS,
    abi: IQuoterV2.abi,
    client: { public: publicClient, wallet: walletClient },
});

// Addresses of the tokens and fee initialization
const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const PEPE = "0x6982508145454Ce325dDbE47a25d4ec3d2311933"; // $Mango
const FEE_05 = 500;
const FEE_3 = 3000;
// 1 ETH in BigInt / 1e18
const AmountIn = 1000000000000000000n;

// Interface for QuoterV2 contract call
interface ContractResponse {
    result: [
        bigint, // amountIn
        bigint, // sqrtPriceX96After
        number, // initializedTicksCrossed
        bigint // gasEstimate
    ];
    request: {
        abi: any;
        address: string;
        args: any[];
    };
}

// Interface for QuoterV2 response
interface QuoteExactOutputSingleResponse {
    amountIn: bigint;
    sqrtPriceX96After: bigint;
    initializedTicksCrossed: number;
    gasEstimate: bigint;
}

// Function to get quote from QuoterV2 contract
async function getQuote(
    tokenIn: string,
    tokenOut: string,
    amountOut: bigint,
    fee: number
): Promise<QuoteExactOutputSingleResponse> {
    const params = {
        tokenIn,
        tokenOut,
        amount: amountOut,
        fee,
        sqrtPriceLimitX96: 0n,
    };

    try {
        // Call the contract // simulate write function to get the quote
        const response = (await quoterContract.simulate.quoteExactOutputSingle([
            params,
        ])) as unknown as ContractResponse;
        // collect the result values from the response
        const { result } = response;

        const quotedAmountOut: QuoteExactOutputSingleResponse = {
            amountIn: result[0],
            sqrtPriceX96After: result[1],
            initializedTicksCrossed: result[2],
            gasEstimate: result[3],
        };

        return quotedAmountOut;
    } catch (error) {
        console.error("Error getting quote:", error);
        throw error;
    }
}

// Function to format BigInt to string with decimals, for readability
function formatBigInt(value: bigint, decimals: number): string {
    const factor = BigInt(10 ** decimals);
    const integerPart = value / factor;
    const fractionalPart = value % factor;
    return `${integerPart}.${fractionalPart
        .toString()
        .padStart(decimals, "0")}`;
}

async function main() {
    try {
        // Get block number // sanity check // double check with solidity values
        const blockNumber = await publicClient.getBlockNumber();
        console.log("Block Number:", blockNumber);

        // Price calculations for WETH and USDC
        const oneETH = 1000000000000000000n; // 1 ETH in BigInt

        // Call to get price of 1 ETH in USDC
        const quoteA = await getQuote(USDC, WETH9, oneETH, FEE_05); // USDC (6 decimals)
        const priceWETHInUSDC = formatBigInt(quoteA.amountIn, 6);
        console.log("1 WETH in USDC:", priceWETHInUSDC);

        // Call to get price of PEPE in WETH
        const quoteB = await getQuote(PEPE, WETH9, oneETH, FEE_3); // PEPE (18 decimals)
        const pricePEPEInWETH = formatBigInt(quoteB.amountIn, 18);
        console.log("1 PEPE in WETH:", pricePEPEInWETH);

        // Price calculations for native shop token in ETH and USDC
        const itemPrice = 20000000000000000000n; // 20 PEPE/Mango in BigInt

        // Calculate WETH per Item (Pepe Price)
        const itemPriceInWETH = (itemPrice * oneETH) / quoteB.amountIn;
        const formattedItemPriceInWETH = formatBigInt(itemPriceInWETH, 18);

        // Calculate USDC per Item (Pepe Price)
        const itemPriceInUSDC = (itemPriceInWETH * quoteA.amountIn) / oneETH;
        const formattedItemPriceInUSDC = formatBigInt(itemPriceInUSDC, 6);

        console.log("Item Price in PEPE:", itemPrice / oneETH);
        console.log("Item Price in WETH:", formattedItemPriceInWETH);
        console.log("Item Price in USDC:", formattedItemPriceInUSDC);
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main().catch((error) => {
    console.error("Unhandled error in main function:", error);
    process.exit(1);
});
