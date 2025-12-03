import { formatUnits, parseEther, type PublicClient, type Address } from "viem";
import { quoterAbi, COMMON_FEE_TIERS } from "../constants/abis";
import { getChainConfig } from "./chains";

export interface TokenPriceResult {
  /** Token price in USD */
  price: number;
  /** The pool fee tiers used [tokenIn->WETH, WETH->USDC] */
  fees: [number, number];
}

export interface GetTokenPriceParams {
  publicClient: PublicClient;
  chainId: number;
  tokenIn: Address;
  /** Amount of tokenIn to quote (default: 0.0001 ETH equivalent) */
  amountIn?: bigint;
}

interface QuoteResult {
  amountOut: bigint;
  fee: number;
}

async function queryBestQuote(
  publicClient: PublicClient,
  quoter: Address,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint
): Promise<QuoteResult | null> {
  const feeTiers = [...COMMON_FEE_TIERS] as number[];
  const results = await Promise.allSettled(
    feeTiers.map(async (fee) => {
      const result = await publicClient.readContract({
        address: quoter,
        abi: quoterAbi,
        functionName: "quoteExactInputSingle",
        args: [{ tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96: 0n }],
      });
      const amountOut = result[0] as bigint;
      return { amountOut, fee };
    })
  );

  const successful: QuoteResult[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      successful.push(r.value);
    }
  }

  if (successful.length === 0) return null;
  return successful.reduce((a, b) => (a.amountOut > b.amountOut ? a : b));
}

/**
 * Get token price in USD via tokenIn -> WETH -> USDC path.
 */
export async function getTokenPrice(
  params: GetTokenPriceParams
): Promise<TokenPriceResult | null> {
  const {
    publicClient,
    chainId,
    tokenIn,
    amountIn = parseEther("0.0001"),
  } = params;

  const chainConfig = getChainConfig(chainId);
  if (!chainConfig) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const { quoter } = chainConfig.contracts;
  const { usdc, weth } = chainConfig.tokens;

  if (tokenIn.toLowerCase() === usdc.toLowerCase()) {
    return { price: 1, fees: [0, 0] };
  }

  if (tokenIn.toLowerCase() === weth.toLowerCase()) {
    const wethToUsdc = await queryBestQuote(
      publicClient,
      quoter,
      weth,
      usdc,
      amountIn
    );
    if (!wethToUsdc) return null;

    const price = Number(formatUnits(wethToUsdc.amountOut, 6)) * 10000;
    return { price, fees: [0, wethToUsdc.fee] };
  }

  const [tokenToWeth, wethToUsdc] = await Promise.all([
    queryBestQuote(publicClient, quoter, tokenIn, weth, amountIn),
    queryBestQuote(publicClient, quoter, weth, usdc, parseEther("0.0001")),
  ]);

  if (!tokenToWeth || !wethToUsdc) return null;

  const wethPriceUsd = Number(formatUnits(wethToUsdc.amountOut, 6)) * 10000;
  const tokenToWethRatio =
    Number(formatUnits(tokenToWeth.amountOut, 18)) * 10000;
  const price = tokenToWethRatio * wethPriceUsd;

  return { price, fees: [tokenToWeth.fee, wethToUsdc.fee] };
}
