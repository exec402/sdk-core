import { decodeAbiParameters, parseAbiParameters } from "viem";
import type {
  PermitType,
  CallTaskPayload,
  TransferTaskPayload,
} from "../types";

/**
 * Convert permit type string to uint8 for contract call
 */
export function permitTypeToUint8(permitType: PermitType): number {
  switch (permitType) {
    case "eip3009":
      return 0;
    case "permit":
      return 1;
    case "permit2":
      return 2;
    default:
      throw new Error(`Unknown permit type: ${permitType}`);
  }
}

/**
 * Get task expiration time from permit data
 */
export function getTaskExpirationTime(permit: {
  permitType: PermitType;
  permitParams: `0x${string}`;
}): number {
  let deadline: bigint;

  switch (permit.permitType) {
    case "eip3009": {
      const eip3009Params = decodeAbiParameters(
        parseAbiParameters([
          "address", // owner
          "uint256", // value
          "uint256", // validAfter
          "uint256", // validBefore
          "bytes32", // nonce
        ]),
        permit.permitParams
      );
      deadline = eip3009Params[3]; // validBefore
      break;
    }
    case "permit": {
      const eip2612Params = decodeAbiParameters(
        parseAbiParameters([
          "address", // owner
          "address", // spender
          "uint256", // value
          "uint256", // nonce
          "uint256", // deadline
        ]),
        permit.permitParams
      );
      deadline = eip2612Params[4]; // deadline
      break;
    }
    case "permit2": {
      const permit2Params = decodeAbiParameters(
        parseAbiParameters([
          "address", // token
          "address", // owner
          "address", // spender
          "uint256", // amount
          "uint256", // nonce
          "uint256", // deadline
        ]),
        permit.permitParams
      );
      deadline = permit2Params[5]; // deadline
      break;
    }
    default:
      throw new Error(`Unknown permit type: ${permit.permitType}`);
  }

  return Number(deadline);
}

/**
 * Check if a task has expired based on its permit data
 */
export function isTaskExpired(permit: {
  permitType: PermitType;
  permitParams: `0x${string}`;
}): boolean {
  const expirationTime = getTaskExpirationTime(permit);
  return Date.now() / 1000 > expirationTime;
}

export function parseCallTaskPayload(payload: string): CallTaskPayload {
  return JSON.parse(payload) as CallTaskPayload;
}

export function parseTransferTaskPayload(payload: string): TransferTaskPayload {
  return JSON.parse(payload) as TransferTaskPayload;
}
