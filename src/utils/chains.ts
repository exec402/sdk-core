import type { ExecNetwork, ChainConfig } from "../types";
import { MAINNET_CHAINS, TESTNET_CHAINS } from "../constants";

export function getChainConfigs(network: ExecNetwork): ChainConfig[] {
  return network === "mainnet" ? MAINNET_CHAINS : TESTNET_CHAINS;
}

export function getAllChainConfigs(): ChainConfig[] {
  return [...MAINNET_CHAINS, ...TESTNET_CHAINS];
}

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return getAllChainConfigs().find((c) => c.chainId === chainId);
}

export function getChainConfigByNetworkAndChainId(
  network: ExecNetwork,
  chainId: number
): ChainConfig | undefined {
  return getChainConfigs(network).find((c) => c.chainId === chainId);
}

export function getChainConfigByNetwork(
  execNetwork: ExecNetwork,
  networkName: string
): ChainConfig | undefined {
  return getChainConfigs(execNetwork).find((c) => c.network === networkName);
}

export function getDefaultChainConfig(
  network: ExecNetwork
): ChainConfig | undefined {
  return getChainConfigs(network)[0];
}
