import axios, { type AxiosInstance } from "axios";
import type { Hash, PublicClient } from "viem";
import { encodeFunctionData, formatEther } from "viem";
import type { Signer, MultiNetworkSigner } from "x402/types";

import { withPaymentInterceptor } from "../x402/withPaymentInterceptor";
import {
  getCanisterUrl,
  permitTypeToUint8,
  getChainConfigByNetworkAndChainId,
  getChainConfig,
  parseCallTaskPayload,
  parseTransferTaskPayload,
  getTokenPrice,
} from "../utils";

import { execCoreAbi } from "../abis/execCoreAbi";
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
  private readonly network: ExecNetwork;

  constructor(config: ExecClientConfig) {
    this.signer = config.signer;
    this.network = config.network;

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
    const data = await this.httpClient
      .get<{ data: RawTask }>(`/tasks/${taskId}`)
      .then((res) => res.data.data)
      .catch((err) => {
        if (err.response?.status === 404) {
          return {
            attestor_signature: null,
            created_at: 0,
            description: "",
            executor: null,
            payload: "{}",
            status: "Expired" as Task["status"],
            chain_id: 0,
            task_id: "",
            task_type: "Call" as Task["taskType"],
            updated_at: 0,
            url: null,
            tx_hash: null,
            block_number: null,
          };
        }
        throw err;
      });
    return transformTask(data);
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

  private requireWritableSigner(): {
    writeContract(args: unknown): Promise<Hash>;
  } {
    const signer = this.requireSigner();
    if (
      typeof (signer as { writeContract?: unknown }).writeContract !==
      "function"
    ) {
      throw new Error(
        "Signer must have writeContract method for executor operations. Use a viem WalletClient as signer."
      );
    }
    return signer as unknown as { writeContract(args: unknown): Promise<Hash> };
  }

  private getExecCore(chainId: number): `0x${string}` {
    const chainConfig = getChainConfigByNetworkAndChainId(
      this.network,
      chainId
    );
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not found in ${this.network}`);
    }
    return chainConfig.contracts.execCore;
  }

  /**
   * Execute a call task on the ExecCore contract
   *
   * @param task - Task to execute
   * @param payload - Parsed call task payload
   * @returns Transaction hash
   */
  async executeCall(task: Task): Promise<Hash> {
    const signer = this.requireWritableSigner();
    const execCore = this.getExecCore(task.chainId);

    if (!task.attestorSignature) {
      throw new Error("Task does not have attestor signature");
    }

    const payload = parseCallTaskPayload(task.payload);

    return signer.writeContract({
      address: execCore,
      abi: execCoreAbi,
      functionName: "call",
      args: [
        task.taskId as `0x${string}`,
        payload.token,
        payload.target,
        payload.data,
        BigInt(payload.amount),
        payload.initiator,
        payload.referrer,
        BigInt(payload.fee),
        {
          permitType: permitTypeToUint8(payload.permit.permitType),
          permitParams: payload.permit.permitParams,
          signature: payload.permit.signature,
        },
        task.attestorSignature as `0x${string}`,
      ],
    });
  }

  /**
   * Execute a transfer task on the ExecCore contract
   *
   * @param task - Task to execute
   * @param payload - Parsed transfer task payload
   * @returns Transaction hash
   */
  async executeTransfer(task: Task): Promise<Hash> {
    const signer = this.requireWritableSigner();
    const execCore = this.getExecCore(task.chainId);

    if (!task.attestorSignature) {
      throw new Error("Task does not have attestor signature");
    }

    const payload = parseTransferTaskPayload(task.payload);

    return signer.writeContract({
      address: execCore,
      abi: execCoreAbi,
      functionName: "transfer",
      args: [
        task.taskId as `0x${string}`,
        payload.token,
        payload.recipients,
        payload.amounts.map((a) => BigInt(a)),
        payload.initiator,
        payload.referrer,
        BigInt(payload.fee),
        {
          permitType: permitTypeToUint8(payload.permit.permitType),
          permitParams: payload.permit.permitParams,
          signature: payload.permit.signature,
        },
        task.attestorSignature as `0x${string}`,
      ],
    });
  }

  /**
   * Check if a task has been executed on the ExecCore contract
   */
  async isTaskExecuted(
    publicClient: PublicClient,
    chainId: number,
    taskId: `0x${string}`
  ): Promise<boolean> {
    const execCore = this.getExecCore(chainId);
    return publicClient.readContract({
      address: execCore,
      abi: execCoreAbi,
      functionName: "executed",
      args: [taskId],
    });
  }

  /**
   * Get the chain config for the specified chainId
   */
  getChainConfig(chainId: number) {
    return getChainConfig(chainId);
  }

  /**
   * Estimate the transaction fee in USD for executing a task.
   * Useful for executors to determine if a task is profitable.
   *
   * @param publicClient - Viem PublicClient instance
   * @param task - Task to estimate fee for
   * @param executor - Executor address to simulate the transaction from
   * @returns Estimated fee in USD, or null if estimation fails
   *
   * @example
   * ```ts
   * const feeUsd = await execClient.estimateTxFee(publicClient, task, '0x...');
   * const reward = parseFloat(task.payload.fee);
   * if (feeUsd && reward > feeUsd) {
   *   // Profitable, execute the task
   * }
   * ```
   */
  async estimateTxFee(
    publicClient: PublicClient,
    task: Task,
    executor: `0x${string}`
  ): Promise<number | null> {
    const execCore = this.getExecCore(task.chainId);
    const chainConfig = getChainConfig(task.chainId);

    if (!chainConfig || !task.attestorSignature) {
      return null;
    }

    const { weth } = chainConfig.tokens;

    // Build the call data based on task type
    let callData: `0x${string}`;

    if (task.taskType === "Call") {
      const payload = parseCallTaskPayload(task.payload);

      callData = encodeFunctionData({
        abi: execCoreAbi,
        functionName: "call",
        args: [
          task.taskId as `0x${string}`,
          payload.token,
          payload.target,
          payload.data,
          BigInt(payload.amount),
          payload.initiator,
          payload.referrer,
          BigInt(payload.fee),
          {
            permitType: permitTypeToUint8(payload.permit.permitType),
            permitParams: payload.permit.permitParams,
            signature: payload.permit.signature,
          },
          task.attestorSignature as `0x${string}`,
        ],
      });
    } else {
      const payload = parseTransferTaskPayload(task.payload);
      callData = encodeFunctionData({
        abi: execCoreAbi,
        functionName: "transfer",
        args: [
          task.taskId as `0x${string}`,
          payload.token,
          payload.recipients,
          payload.amounts.map((a) => BigInt(a)),
          payload.initiator,
          payload.referrer,
          BigInt(payload.fee),
          {
            permitType: permitTypeToUint8(payload.permit.permitType),
            permitParams: payload.permit.permitParams,
            signature: payload.permit.signature,
          },
          task.attestorSignature as `0x${string}`,
        ],
      });
    }

    // Estimate gas and get gas price
    const [gasEstimate, gasPrice] = await Promise.all([
      publicClient.estimateGas({
        account: executor,
        to: execCore,
        data: callData,
      }),
      publicClient.getGasPrice(),
    ]);

    const estimatedFee = gasEstimate * gasPrice;
    const estimatedFeeInEth = Number(formatEther(estimatedFee));

    // Get ETH price in USD
    const ethPrice = await getTokenPrice({
      publicClient,
      chainId: task.chainId,
      tokenIn: weth,
    });

    if (!ethPrice) {
      return null;
    }

    return estimatedFeeInEth * ethPrice.price;
  }
}
