import type { ChainConfig } from "../types";
import { baseSepolia, optimismSepolia } from "viem/chains";

export const TESTNET_CHAINS: ChainConfig[] = [
  {
    chainId: 84532,
    network: "base-sepolia",
    chain: baseSepolia,
    contracts: {
      execCore: "0x5907E41121448c6C0c89A022C1b16354196925Ec",
      multicallHandler: "0xCe2982F214236B7286313DCc8Bbb36A5eFa9eeF2",
      quoter: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
      swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    },
    tokens: {
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      weth: "0x4200000000000000000000000000000000000006",
    },
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
    chain: optimismSepolia,
    contracts: {
      execCore: "0x56474157CABab1f99E5C800C5805f73f31c71c9d",
      multicallHandler: "0x18574652852147d6445d3db18D0810D3E5f5241c",
      quoter: "0x0FBEa6cf957d95ee9313490050F6A0DA68039404",
      swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    },
    tokens: {
      usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      weth: "0x4200000000000000000000000000000000000006",
    },
    defaultAsset: {
      address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      name: "USDC",
      decimals: 6,
      authorizationType: "eip3009",
    },
  },
];

export const MAINNET_CHAINS: ChainConfig[] = [];
