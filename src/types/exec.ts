import type { Task, RawTask, TaskStatus } from "./task";

export type AuthorizationType = "eip3009" | "permit" | "permit2";

export interface CallParams {
  chainId?: number;
  token?: `0x${string}`;
  tokenName?: string;
  version?: string;
  target: `0x${string}`;
  data: `0x${string}`;
  amount: string;
  fee?: string;
  referrer?: `0x${string}`;
  description?: string;
  url?: string;
  resource?: string;
  authorizationType?: AuthorizationType;
}

export interface TransferParams {
  chainId?: number;
  token?: `0x${string}`;
  tokenName?: string;
  version?: string;
  recipients: `0x${string}`[];
  amounts: string[];
  fee?: string;
  referrer?: `0x${string}`;
  description?: string;
  url?: string;
  resource?: string;
  authorizationType?: AuthorizationType;
}

export interface TaskResult {
  taskId: string;
  payer: string;
}

export interface ListTasksOptions {
  status?: TaskStatus;
  chainId?: number;
  initiator?: `0x${string}`;
  offset?: number;
  limit?: number;
}

export interface TaskPage {
  tasks: Task[];
  total: number;
  nextOffset: number | null;
}

export interface RawTaskPage {
  tasks: RawTask[];
  total: number;
  next_offset: number | null;
}

export interface RawCallRequest {
  chainId?: number;
  token?: string;
  tokenName?: string;
  version?: string;
  target: string;
  data: string;
  amount: string;
  initiator: string;
  fee?: string;
  referrer?: string;
  description?: string;
  url?: string;
  resource?: string;
  authorizationType?: string;
}

export interface RawTransferRequest {
  chainId?: number;
  token?: string;
  tokenName?: string;
  version?: string;
  recipients: string[];
  amounts: string[];
  initiator: string;
  fee?: string;
  referrer?: string;
  description?: string;
  url?: string;
  resource?: string;
  authorizationType?: string;
}

export interface TaskCreationResponse {
  ok: true;
  data: {
    payer: string;
    task_id: string;
  };
}

export interface ErrorResponse {
  ok: false;
  error: string;
}
