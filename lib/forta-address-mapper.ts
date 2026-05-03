/**
 * Map Forta alert addresses to BunkerMode graph node IDs.
 *
 * Forta hands us EVM contract addresses. Gyan's contagion graph speaks
 * node IDs (e.g. "rseth", "aave-v3", "lido"). The webhook needs to bridge
 * these two so it can:
 *   1. Look up which user wallets have exposure to the affected node
 *   2. Walk the contagion graph to surface downstream-exposed nodes
 */

import {
  ETH_TOKEN_CONTRACTS,
  PROTOCOL_RECEIPT_CONTRACTS,
} from "./known-contracts";
import { findContagionPaths, NODES } from "./contagion-graph";

const ADDR_TO_NODE: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const t of ETH_TOKEN_CONTRACTS) m.set(t.contract.toLowerCase(), t.nodeId);
  // Receipt tokens point at the protocol node (more useful than the token node)
  for (const r of PROTOCOL_RECEIPT_CONTRACTS) m.set(r.contract.toLowerCase(), r.protocolNodeId);
  return m;
})();

export function addressToNodeId(address: string): string | null {
  return ADDR_TO_NODE.get(address.toLowerCase()) ?? null;
}

/**
 * Map a Forta alert's address list to graph node IDs.
 * Unmapped addresses are dropped (logged at the call site).
 */
export function mapAddressesToNodeIds(addresses: string[]): string[] {
  const seen = new Set<string>();
  for (const a of addresses) {
    const id = addressToNodeId(a);
    if (id) seen.add(id);
  }
  return [...seen];
}

/**
 * For each directly-affected node, expand to downstream nodes via the
 * contagion BFS. The returned set is the union of all node IDs whose
 * holders should be alerted. `maxHops` defaults to 4 to match Gyan's
 * UI default.
 */
export function expandToDownstreamNodes(
  directNodeIds: string[],
  maxHops = 4,
  minWeight = 0.15,
): { nodeId: string; hops: number; weight: number; rootCause: string }[] {
  const out = new Map<string, { nodeId: string; hops: number; weight: number; rootCause: string }>();

  for (const root of directNodeIds) {
    // Always include the root itself at hops=0, weight=1
    out.set(root, { nodeId: root, hops: 0, weight: 1, rootCause: root });

    for (const r of findContagionPaths(root, maxHops)) {
      if (r.pathWeight < minWeight) continue;
      const existing = out.get(r.nodeId);
      if (!existing || r.pathWeight > existing.weight) {
        out.set(r.nodeId, {
          nodeId: r.nodeId,
          hops: r.hops,
          weight: r.pathWeight,
          rootCause: root,
        });
      }
    }
  }

  return [...out.values()].sort((a, b) => b.weight - a.weight);
}

export function nodeLabel(nodeId: string): string {
  return NODES.find((n) => n.id === nodeId)?.label ?? nodeId;
}
