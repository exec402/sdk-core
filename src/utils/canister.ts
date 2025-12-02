import type { ExecNetwork } from "../types";
import { CANISTER_IDS, ICP_DOMAIN } from "../constants";

export function getCanisterUrl(network: ExecNetwork): string {
  const canisterId = CANISTER_IDS[network];
  if (!canisterId) {
    throw new Error(`Canister ID not configured for network: ${network}`);
  }
  return `https://${canisterId}.${ICP_DOMAIN}`;
}
