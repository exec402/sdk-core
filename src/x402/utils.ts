import {
  SupportedEVMNetworks,
  SupportedSVMNetworks,
  EvmNetworkToChainId,
  SvmNetworkToChainId,
} from "./network";

import type { Network } from "./network";

import type { PaymentPayload, ExactEvmPayload, ExactSvmPayload } from "./types";

export function encodePayment(payment: PaymentPayload): string {
  let safe: PaymentPayload;

  // evm
  if (SupportedEVMNetworks.includes(payment.network)) {
    const evmPayload = payment.payload as ExactEvmPayload;

    // Convert bigint to string based on authorization type
    let processedPayload: ExactEvmPayload;

    if (evmPayload.authorizationType === "eip3009") {
      processedPayload = {
        ...evmPayload,
        authorization: {
          ...evmPayload.authorization,
          validAfter: evmPayload.authorization.validAfter.toString(),
          validBefore: evmPayload.authorization.validBefore.toString(),
        },
      };
    } else if (evmPayload.authorizationType === "permit") {
      processedPayload = {
        ...evmPayload,
        authorization: {
          ...evmPayload.authorization,
          deadline: evmPayload.authorization.deadline.toString(),
          nonce: evmPayload.authorization.nonce.toString(),
        },
      };
    } else {
      // permit2
      processedPayload = {
        ...evmPayload,
        authorization: {
          ...evmPayload.authorization,
          deadline: evmPayload.authorization.deadline.toString(),
          nonce: evmPayload.authorization.nonce.toString(),
        },
      };
    }

    safe = {
      ...payment,
      payload: processedPayload,
    };
    return safeBase64Encode(JSON.stringify(safe));
  }

  // svm
  if (SupportedSVMNetworks.includes(payment.network)) {
    safe = { ...payment, payload: payment.payload as ExactSvmPayload };
    return safeBase64Encode(JSON.stringify(safe));
  }

  throw new Error("Invalid network");
}

export function safeBase64Encode(data: string): string {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.btoa === "function"
  ) {
    return globalThis.btoa(data);
  }
  return Buffer.from(data).toString("base64");
}

/**
 * Converts a network name to its corresponding chain ID
 *
 * @param network - The network name to convert to a chain ID
 * @returns The chain ID for the specified network
 * @throws Error if the network is not supported
 */
export function getNetworkId(network: Network): number {
  if (EvmNetworkToChainId.has(network)) {
    return EvmNetworkToChainId.get(network)!;
  }
  if (SvmNetworkToChainId.has(network)) {
    return SvmNetworkToChainId.get(network)!;
  }
  throw new Error(`Unsupported network: ${network}`);
}

