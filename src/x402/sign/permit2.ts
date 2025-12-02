import type { Chain, Hex, LocalAccount, Transport } from "viem";
import { getAddress } from "viem";
import { getNetworkId } from "../utils";
import { evm } from "x402/types";
import { permit2Abi } from "../../abis";

import { http, createPublicClient } from "viem";
import type { Address } from "viem";
import type {
  Permit2EvmPayloadAuthorization,
  PaymentRequirements,
} from "../types";

export const PERMIT2_ADDRESS =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

const MAX_PERMIT2_AMOUNT = (BigInt(1) << BigInt(160)) - BigInt(1);

export const permit2Types = {
  PermitTransferFrom: [
    { name: "permitted", type: "TokenPermissions" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
  TokenPermissions: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
};

async function checkPermit2Approval<
  transport extends Transport,
  chain extends Chain
>(
  walletClient: typeof evm.EvmSigner<chain, transport> | LocalAccount,
  {
    ownerAddress,
    tokenAddress,
    amount,
  }: {
    ownerAddress: Address;
    tokenAddress: Address;
    amount: string;
  }
): Promise<boolean> {
  try {
    if (!evm.isSignerWallet(walletClient)) {
      throw new Error(
        "Local account signing for permit2 requires a connected client"
      );
    }
    const publicClient = createPublicClient({
      chain: walletClient.chain,
      transport: http(),
    });
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          name: "allowance",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "allowance",
      args: [ownerAddress, PERMIT2_ADDRESS],
    });

    console.log("allowance", allowance);

    const hasApproval = (allowance as bigint) >= BigInt(amount);

    if (!hasApproval) {
      console.log(`\n⚠️  Permit2 is not approved for this token.`);
      console.log(`   Token: ${tokenAddress}`);
      console.log(`   Spender: ${PERMIT2_ADDRESS}`);
      console.log(`   Current allowance: ${allowance}`);
      console.log(`   Required amount: ${amount}`);
    }

    return hasApproval;
  } catch (error) {
    console.error("Error checking Permit2 approval:", error);
    return false;
  }
}

async function approvePermit2<transport extends Transport, chain extends Chain>(
  walletClient: typeof evm.EvmSigner<chain, transport> | LocalAccount,
  {
    tokenAddress,
  }: {
    tokenAddress: Address;
  }
): Promise<boolean> {
  try {
    console.log(`\n🔓 Approving Permit2 to spend tokens...`);
    console.log(`   Token: ${tokenAddress}`);
    console.log(`   Amount: max (unlimited)`);

    if (!evm.isSignerWallet(walletClient)) {
      throw new Error(
        "Local account signing for permit2 requires a connected client"
      );
    }

    const publicClient = createPublicClient({
      chain: walletClient.chain,
      transport: http(),
    });

    // Approve max uint256 for Permit2 (one-time approval)
    const tx = await walletClient.writeContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "approve",
      args: [PERMIT2_ADDRESS, MAX_PERMIT2_AMOUNT],
    });

    console.log(`   Transaction hash: ${tx}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

    if (receipt.status === "success") {
      console.log(`   ✅ Approval successful!`);
      console.log(`   Block: ${receipt.blockNumber}`);
      return true;
    } else {
      console.error(`   ❌ Approval transaction failed`);
      return false;
    }
    // eslint-disable-next-line
  } catch (error: any) {
    console.error(`\n❌ Error approving Permit2:`, error.message);
    return false;
  }
}

/**
 * Signs a Permit2 PermitTransferFrom authorization
 *
 * @param walletClient - The wallet client that will sign the permit
 * @param params - The permit2 parameters
 * @param params.owner - The address of the token owner
 * @param params.spender - The address authorized to transfer tokens
 * @param params.token - The address of the token to transfer
 * @param params.amount - The amount of tokens to transfer (in base units)
 * @param params.deadline - Unix timestamp after which the permit is no longer valid
 * @param paymentRequirements - The payment requirements containing network information
 * @param paymentRequirements.network - The network where the token exists
 * @returns The signature and nonce for the permit2
 */
export async function signPermit2<
  transport extends Transport,
  chain extends Chain
>(
  walletClient: typeof evm.EvmSigner<chain, transport> | LocalAccount,
  {
    owner,
    spender,
    token,
    amount,
    deadline,
  }: Omit<Permit2EvmPayloadAuthorization, "nonce">,
  { network }: PaymentRequirements
): Promise<{ signature: Hex; nonce: string }> {
  const chainId = getNetworkId(network);
  const tokenAddress = getAddress(token);
  const ownerAddress = getAddress(owner);
  const spenderAddress = getAddress(spender);

  const hasApproval = await checkPermit2Approval(walletClient, {
    ownerAddress,
    tokenAddress,
    amount,
  });

  console.log("hasApproval", hasApproval);

  // Generate a unique nonce for Permit2 SignatureTransfer
  const nonce = await createPermit2Nonce(walletClient, ownerAddress);

  // Permit2 uses a domain WITHOUT version field
  const data = {
    types: permit2Types,
    domain: {
      name: "Permit2",
      chainId,
      verifyingContract: PERMIT2_ADDRESS,
    },
    primaryType: "PermitTransferFrom" as const,
    message: {
      permitted: {
        token: tokenAddress,
        amount: BigInt(amount),
      },
      spender: spenderAddress,
      nonce,
      deadline: BigInt(deadline),
    },
  };

  // Debug logging
  console.log("\n🔍 Permit2 Signing Data:");
  console.log("Domain:", {
    name: data.domain.name,
    chainId: data.domain.chainId,
    verifyingContract: data.domain.verifyingContract,
  });
  console.log("Message:", {
    permitted: {
      token: tokenAddress,
      amount: amount,
    },
    spender: spenderAddress,
    nonce: nonce.toString(),
    deadline: deadline,
  });
  console.log("Owner:", ownerAddress);

  if (evm.isSignerWallet(walletClient)) {
    if (!hasApproval) {
      const approved = await approvePermit2(walletClient, {
        tokenAddress,
      });
      if (!approved) {
        throw new Error("Failed to approve Permit2");
      }
    }
    const signature = await walletClient.signTypedData(data);
    console.log("Signature:", signature);
    return {
      signature,
      nonce: nonce.toString(),
    };
  }

  // LocalAccount with signTypedData
  const account = walletClient as LocalAccount;
  if (account.signTypedData) {
    const signature = await account.signTypedData(data);
    return {
      signature,
      nonce: nonce.toString(),
    };
  }

  throw new Error(
    "Invalid wallet client provided does not support signTypedData"
  );
}

/**
 * Generates a unique nonce for Permit2 SignatureTransfer
 * Uses timestamp-based approach with nonceBitmap verification
 */
export async function createPermit2Nonce<
  transport extends Transport,
  chain extends Chain
>(
  walletClient: typeof evm.EvmSigner<chain, transport> | LocalAccount,
  ownerAddress: `0x${string}`
): Promise<bigint> {
  if (!evm.isSignerWallet(walletClient)) {
    throw new Error(
      "Local account signing for permit2 requires a connected client"
    );
  }

  // Generate a timestamp-based nonce for uniqueness
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const randomOffset = BigInt(Math.floor(Math.random() * 1000));
  let nonce = timestamp * BigInt(1000) + randomOffset;

  // Check if this nonce is already used
  try {
    const wordPos = nonce / BigInt(256);
    const bitIndex = nonce % BigInt(256);
    const bitmap = await walletClient.readContract({
      address: PERMIT2_ADDRESS,
      abi: permit2Abi,
      functionName: "nonceBitmap",
      args: [ownerAddress, wordPos],
    });

    // Check if the specific bit is set (nonce is used)
    const used = ((bitmap as bigint) >> bitIndex) & BigInt(1);
    if (used === BigInt(1)) {
      nonce += BigInt(1);
    }
  } catch (error) {
    console.warn(
      "Could not check nonce bitmap, using timestamp-based nonce:",
      error
    );
  }

  return nonce;
}
