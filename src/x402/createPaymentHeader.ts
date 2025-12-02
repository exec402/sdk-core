import type { Address, LocalAccount } from "viem";
import { evm } from "x402/types";

import { encodePayment } from "./utils";
import type { PaymentRequirements } from "./types";
import { signPaymentHeader, preparePaymentHeader } from "./sign";

export async function createPaymentHeader(
  client: typeof evm.EvmSigner | LocalAccount,
  x402Version: number,
  paymentRequirements: PaymentRequirements
): Promise<string> {
  const from: Address = evm.isSignerWallet(client)
    ? client.account!.address
    : client.address;

  const unsigned = preparePaymentHeader(from, x402Version, paymentRequirements);

  const signed = await signPaymentHeader(client, paymentRequirements, unsigned);

  return encodePayment(signed);
}

