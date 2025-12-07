import type { AcrossQuoteParams, AcrossQuote, ExecNetwork } from "../types";
import { getChainConfig } from "./chains";

export async function getAcrossQuote({
  amount,
  sourceChainId,
  targetChainId,
  inputToken,
  outputToken,
  network = "mainnet",
}: AcrossQuoteParams): Promise<AcrossQuote> {
  const sourceChainConfig = getChainConfig(sourceChainId);
  const targetChainConfig = getChainConfig(targetChainId);

  if (!sourceChainConfig || !targetChainConfig) {
    throw new Error("Chain config not found");
  }

  if (!inputToken || !outputToken) {
    throw new Error("USDC token not configured for chain");
  }

  if (sourceChainId === targetChainId) {
    throw new Error("Source and target chain cannot be the same");
  }

  if (amount <= BigInt(0)) {
    throw new Error("Amount must be greater than 0");
  }

  const baseUrl =
    network === "mainnet"
      ? "https://app.across.to/api/suggested-fees"
      : "https://testnet.across.to/api/suggested-fees";
  const url = new URL(baseUrl);
  url.searchParams.set("originChainId", String(sourceChainId));
  url.searchParams.set("destinationChainId", String(targetChainId));
  url.searchParams.set("inputToken", inputToken);
  url.searchParams.set("outputToken", outputToken);
  url.searchParams.set("amount", amount.toString());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Across quote failed with status ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await res.json();

  const totalRelayFeePct = json.totalRelayFee?.pct as string | undefined;
  const timestampRaw = json.timestamp as string | undefined;
  const fillDeadlineRaw = json.fillDeadline as string | undefined;
  const exclusivityDeadlineRaw =
    (json.exclusivityDeadline as string | undefined) ?? "0";
  const exclusiveRelayerRaw =
    (json.exclusiveRelayer as string | undefined) ??
    "0x0000000000000000000000000000000000000000";

  if (
    !totalRelayFeePct ||
    timestampRaw === undefined ||
    fillDeadlineRaw === undefined
  ) {
    throw new Error("Unexpected Across quote response");
  }

  const relayFeePct = BigInt(totalRelayFeePct); // 1e18 = 100%
  const outputAmount =
    (amount * (BigInt(10) ** BigInt(18) - relayFeePct)) /
    BigInt(10) ** BigInt(18);

  return {
    outputAmount,
    quoteTimestamp: Number(timestampRaw),
    fillDeadline: Number(fillDeadlineRaw),
    exclusivityDeadline: Number(exclusivityDeadlineRaw),
    exclusiveRelayer: exclusiveRelayerRaw as `0x${string}`,
  };
}
