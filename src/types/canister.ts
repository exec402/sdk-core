export interface CanisterChainInfo {
  chainId: number;
  execCore: string;
  network: string;
  rpcUrl: string;
}

export interface RawCanisterInfo {
  attestor: {
    address: string;
    canister_id: string;
    module_hash: string;
  } | null;
  chains: {
    chain_id: number;
    exec_core: string;
    network: string;
    rpc_url: string;
  }[];
  statistics: {
    last_updated: number;
    total_executed: number;
    total_expired: number;
    total_tasks_created: number;
    pending_tasks: number;
  };
}

export interface CanisterInfo {
  attestor: {
    address: string;
    canisterId: string;
    moduleHash: string;
  } | null;
  chains: CanisterChainInfo[];
  statistics: {
    lastUpdated: number;
    totalExecuted: number;
    totalExpired: number;
    totalTasksCreated: number;
    pendingTasks: number;
  };
}

export type ExecNetwork = "mainnet" | "testnet";
