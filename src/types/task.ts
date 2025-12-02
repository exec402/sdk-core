export type TaskStatus = "Pending" | "Executed" | "Expired";

export type TaskType = "Call" | "Transfer";

export type PermitType = "eip3009" | "permit" | "permit2";

export interface PermitData {
  permitType: PermitType;
  permitParams: `0x${string}`;
  signature: `0x${string}`;
}

export interface CallTaskPayload {
  token: `0x${string}`;
  target: `0x${string}`;
  data: `0x${string}`;
  amount: string;
  initiator: `0x${string}`;
  referrer: `0x${string}`;
  fee: string;
  permit: PermitData;
}

export interface TransferTaskPayload {
  token: `0x${string}`;
  recipients: `0x${string}`[];
  amounts: string[];
  initiator: `0x${string}`;
  referrer: `0x${string}`;
  fee: string;
  permit: PermitData;
}

export interface RawTask {
  attestor_signature: string | null;
  created_at: number;
  description: string;
  executor: string | null;
  payload: string;
  status: TaskStatus;
  chain_id: number;
  task_id: string;
  task_type: TaskType;
  updated_at: number;
  url: string | null;
  tx_hash: string | null;
  block_number: number | null;
}

export interface Task {
  attestorSignature: string | null;
  createdAt: number;
  description: string;
  executor: string | null;
  payload: string;
  status: TaskStatus;
  chainId: number;
  taskId: string;
  taskType: TaskType;
  updatedAt: number;
  url: string | null;
  txHash: string | null;
  blockNumber: number | null;
}
