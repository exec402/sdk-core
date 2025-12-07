import {
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
  type Address,
  type Hex,
} from "viem";

import type { Call, Replacement } from "../types";

export function buildCall(
  target: Address,
  callData: Hex,
  value: bigint = BigInt(0)
): Call {
  return { target, callData, value };
}

export function buildMulticallMessage(
  calls: Call[],
  fallbackRecipient: Address
): Hex {
  return encodeAbiParameters(
    parseAbiParameters("((address,bytes,uint256)[],address)"),
    [
      [
        calls.map((call) => [call.target, call.callData, call.value]),
        fallbackRecipient,
        // eslint-disable-next-line
      ] as any,
    ]
  );
}

export function buildTransferFromCall({
  token,
  from,
  to,
  amount,
}: {
  token: Address;
  from: Address;
  to: Address;
  amount: bigint;
}): Call {
  return buildCall(
    token,
    encodeFunctionData({
      abi: [
        {
          name: "transferFrom",
          type: "function",
          inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "transferFrom",
      args: [from, to, amount],
    })
  );
}

export function buildApproveCall({
  token,
  spender,
  amount,
}: {
  token: Address;
  spender: Address;
  amount: bigint;
}): Call {
  return buildCall(
    token,
    encodeFunctionData({
      abi: [
        {
          name: "approve",
          type: "function",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "approve",
      args: [spender, amount],
    })
  );
}

export function buildUniswapV3SwapCall({
  router,
  tokenIn,
  tokenOut,
  fee,
  recipient,
  amountIn,
  amountOutMinimum,
  sqrtPriceLimitX96,
}: {
  router: Address;
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
  recipient: Address;
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimitX96: bigint;
}): Call {
  return buildCall(
    router,
    encodeFunctionData({
      abi: [
        {
          name: "exactInputSingle",
          type: "function",
          inputs: [
            {
              name: "params",
              type: "tuple",
              components: [
                { name: "tokenIn", type: "address" },
                { name: "tokenOut", type: "address" },
                { name: "fee", type: "uint24" },
                { name: "recipient", type: "address" },
                { name: "amountIn", type: "uint256" },
                { name: "amountOutMinimum", type: "uint256" },
                { name: "sqrtPriceLimitX96", type: "uint160" },
              ],
            },
          ],
          outputs: [{ name: "amountOut", type: "uint256" }],
          stateMutability: "payable",
        },
      ],
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          fee,
          recipient,
          amountIn,
          amountOutMinimum,
          sqrtPriceLimitX96,
        },
      ],
    })
  );
}

export function buildMakeCallWithBalanceCall({
  multicallHandler,
  target,
  callData,
  value,
  replacements,
}: {
  multicallHandler: Address;
  target: Address;
  callData: Hex;
  value: bigint;
  replacements: Replacement[];
}) {
  return buildCall(
    multicallHandler,
    encodeFunctionData({
      abi: [
        {
          name: "makeCallWithBalance",
          type: "function",
          inputs: [
            { name: "target", type: "address" },
            { name: "callData", type: "bytes" },
            { name: "value", type: "uint256" },
            {
              name: "replacement",
              type: "tuple[]",
              components: [
                { name: "token", type: "address" },
                { name: "offset", type: "uint256" },
              ],
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "makeCallWithBalance",
      args: [target, callData, value, replacements],
    })
  );
}

export function buildDistributeTokenEvenlyCall({
  multicallHandler,
  token,
  recipients,
}: {
  multicallHandler: Address;
  token: Address;
  recipients: Address[];
}) {
  return buildCall(
    multicallHandler,
    encodeFunctionData({
      abi: [
        {
          name: "distributeTokenEvenly",
          type: "function",
          inputs: [
            { name: "token", type: "address" },
            { name: "recipients", type: "address[]" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "distributeTokenEvenly",
      args: [token, recipients],
    })
  );
}

export function buildDepositV3Call({
  spokePool,
  depositor,
  recipient,
  inputToken,
  outputToken,
  inputAmount,
  outputAmount,
  destinationChainId,
  exclusiveRelayer,
  quoteTimestamp,
  fillDeadline,
  exclusivityDeadline,
  message,
}: {
  spokePool: Address;
  depositor: Address;
  recipient: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: bigint;
  outputAmount: bigint;
  destinationChainId: bigint;
  exclusiveRelayer: Address;
  quoteTimestamp: number;
  fillDeadline: number;
  exclusivityDeadline: number;
  message: Hex;
}): Call {
  return buildCall(
    spokePool,
    encodeFunctionData({
      abi: [
        {
          name: "depositV3",
          type: "function",
          inputs: [
            { name: "depositor", type: "address" },
            { name: "recipient", type: "address" },
            { name: "inputToken", type: "address" },
            { name: "outputToken", type: "address" },
            { name: "inputAmount", type: "uint256" },
            { name: "outputAmount", type: "uint256" },
            { name: "destinationChainId", type: "uint256" },
            { name: "exclusiveRelayer", type: "address" },
            { name: "quoteTimestamp", type: "uint32" },
            { name: "fillDeadline", type: "uint32" },
            { name: "exclusivityDeadline", type: "uint32" },
            { name: "message", type: "bytes" },
          ],
          outputs: [],
          stateMutability: "payable",
        },
      ],
      functionName: "depositV3",
      args: [
        depositor,
        recipient,
        inputToken,
        outputToken,
        inputAmount,
        outputAmount,
        destinationChainId,
        exclusiveRelayer,
        quoteTimestamp,
        fillDeadline,
        exclusivityDeadline,
        message,
      ],
    })
  );
}
