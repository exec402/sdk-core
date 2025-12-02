import axios, { type AxiosInstance } from "axios";
import type { Signer, MultiNetworkSigner } from "x402/types";

import { withPaymentInterceptor } from "../x402/withPaymentInterceptor";
import { getCanisterUrl } from "../utils";
import type {
  CallParams,
  ExecNetwork,
  TransferParams,
  TaskResult,
  ListTasksOptions,
  TaskPage,
  RawTaskPage,
  RawCallRequest,
  RawTransferRequest,
  TaskCreationResponse,
  CanisterInfo,
  RawCanisterInfo,
  Task,
  RawTask,
} from "../types";

export interface ExecClientConfig {
  network: ExecNetwork;
  /** Signer for payment operations. Optional for read-only operations like getInfo/listTasks. */
  signer?: Signer | MultiNetworkSigner;
}

function transformCanisterInfo(raw: RawCanisterInfo): CanisterInfo {
  return {
    attestor: raw.attestor
      ? {
          address: raw.attestor.address,
          canisterId: raw.attestor.canister_id,
          moduleHash: raw.attestor.module_hash,
        }
      : null,
    chains: raw.chains.map((c) => ({
      chainId: c.chain_id,
      execCore: c.exec_core,
      network: c.network,
      rpcUrl: c.rpc_url,
    })),
    statistics: {
      lastUpdated: raw.statistics.last_updated,
      totalExecuted: raw.statistics.total_executed,
      totalExpired: raw.statistics.total_expired,
      totalTasksCreated: raw.statistics.total_tasks_created,
      pendingTasks: raw.statistics.pending_tasks,
    },
  };
}

function transformTask(raw: RawTask): Task {
  return {
    attestorSignature: raw.attestor_signature,
    createdAt: raw.created_at,
    description: raw.description,
    executor: raw.executor,
    payload: raw.payload,
    status: raw.status,
    chainId: raw.chain_id,
    taskId: raw.task_id,
    taskType: raw.task_type,
    updatedAt: raw.updated_at,
    url: raw.url,
    txHash: raw.tx_hash,
    blockNumber: raw.block_number,
  };
}

export class ExecClient {
  private readonly httpClient: AxiosInstance;
  private readonly signer?: Signer | MultiNetworkSigner;

  constructor(config: ExecClientConfig) {
    this.signer = config.signer;

    const canisterUrl = getCanisterUrl(config.network);

    const client = axios.create({
      baseURL: canisterUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add payment interceptor only if signer is provided
    this.httpClient = config.signer
      ? withPaymentInterceptor(client, config.signer)
      : client;
  }

  private requireSigner(): Signer | MultiNetworkSigner {
    if (!this.signer) {
      throw new Error(
        "Signer is required for this operation. Please provide a signer when creating ExecClient."
      );
    }
    return this.signer;
  }

  private getSignerAddress(): `0x${string}` {
    const signer = this.requireSigner() as {
      account?: { address?: string };
      address?: string;
    };
    const address = signer.account?.address || signer.address;
    if (!address) {
      throw new Error("Could not get signer address");
    }
    return address as `0x${string}`;
  }

  async getInfo(): Promise<CanisterInfo> {
    const res = await this.httpClient
      .get<{ data: RawCanisterInfo }>("/info")
      .then((res) => res.data.data);
    return transformCanisterInfo(res);
  }

  async call(params: CallParams): Promise<TaskResult> {
    const body: RawCallRequest = {
      target: params.target,
      data: params.data,
      amount: params.amount,
      initiator: this.getSignerAddress(),
      ...(params.chainId && { chain_id: params.chainId }),
      ...(params.token && { token: params.token }),
      ...(params.tokenName && { token_name: params.tokenName }),
      ...(params.version && { version: params.version }),
      ...(params.fee && { fee: params.fee }),
      ...(params.referrer && { referrer: params.referrer }),
      ...(params.description && { description: params.description }),
      ...(params.url && { url: params.url }),
      ...(params.resource && { resource: params.resource }),
      ...(params.authorizationType && {
        authorization_type: params.authorizationType,
      }),
    };

    const data = await this.httpClient
      .post<TaskCreationResponse>("/call", body)
      .then((res) => res.data.data);

    return {
      taskId: data.task_id,
      payer: data.payer,
    };
  }

  async transfer(params: TransferParams): Promise<TaskResult> {
    if (params.recipients.length !== params.amounts.length) {
      throw new Error(
        "Recipients and amounts arrays must have the same length"
      );
    }

    const body: RawTransferRequest = {
      recipients: params.recipients,
      amounts: params.amounts,
      initiator: this.getSignerAddress(),
      ...(params.chainId && { chain_id: params.chainId }),
      ...(params.token && { token: params.token }),
      ...(params.tokenName && { token_name: params.tokenName }),
      ...(params.version && { version: params.version }),
      ...(params.fee && { fee: params.fee }),
      ...(params.referrer && { referrer: params.referrer }),
      ...(params.description && { description: params.description }),
      ...(params.url && { url: params.url }),
      ...(params.resource && { resource: params.resource }),
      ...(params.authorizationType && {
        authorization_type: params.authorizationType,
      }),
    };

    const data = await this.httpClient
      .post<TaskCreationResponse>("/transfer", body)
      .then((res) => res.data.data);

    return {
      taskId: data.task_id,
      payer: data.payer,
    };
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await this.httpClient.get<RawTask>(`/tasks/${taskId}`);
    return transformTask(response.data);
  }

  async listTasks(options: ListTasksOptions = {}): Promise<TaskPage> {
    const params = new URLSearchParams();

    if (options.status) {
      params.append("status", options.status);
    }
    if (options.chainId !== undefined) {
      params.append("chain_id", options.chainId.toString());
    }
    if (options.offset !== undefined) {
      params.append("offset", options.offset.toString());
    }
    if (options.limit !== undefined) {
      params.append("limit", options.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/tasks?${queryString}` : "/tasks";

    const data = await this.httpClient
      .get<{ data: RawTaskPage }>(url)
      .then((res) => res.data.data);

    return {
      tasks: data.tasks.map(transformTask),
      total: data.total,
      nextOffset: data.next_offset,
    };
  }
}
