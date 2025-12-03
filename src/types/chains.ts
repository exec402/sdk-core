import type { Chain } from "viem/chains";
import type { Network } from "../x402/network";

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
  spokePool: `0x${string}`;
}

export interface ChainTokens {
  usdc: `0x${string}`;
  weth: `0x${string}`;
  exec?: `0x${string}`;
}

export interface ChainConfig {
  chainId: number;
  network: Network;
  chain: Chain;
  contracts: ChainContracts;
  tokens: ChainTokens;
  defaultAsset: DefaultAsset;
}
