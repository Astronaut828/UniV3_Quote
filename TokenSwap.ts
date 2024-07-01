import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { createPublicClient, getContract, http, maxUint256, Hex } from 'viem';
import { base } from 'viem/chains';
import { UNIV3_CA, WETH_CA, USDC_CA } from '@/config/constants';
import ISwapRouter02 from '@uniswap/swap-router-contracts/artifacts/contracts/interfaces/ISwapRouter02.sol/ISwapRouter02.json';
import ERC20ABI from '@openzeppelin/contracts/build/contracts/ERC20.json';
import { useWalletClient, useWriteContract, useReadContract } from 'wagmi';

export function ProductBuyForm() {
  const { data: walletClient, isSuccess } = useWalletClient();
  const { data: hash, writeContract } = useWriteContract();

  // SwapRouter contract address on Base
  const SWAP_ROUTER_ADDRESS: Hex = UNIV3_CA.BASE.SwapRouter02 as Hex;
  // Testing variables for token approval and swap execution
  const inputToken: Hex = WETH_CA.BASE as Hex; // WETH
  const outputToken: Hex = USDC_CA.BASE as Hex; // USDC
  const testAmount: bigint = BigInt(0.0001 * 10 ** 18); // 0.0001 WETH
  const approvalAmount: bigint = maxUint256; // Maximum approval amount

  const {
    data: allowance,
    error: readError,
    isPending: isReading
  } = useReadContract({
    address: inputToken,
    abi: ERC20ABI.abi,
    functionName: 'allowance',
    args: [walletClient?.account.address, SWAP_ROUTER_ADDRESS]
  });

  // Load environment variables
  // const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
  const Base_URL = `https://mainnet.base.org`;

  // Initialize viem client
  const publicClient = createPublicClient({
    chain: base,
    transport: http(Base_URL)
  });

  // Function to approve token transfer and wait for the transaction to be mined
  const approveAmount = async (): Promise<any> => {
    if (!isSuccess || !walletClient) {
      console.error('Wallet client is not connected');
      return;
    }
    try {
      const tokenContract = getContract({
        address: inputToken,
        abi: ERC20ABI.abi,
        client: walletClient
      });

      const approval: Hex = await tokenContract.write.approve([
        SWAP_ROUTER_ADDRESS,
        approvalAmount
      ]);

      console.log(`Token approval transaction: ${approval}`);

      // Wait for the approval transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: approval });
      console.log('Approval transaction receipt:', receipt);

      return receipt;
    } catch (error) {
      console.error('Error during approval:', error);

      // Check if the error contains specific information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        if ((error as any).reason) {
          console.error('Revert reason:', (error as any).reason);
        }
        if ((error as any).data) {
          console.error('Error data:', (error as any).data);
        }
      }

      throw error;
    }
  };

  // Swap tokens using the SwapRouter contract
  const swapTokens = async (): Promise<any> => {
    if (!isSuccess || !walletClient) {
      console.error('Wallet client is not connected');
      return;
    }
    try {
      // Swap parameters
      const tokenIn: Hex = inputToken;
      const tokenOut: Hex = outputToken;
      const amountIn: bigint = testAmount;
      const amountOutMinimum: bigint = BigInt(1); // Minimum amount out, adjust later
      const fee = 500; // Adjust as necessary (pool dependent)
      const deadline: bigint = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from now
      const sqrtPriceLimitX96: bigint = BigInt(0);

      // Prepare the params for the exactInputSingle function
      const swapParams = {
        tokenIn,
        tokenOut,
        fee,
        recipient: walletClient.account.address,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96
      };

      console.log(
        `Executing swap with parameters: tokenIn=${tokenIn}, tokenOut=${tokenOut}, amountIn=${amountIn}, amountOutMinimum=${amountOutMinimum}, fee=${fee}, deadline=${deadline}, recipient=${walletClient.account.address}`
      );

      // Get the account address
      const [account] = await walletClient.getAddresses();
      // Simulate the transaction to catch potential errors
      const { request } = await publicClient.simulateContract({
        address: SWAP_ROUTER_ADDRESS,
        abi: ISwapRouter02.abi,
        functionName: 'exactInputSingle',
        args: [swapParams],
        account
      });

      // Execute swap
      const tx = await walletClient.writeContract(request);

      console.log('Swap executed:', tx);
      return tx;
    } catch (error) {
      console.error('Error during swap:', error);

      // Check if the error contains specific information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        if ((error as any).reason) {
          console.error('Revert reason:', (error as any).reason);
        }
        if ((error as any).data) {
          console.error('Error data:', (error as any).data);
        }
      }

      throw error;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let allowed = false;

    try {
      // Check if SwapRouter is already approved
      if (allowance && BigInt(allowance.toString()) >= approvalAmount) {
        console.log('Token already approved for SwapRouter');
        allowed = true;
      } else {
        // Approve token transfer
        console.log('Approving token for SwapRouter');
        const approvalReceipt = await approveAmount();
        if (!approvalReceipt || approvalReceipt.status !== 1) {
          throw new Error('Approval transaction failed');
        }
        allowed = true;
      }

      // TDDO: Add waiting for approval transaction to be mined

      if (allowed == true) {
        // Execute swap
        await swapTokens();
      }

      alert('Transaction successful');
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed: ' + (error as any).data);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-y-4 justify-center text-center w/full')}>
      <div className="text-[#7A7A7A] text-base">Buy 1 Corduroy Hat Token for</div>
      <div className="font-semibold text-2xl text-black mb-4">20 $MANGO</div>
      <div className="text-[#7A7A7A] text-base">152.62 $MANGO available</div>
      <Button type="submit" className="font-semibold">
        Confirm Buy
      </Button>
    </form>
  );
}
