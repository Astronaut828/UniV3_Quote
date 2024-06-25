import {
    createPublicClient,
    createWalletClient,
    http,
    getContract,
} from "viem";
import dotenv from "dotenv";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import ISwapRouter from "@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json";
import ERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";

// Load environment variables
dotenv.config();
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const FORK_URL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;

// Setting up account and clients
// Set up the account with the private key
// const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
// Set up the public client for Token Swap
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(FORK_URL),
});
// Set up the wallet client for Token Swap
// const walletClient = createWalletClient({
//     account,
//     chain: mainnet,
//     transport: http(FORK_URL),
// });

// SwapRouter contract address on mainnet
const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
// Create the SwapRouter instance
const swapRouterContract = getContract({
    address: SWAP_ROUTER_ADDRESS,
    abi: ISwapRouter.abi,
    // client: { public: publicClient, wallet: walletClient },
    client: { public: publicClient },
});

// Function to get token balance of user address
async function getTokenBalance(
    tokenAddress: `0x${string}`, // Token address
    ownerAddress: string // User address
) {
    const tokenContract = getContract({
        address: tokenAddress,
        abi: ERC20ABI.abi,
        client: { public: publicClient },
    });

    const balance = await tokenContract.read.balanceOf([ownerAddress]);
    return balance;
}

// Function to approve token transfer
// Approve the SwapRouter contract to spend the token
async function approveTokenTransfer(
    tokenAddress: `0x${string}`, // Token address
    spenderAddress: `0x${string}`, // SwapRouter address
    amount: bigint
) {
    const tokenContract = getContract({
        address: tokenAddress,
        abi: ERC20ABI.abi,
        // client: { wallet: walletClient },
        client: { public: publicClient },
    });

    const approval = await tokenContract.write.approve([
        spenderAddress,
        amount,
    ]);
    console.log(`Token approval transaction: ${approval}`);
}

// Function to execute a swap
async function executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMinimum: bigint,
    fee: number
) {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time

    const swapParams = {
        tokenIn,
        tokenOut,
        fee,
        recipient: account.address,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: 0n,
    };

    try {
        const tx = await walletClient.writeContract({
            address: SWAP_ROUTER_ADDRESS,
            abi: ISwapRouter.abi,
            functionName: "exactInputSingle",
            args: [swapParams],
        });
        console.log("Swap executed:", tx);
        return tx;
    } catch (error) {
        console.error("Error executing swap:", error);
        throw error;
    }
}
