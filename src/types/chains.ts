import type { Chain } from "viem/chains";
import type { Network } from "../x402/network";

/** Chain type discriminator */
export type ChainType = "evm" | "solana";

export interface DefaultAsset {
  address: `0x${string}`;
  name: string;
  decimals: number;
  authorizationType: "eip3009" | "permit" | "permit2";
}

export interface ChainContracts {
  execCore: `0x${string}`;
  multicallHandler: `0x${string}`;
  quoter: `0x${string}`;
  swapRouter: `0x${string}`;
  spokePool?: `0x${string}`;
}

export interface ChainTokens {
  usdc: `0x${string}`;
  weth: `0x${string}`;
  exec?: `0x${string}`;
}

/** EVM chain configuration */
export interface ChainConfig {
  chainType: "evm";
  chainId: number;
  network: Network;
  chain: Chain;
  contracts: ChainContracts;
  tokens: ChainTokens;
  defaultAsset: DefaultAsset;
}

/** Union type for all chain configurations */
export type AnyChainConfig = ChainConfig;

/** Type guard to check if config is EVM */
export function isEvmChainConfig(
  config: AnyChainConfig,
): config is ChainConfig {
  return "chainType" in config && config.chainType === "evm";
}
