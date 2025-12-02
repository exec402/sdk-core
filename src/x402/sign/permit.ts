import type { Chain, Hex, LocalAccount, Transport } from "viem";
import { getAddress } from "viem";
import { getNetworkId } from "../utils";
import { evm } from "x402/types";

import { http, createPublicClient } from "viem";

import type {
  PermitEvmPayloadAuthorization,
  PaymentRequirements,
} from "../types";
import { erc20PermitAbi } from "../abis/erc20PermitAbi";

export const permitTypes = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export async function signPermit<
  transport extends Transport,
  chain extends Chain
>(
  walletClient: typeof evm.EvmSigner<chain, transport> | LocalAccount,
  {
    owner,
    spender,
    value,
    deadline,
  }: Omit<PermitEvmPayloadAuthorization, "nonce">,
  { asset, network, extra }: PaymentRequirements
): Promise<{ signature: Hex; nonce: string }> {
  const chainId = getNetworkId(network);
  const tokenAddress = getAddress(asset);

  // Get the current nonce for the owner
  let nonce: bigint;
  let name: string;
  const version: string = extra?.version ?? "1";

  if (evm.isSignerWallet(walletClient)) {
    const publicClient = createPublicClient({
      chain: walletClient.chain,
      transport: http(),
    });

    [nonce, name] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20PermitAbi,
        functionName: "nonces",
        args: [getAddress(owner)],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20PermitAbi,
        functionName: "name",
      }) as Promise<string>,
    ]);
  } else {
    throw new Error(
      "Local account signing for permit requires a connected client"
    );
  }

  const data = {
    types: permitTypes,
    domain: {
      name,
      version,
      chainId,
      verifyingContract: tokenAddress,
    },
    primaryType: "Permit" as const,
    message: {
      owner: getAddress(owner),
      spender: getAddress(spender),
      value,
      nonce,
      deadline,
    },
  };

  let signature: Hex;

  if (evm.isSignerWallet(walletClient)) {
    signature = await walletClient.signTypedData(data);

    return {
      signature,
      nonce: nonce.toString(),
    };
  }

  // LocalAccount with signTypedData
  const account = walletClient as LocalAccount;
  if (account.signTypedData) {
    signature = await account.signTypedData(data);

    return {
      signature,
      nonce: nonce.toString(),
    };
  }

  throw new Error(
    "Invalid wallet client provided does not support signTypedData"
  );
}

