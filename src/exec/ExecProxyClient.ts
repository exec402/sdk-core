import axios from "axios";
import {
  getCanisterUrl,
  getChainConfigByNetworkAndChainId,
  getDefaultChainConfig,
} from "../utils";
import type {
  ExecNetwork,
  ChainConfig,
  CallParams,
  TransferParams,
  TaskResult,
  RawCallRequest,
  RawTransferRequest,
} from "../types";
import type { PaymentRequirements } from "../x402/types";

const X402_VERSION = 1;
const PAYMENT_HEADER = "x-payment";
const PAYMENT_RESPONSE_HEADER = "x-payment-response";

export interface ExecProxyClientConfig {
  network: ExecNetwork;
}

export interface PaymentRequirementsOptions {
  amount: string;
  resource: string;
  description?: string;
  chainId?: number;
  token?: `0x${string}`;
  tokenName?: string;
  authorizationType?: "eip3009" | "permit" | "permit2";
  version?: string;
  mimeType?: string;
  maxTimeoutSeconds?: number;
  outputSchema?: Record<string, unknown>;
}

export interface X402Response {
  x402Version: number;
  accepts: PaymentRequirements[];
}

export interface ForwardResult {
  data: TaskResult;
  /** x-payment-response header value (if present) */
  paymentResponseHeader?: string;
}

export interface ProxyCallParams extends CallParams {
  initiator: `0x${string}`;
}

export interface ProxyTransferParams extends TransferParams {
  initiator: `0x${string}`;
}

/**
 * ExecProxyClient - for server-side proxy scenarios
 *
 * Helps implement x402-compatible API endpoints that proxy requests to exec-canister.
 *
 * @example
 * ```typescript
 * import { ExecProxyClient } from "@exec402/core";
 * import { parseUnits } from "viem";
 *
 * const proxy = new ExecProxyClient({ network: "testnet" });
 *
 * // GET handler - return 402 + PaymentRequirements
 * export async function GET(request: Request) {
 *   const requirements = proxy.buildPaymentRequirements({
 *     amount: parseUnits("10", 6).toString(),
 *     resource: request.url,
 *     description: "Refuel 10 USDC",
 *     chainId: 84532,
 *   });
 *   return proxy.createPaymentRequiredResponse(requirements);
 * }
 *
 * // POST handler - forward to canister
 * export async function POST(request: Request) {
 *   const paymentHeader = proxy.getPaymentHeader(request.headers);
 *   if (!paymentHeader) {
 *     return GET(request);
 *   }
 *   const result = await proxy.forwardCall(callParams, paymentHeader);
 *   return Response.json(result.data);
 * }
 * ```
 */
export class ExecProxyClient {
  private readonly canisterUrl: string;
  private readonly network: ExecNetwork;

  constructor(config: ExecProxyClientConfig) {
    this.network = config.network;
    this.canisterUrl = getCanisterUrl(config.network);
  }

  getChainConfig(chainId: number): ChainConfig | undefined {
    return getChainConfigByNetworkAndChainId(this.network, chainId);
  }

  getDefaultChainConfig(): ChainConfig | undefined {
    return getDefaultChainConfig(this.network);
  }

  buildPaymentRequirements(
    options: PaymentRequirementsOptions
  ): PaymentRequirements[] {
    const chainId = options.chainId ?? this.getDefaultChainConfig()?.chainId;

    if (!chainId) {
      throw new Error("No chainId provided and no default chain configured");
    }

    const chain = this.getChainConfig(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const { defaultAsset } = chain;
    const token = options.token ?? defaultAsset.address;
    const tokenName = options.tokenName ?? defaultAsset.name;
    const authType =
      options.authorizationType ?? defaultAsset.authorizationType;
    // Permit2 always uses version "1", other authorization types default to "2"
    const tokenVersion =
      options.version ?? (authType === "permit2" ? "1" : "2");

    return [
      {
        scheme: "exact",
        network: chain.network,
        maxAmountRequired: options.amount,
        resource: options.resource,
        description: options.description ?? "",
        mimeType: options.mimeType ?? "application/json",
        payTo: chain.contracts.execCore,
        maxTimeoutSeconds: options.maxTimeoutSeconds ?? 300,
        asset: token,
        ...(options.outputSchema && { outputSchema: options.outputSchema }),
        extra: {
          name: tokenName,
          version: tokenVersion,
          authorizationType: authType,
        },
      },
    ];
  }

  createPaymentRequiredBody(
    paymentRequirements: PaymentRequirements[]
  ): X402Response {
    return {
      x402Version: X402_VERSION,
      accepts: paymentRequirements,
    };
  }

  createPaymentRequiredResponse(
    paymentRequirements: PaymentRequirements[],
    headers?: Record<string, string>
  ): Response {
    const body = this.createPaymentRequiredBody(paymentRequirements);

    return new Response(JSON.stringify(body), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": PAYMENT_RESPONSE_HEADER,
        ...headers,
      },
    });
  }

  async forwardCall(
    params: ProxyCallParams,
    paymentHeader: string
  ): Promise<ForwardResult> {
    const body: RawCallRequest = {
      target: params.target,
      data: params.data,
      amount: params.amount,
      initiator: params.initiator,
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

    const response = await axios.post(`${this.canisterUrl}/call`, body, {
      headers: {
        "Content-Type": "application/json",
        [PAYMENT_HEADER]: paymentHeader,
      },
    });

    return {
      data: {
        taskId: response.data.data.task_id,
        payer: response.data.data.payer,
      },
      paymentResponseHeader: response.headers[PAYMENT_RESPONSE_HEADER],
    };
  }

  async forwardTransfer(
    params: ProxyTransferParams,
    paymentHeader: string
  ): Promise<ForwardResult> {
    const body: RawTransferRequest = {
      recipients: params.recipients,
      amounts: params.amounts,
      initiator: params.initiator,
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

    const response = await axios.post(`${this.canisterUrl}/transfer`, body, {
      headers: {
        "Content-Type": "application/json",
        [PAYMENT_HEADER]: paymentHeader,
      },
    });

    return {
      data: {
        taskId: response.data.data.task_id,
        payer: response.data.data.payer,
      },
      paymentResponseHeader: response.headers[PAYMENT_RESPONSE_HEADER],
    };
  }

  hasPaymentHeader(headers: Headers | Record<string, string>): boolean {
    if (headers instanceof Headers) {
      return headers.has(PAYMENT_HEADER);
    }
    return PAYMENT_HEADER in headers || PAYMENT_HEADER.toLowerCase() in headers;
  }

  getPaymentHeader(headers: Headers | Record<string, string>): string | null {
    if (headers instanceof Headers) {
      return headers.get(PAYMENT_HEADER);
    }
    return (
      headers[PAYMENT_HEADER] ?? headers[PAYMENT_HEADER.toLowerCase()] ?? null
    );
  }

  getCanisterUrl(): string {
    return this.canisterUrl;
  }
}
