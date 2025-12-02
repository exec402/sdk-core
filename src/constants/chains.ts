import type { ChainConfig } from "../types";
import { baseSepolia, optimismSepolia } from "viem/chains";

export const TESTNET_CHAINS: ChainConfig[] = [
  {
    chainId: 84532,
    network: "base-sepolia",
    execCore: "0x5907E41121448c6C0c89A022C1b16354196925Ec",
    chain: baseSepolia,
    defaultAsset: {
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      name: "USDC",
      decimals: 6,
      authorizationType: "eip3009",
    },
  },
  {
    chainId: 11155420,
    network: "sepolia-optimism",
    execCore: "0x56474157CABab1f99E5C800C5805f73f31c71c9d",
    chain: optimismSepolia,
    defaultAsset: {
      address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      name: "USDC",
      decimals: 6,
      authorizationType: "eip3009",
    },
  },
];

export const MAINNET_CHAINS: ChainConfig[] = [];
