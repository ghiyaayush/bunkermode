// Fetches on-chain positions from public RPCs — no API key required

import {
  ETH_TOKEN_CONTRACTS,
  PROTOCOL_RECEIPT_CONTRACTS,
  SOL_TOKEN_MINTS,
  formatBalance,
  type TokenContract,
  type ProtocolTokenContract,
} from "./known-contracts";

// Multiple public RPCs — tried in order, first successful response wins
const ETH_RPCS = [
  "https://cloudflare-eth.com",
  "https://ethereum.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
];
const SOL_RPC = "https://api.mainnet-beta.solana.com";
const CALL_TIMEOUT_MS = 8000;

export interface DetectedPosition {
  nodeId: string;       // graph node ID
  name: string;
  balance: number;      // human-readable
  rawBalance: string;   // hex
  isProtocol: boolean;  // true = protocol position, false = token holding
  description?: string;
}

// ─── Ethereum ────────────────────────────────────────────────────────────────

function encodeBalanceOf(holder: string): string {
  const selector = "70a08231";
  const param = holder.replace("0x", "").toLowerCase().padStart(64, "0");
  return "0x" + selector + param;
}

async function rpcPost(rpc: string, body: object): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json() as { result?: unknown; error?: unknown };
    if (json.error) return null;
    return json.result ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function ethCall(to: string, data: string): Promise<string | null> {
  for (const rpc of ETH_RPCS) {
    const result = await rpcPost(rpc, { jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] });
    if (result !== null) return result as string;
  }
  return null;
}

async function batchBalanceOf(
  contracts: (TokenContract | ProtocolTokenContract)[],
  holder: string
): Promise<Map<string, bigint>> {
  const data = encodeBalanceOf(holder);
  // Batch in groups of 10 to avoid rate limiting
  const results = new Map<string, bigint>();
  const chunks: (TokenContract | ProtocolTokenContract)[][] = [];
  for (let i = 0; i < contracts.length; i += 6) chunks.push(contracts.slice(i, i + 6));

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    if (ci > 0) await new Promise((r) => setTimeout(r, 120)); // avoid rate limit
    const calls = chunk.map((c) => ethCall(c.contract, data));
    const raw = await Promise.all(calls);
    raw.forEach((hex, i) => {
      if (hex && hex !== "0x" && hex !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        try {
          const bal = BigInt(hex);
          if (bal > 0n) results.set(chunk[i].contract.toLowerCase(), bal);
        } catch { /* skip malformed */ }
      }
    });
  }
  return results;
}

// ─── Native ETH balance ───────────────────────────────────────────────────────

async function fetchNativeEth(address: string): Promise<bigint> {
  for (const rpc of ETH_RPCS) {
    const result = await rpcPost(rpc, { jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] });
    if (result !== null) {
      try { return BigInt(result as string); } catch { continue; }
    }
  }
  return 0n;
}

export async function fetchEthereumPositions(address: string): Promise<DetectedPosition[]> {
  const [tokenBals, protocolBals, nativeEth] = await Promise.all([
    batchBalanceOf(ETH_TOKEN_CONTRACTS, address),
    batchBalanceOf(PROTOCOL_RECEIPT_CONTRACTS, address),
    fetchNativeEth(address),
  ]);

  const positions: DetectedPosition[] = [];
  const seenNodeIds = new Set<string>();

  // Native ETH
  const ethHuman = Number(nativeEth) / 1e18;
  if (ethHuman >= 0.0001) {
    positions.push({ nodeId: "eth", name: "ETH", balance: ethHuman, rawBalance: nativeEth.toString(), isProtocol: false });
    seenNodeIds.add("eth");
  }

  // Token holdings
  for (const t of ETH_TOKEN_CONTRACTS) {
    const bal = tokenBals.get(t.contract.toLowerCase());
    if (!bal) continue;
    const human = formatBalance(bal, t.decimals);
    if (human < 0.0001) continue;
    if (!seenNodeIds.has(t.nodeId)) {
      seenNodeIds.add(t.nodeId);
      positions.push({ nodeId: t.nodeId, name: t.name, balance: human, rawBalance: bal.toString(), isProtocol: false });
    }
  }

  // Protocol receipt tokens (aTokens, LP tokens)
  const protocolHoldings = new Map<string, { name: string; desc: string; balance: number }>();
  for (const p of PROTOCOL_RECEIPT_CONTRACTS) {
    const bal = protocolBals.get(p.contract.toLowerCase());
    if (!bal) continue;
    const human = formatBalance(bal, p.decimals);
    if (human < 0.0001) continue;
    const existing = protocolHoldings.get(p.protocolNodeId);
    if (!existing || human > existing.balance) {
      protocolHoldings.set(p.protocolNodeId, { name: p.name, desc: p.description ?? "", balance: human });
    }
  }
  for (const [nodeId, { name, desc, balance }] of protocolHoldings) {
    if (!seenNodeIds.has(nodeId)) {
      seenNodeIds.add(nodeId);
      positions.push({ nodeId, name, balance, rawBalance: "0", isProtocol: true, description: desc });
    }
  }

  return positions;
}

// ─── Solana ───────────────────────────────────────────────────────────────────

async function solRpc(method: string, params: unknown[]): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    const res = await fetch(SOL_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    });
    const json = await res.json();
    return json.result ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSolanaPositions(address: string): Promise<DetectedPosition[]> {
  const positions: DetectedPosition[] = [];

  const [balResult, tokenResult] = await Promise.all([
    solRpc("getBalance", [address]),
    solRpc("getTokenAccountsByOwner", [
      address,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed" },
    ]),
  ]);

  // Native SOL
  const lamports = (balResult as { value?: number } | null)?.value ?? 0;
  if (lamports > 1_000_000) { // > 0.001 SOL
    positions.push({ nodeId: "sol", name: "SOL", balance: lamports / 1e9, rawBalance: String(lamports), isProtocol: false });
  }

  // SPL tokens
  type ParsedAccount = { account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number; amount: string } } } } } };
  const tokenAccounts = ((tokenResult as { value?: ParsedAccount[] } | null)?.value) ?? [];
  for (const ta of tokenAccounts) {
    const info = ta.account?.data?.parsed?.info;
    if (!info) continue;
    const mint = info.mint;
    const uiAmount = info.tokenAmount?.uiAmount ?? 0;
    if (uiAmount < 0.0001) continue;
    const known = SOL_TOKEN_MINTS.find((m) => m.mint === mint);
    if (known) {
      positions.push({ nodeId: known.nodeId, name: known.name, balance: uiAmount, rawBalance: info.tokenAmount.amount, isProtocol: false });
    }
  }

  // mSOL → Marinade (which uses Orca pools)
  if (positions.some((p) => p.nodeId === "msol")) {
    positions.push({ nodeId: "orca", name: "Orca (via mSOL)", balance: 0, rawBalance: "0", isProtocol: true, description: "mSOL is traded on Orca pools" });
  }

  return positions;
}
