import { type Address, type Hex } from "viem";

export interface Call {
  target: Address;
  callData: Hex;
  value: bigint;
}

export interface Replacement {
  token: Address; // address(0) for native ETH
  offset: bigint; // Byte offset in callData
}

export interface Instructions {
  calls: Call[];
  fallbackRecipient: Address;
}
