import type { Chain } from "viem/chains";
import type { Network } from "../x402/network";

export interface DefaultAsset {
  address: `0x${string}`;
  name: string;
  decimals: number;
  authorizationType: "eip3009" | "permit" | "permit2";
}

export interface ChainConfig {
  chainId: number;
  network: Network;
  execCore: `0x${string}`;
  chain: Chain;
  defaultAsset: DefaultAsset;
}
