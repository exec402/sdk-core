import type { ChainConfig } from "../types";
import { baseSepolia, optimismSepolia, bscTestnet, base } from "viem/chains";

export const TESTNET_CHAINS: ChainConfig[] = [
  {
    chainId: 84532,
    network: "base-sepolia",
    chain: baseSepolia,
    contracts: {
      execCore: "0xC71C6Ea33561063fBFAF8B93AF7562b248F3aAFd",
      multicallHandler: "0x024aF0d1BCF4797c8707a8297dE2d7cD26373B72",
      quoter: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
      swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
      spokePool: "0x82B564983aE7274c86695917BBf8C99ECb6F0F8F",
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
      execCore: "0x36a1983DadAaC1A293F18d1f6641C9296aB8F72c",
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
  {
    chainId: 97,
    network: "bsc-testnet",
    chain: bscTestnet,
    contracts: {
      execCore: "0x70c8A59dEa4695cd9B61FE9fa63EbDC7A6f1323E",
      multicallHandler: "0x4e08C92B752777e0CcE1d38bFee75dC45aec5564",
      quoter: "0xbC203d7f83677c7ed3F7acEc959963E7F4ECC5C2",
      swapRouter: "0x9a489505a00cE272eAa5e07Dba6491314CaE3796",
      spokePool: "0x0000000000000000000000000000000000000000",
    },
    tokens: {
      usdc: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
      weth: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
    },
    defaultAsset: {
      address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
      name: "USDT",
      decimals: 18,
      authorizationType: "permit2",
    },
  },
];

export const MAINNET_CHAINS: ChainConfig[] = [
  {
    chainId: 8453,
    network: "base",
    chain: base,
    contracts: {
      execCore: "0xaAaFd28c2Ef6488c740B1Ac1fd6BA096c69bdA2a",
      multicallHandler: "0xaa50d8a3d0158aBD34DFFBFe5c0251cf8C6d23b8",
      quoter: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
      swapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
      spokePool: "0x09aea4b2242abc8bb4bb78d537a67a245a7bec64",
    },
    tokens: {
      usdc: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      weth: "0x4200000000000000000000000000000000000006",
    },
    defaultAsset: {
      address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      name: "USDC",
      decimals: 6,
      authorizationType: "eip3009",
    },
  },
];
