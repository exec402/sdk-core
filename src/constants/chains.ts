import type { ChainConfig } from "../types";
import { baseSepolia, optimismSepolia } from "viem/chains";

export const TESTNET_CHAINS: ChainConfig[] = [
  {
    chainId: 84532,
    network: "base-sepolia",
    chain: baseSepolia,
    contracts: {
      execCore: "0xffD8Be849210Bae704952A2fB2b11Ef4CC3D1b13",
      multicallHandler: "0x024aF0d1BCF4797c8707a8297dE2d7cD26373B72",
      quoter: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
      swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
      spokePool: "0x82B564983aE7274c86695917BBf8C99ECb6F0F8F",
    },
    tokens: {
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      weth: "0x4200000000000000000000000000000000000006",
      exec: "0x4e08C92B752777e0CcE1d38bFee75dC45aec5564",
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
      execCore: "0x70c8A59dEa4695cd9B61FE9fa63EbDC7A6f1323E",
      multicallHandler: "0x4e08C92B752777e0CcE1d38bFee75dC45aec5564",
      quoter: "0x0FBEa6cf957d95ee9313490050F6A0DA68039404",
      swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
      spokePool: "0x4e8E101924eDE233C13e2D8622DC8aED2872d505",
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
