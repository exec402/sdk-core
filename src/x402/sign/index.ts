import type { Chain, LocalAccount, Transport, Address } from "viem";
import { signAuthorization, createNonce } from "./eip3009";
import { signPermit } from "./permit";
import { signPermit2 } from "./permit2";

import { evm } from "x402/types";

import type {
  UnsignedEip3009PaymentPayload,
  UnsignedPermitPaymentPayload,
  UnsignedPermit2PaymentPayload,
  Eip3009PaymentPayload,
  PermitPaymentPayload,
  Permit2PaymentPayload,
  PaymentRequirements,
} from "../types";

export async function signPaymentHeader<
  transport extends Transport,
  chain extends Chain
>(
  client: typeof evm.EvmSigner<chain, transport> | LocalAccount,
  paymentRequirements: PaymentRequirements,
  unsignedPaymentHeader:
    | UnsignedEip3009PaymentPayload
    | UnsignedPermit2PaymentPayload
    | UnsignedPermitPaymentPayload
): Promise<
  Eip3009PaymentPayload | PermitPaymentPayload | Permit2PaymentPayload
> {
  if (
    !paymentRequirements.extra?.authorizationType ||
    paymentRequirements.extra?.authorizationType === "eip3009"
  ) {
    const { signature } = await signAuthorization(
      client,
      (unsignedPaymentHeader as UnsignedEip3009PaymentPayload).payload
        .authorization,
      paymentRequirements
    );

    return {
      ...unsignedPaymentHeader,
      payload: {
        ...(unsignedPaymentHeader as UnsignedEip3009PaymentPayload).payload,
        signature,
      },
    };
  } else if (paymentRequirements.extra?.authorizationType === "permit") {
    const { owner, spender, value, deadline } = (
      unsignedPaymentHeader as UnsignedPermitPaymentPayload
    ).payload.authorization;

    const { signature, nonce } = await signPermit(
      client,
      { owner, spender, value, deadline },
      paymentRequirements
    );

    return {
      ...unsignedPaymentHeader,
      payload: {
        authorizationType: "permit",
        signature,
        authorization: {
          owner,
          spender,
          value,
          deadline,
          nonce: nonce.toString(),
        },
      },
    };
  } else if (paymentRequirements.extra?.authorizationType === "permit2") {
    const { owner, spender, token, amount, deadline } = (
      unsignedPaymentHeader as UnsignedPermit2PaymentPayload
    ).payload.authorization;

    const { signature, nonce } = await signPermit2(
      client,
      { owner, spender, token, amount, deadline },
      paymentRequirements
    );

    return {
      ...unsignedPaymentHeader,
      payload: {
        authorizationType: "permit2",
        signature,
        authorization: {
          owner,
          spender,
          token,
          amount,
          deadline,
          nonce,
        },
      },
    };
  } else {
    throw new Error("Unsupported authorization type");
  }
}

export function preparePaymentHeader(
  from: Address,
  x402Version: number,
  paymentRequirements: PaymentRequirements
):
  | UnsignedEip3009PaymentPayload
  | UnsignedPermitPaymentPayload
  | UnsignedPermit2PaymentPayload {
  if (
    !paymentRequirements.extra?.authorizationType ||
    paymentRequirements.extra?.authorizationType === "eip3009"
  ) {
    const nonce = createNonce();

    const validAfter = BigInt(
      Math.floor(Date.now() / 1000) - 600 // 10 minutes before
    ).toString();
    const validBefore = BigInt(
      Math.floor(Date.now() / 1000 + paymentRequirements.maxTimeoutSeconds)
    ).toString();

    return {
      x402Version,
      scheme: paymentRequirements.scheme,
      network: paymentRequirements.network,
      payload: {
        authorizationType: "eip3009" as const,
        signature: undefined,
        authorization: {
          from,
          to: paymentRequirements.payTo as Address,
          value: paymentRequirements.maxAmountRequired,
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };
  } else if (paymentRequirements.extra?.authorizationType === "permit") {
    const deadline = BigInt(
      Math.floor(Date.now() / 1000 + paymentRequirements.maxTimeoutSeconds)
    ).toString();

    return {
      x402Version,
      scheme: paymentRequirements.scheme,
      network: paymentRequirements.network,
      payload: {
        authorizationType: "permit" as const,
        signature: undefined,
        authorization: {
          owner: from,
          spender: paymentRequirements.payTo as Address,
          value: paymentRequirements.maxAmountRequired,
          deadline,
        },
      },
    };
  } else if (paymentRequirements.extra?.authorizationType === "permit2") {
    const deadline = BigInt(
      Math.floor(Date.now() / 1000 + paymentRequirements.maxTimeoutSeconds)
    ).toString();

    return {
      x402Version,
      scheme: paymentRequirements.scheme,
      network: paymentRequirements.network,
      payload: {
        authorizationType: "permit2" as const,
        signature: undefined,
        authorization: {
          owner: from,
          spender: paymentRequirements.payTo as Address,
          token: paymentRequirements.asset as Address,
          amount: paymentRequirements.maxAmountRequired,
          deadline,
        },
      },
    };
  } else {
    throw new Error("Unsupported authorization type");
  }
}

