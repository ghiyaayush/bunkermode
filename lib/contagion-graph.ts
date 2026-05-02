// DeFi Contagion Graph — Protocol/Token/Bridge dependency map
// Built on the 11-Principle BunkerMode framework (v2)

export type NodeType = "protocol" | "token" | "bridge" | "dvn";
export type PoolArch = "shared" | "isolated" | "amm" | "staking" | "restaking";
export type Chain = "ethereum" | "solana" | "starknet";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  chain: Chain;
  riskLevel: RiskLevel;
  tvl?: number;
  poolArch?: PoolArch;
  tokenType?: "native" | "wrapped" | "lst" | "lrt" | "stablecoin" | "governance";
  dvnCount?: number;
  description?: string;
}

export type EdgeType =
  | "COLLATERAL_IN"
  | "LIQUIDITY_POOL"
  | "BRIDGED_VIA"
  | "SECURED_BY"
  | "DERIVED_FROM"
  | "YIELD_SOURCE";

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight?: number;
  label?: string;
}

export const NODES: GraphNode[] = [
  // Protocols (top 10)
  { id:"aave-v3",    label:"Aave V3",        type:"protocol", chain:"ethereum", poolArch:"shared",    riskLevel:"high",     tvl:12100, description:"Shared-pool lending. One bad collateral asset can lock ALL depositors. rsETH collapse locked WETH/USDC suppliers at 100% utilization." },
  { id:"morpho",     label:"Morpho",         type:"protocol", chain:"ethereum", poolArch:"isolated",  riskLevel:"low",      tvl:3200,  description:"Isolated markets. One bad asset only harms depositors in that specific market — everyone else is insulated." },
  { id:"sparklend",  label:"SparkLend",       type:"protocol", chain:"ethereum", poolArch:"isolated",  riskLevel:"low",      tvl:4700,  description:"Isolated + proactively removed rsETH 3 months early. Gained +$790M TVL during April 2026 crisis." },
  { id:"uniswap-v3", label:"Uniswap V3",      type:"protocol", chain:"ethereum", poolArch:"amm",       riskLevel:"medium",   tvl:5800,  description:"AMM DEX. Price manipulation on a pool propagates to any protocol using that price feed as an oracle." },
  { id:"curve",      label:"Curve Finance",   type:"protocol", chain:"ethereum", poolArch:"amm",       riskLevel:"medium",   tvl:2100,  description:"Stablecoin/LST AMM. rsETH/ETH pool collapse causes price impact here first — it's the first price signal (Layer 2)." },
  { id:"lido",       label:"Lido Finance",    type:"protocol", chain:"ethereum", poolArch:"staking",   riskLevel:"medium",   tvl:28000, description:"Largest liquid staking protocol. stETH depeg cascades into every protocol that uses it as collateral." },
  { id:"eigenlayer", label:"EigenLayer",      type:"protocol", chain:"ethereum", poolArch:"restaking", riskLevel:"high",     tvl:8900,  description:"Restaking layer. Slashing events propagate to all LRT tokens (rsETH, weETH) built on top." },
  { id:"orca",       label:"Orca",            type:"protocol", chain:"solana",   poolArch:"amm",       riskLevel:"medium",   tvl:780,   description:"Largest Solana DEX. Concentrated liquidity Whirlpool AMM." },
  { id:"kamino",     label:"Kamino Finance",  type:"protocol", chain:"solana",   poolArch:"isolated",  riskLevel:"low",      tvl:1400,  description:"Solana lending with isolated pools and automated yield strategies." },
  { id:"zklend",     label:"zkLend",          type:"protocol", chain:"starknet", poolArch:"isolated",  riskLevel:"medium",   tvl:120,   description:"Starknet's primary money market. All assets arrive via StarkGate ZK-proof bridge." },

  // Tokens (top 20)
  { id:"eth",          label:"ETH",            type:"token", chain:"ethereum", tokenType:"native",     riskLevel:"low",    description:"Native Ethereum. No bridge or collateral dependency risk. Safe exit destination (self-custody)." },
  { id:"weth",         label:"WETH",           type:"token", chain:"ethereum", tokenType:"wrapped",    riskLevel:"low",    description:"Wrapped ETH. Suppliers were locked in Aave when rsETH panic drove utilization to 100% — 7 hours before the official freeze." },
  { id:"usdc",         label:"USDC",           type:"token", chain:"ethereum", tokenType:"stablecoin", riskLevel:"low",    description:"Circle stablecoin. CCTP burn-and-mint bridge = no wrapped token risk. Priority-1 safe exit (Base via CCTP)." },
  { id:"usdt",         label:"USDT",           type:"token", chain:"ethereum", tokenType:"stablecoin", riskLevel:"medium", description:"Tether. Briefly depegged 0.3% during April 2026 crisis due to mass exit pressure." },
  { id:"dai",          label:"DAI/USDS",       type:"token", chain:"ethereum", tokenType:"stablecoin", riskLevel:"low",    description:"MakerDAO stablecoin. Diversified collateral basket — lower single-asset contagion risk." },
  { id:"steth",        label:"stETH",          type:"token", chain:"ethereum", tokenType:"lst",        riskLevel:"medium", description:"Lido liquid staked ETH. Largest LST — depeg cascades into Aave, Curve, Morpho simultaneously." },
  { id:"wsteth",       label:"wstETH",         type:"token", chain:"ethereum", tokenType:"lst",        riskLevel:"medium", description:"Wrapped stETH (non-rebasing). Most widely used DeFi collateral after WETH — any issue is systemic." },
  { id:"rseth",        label:"rsETH",          type:"token", chain:"ethereum", tokenType:"lrt",        riskLevel:"critical", description:"KelpDAO liquid restaking token. 1-of-1 LayerZero DVN led to $293M exploit (April 2026). Root cause of the cascade." },
  { id:"weeth",        label:"weETH",          type:"token", chain:"ethereum", tokenType:"lrt",        riskLevel:"high",   description:"ether.fi wrapped restaked ETH. Carries EigenLayer slashing risk + bridge risk." },
  { id:"reth",         label:"rETH",           type:"token", chain:"ethereum", tokenType:"lst",        riskLevel:"low",    description:"Rocket Pool staked ETH. Decentralised node operators — lower single-point-of-failure risk than Lido." },
  { id:"wbtc",         label:"WBTC",           type:"token", chain:"ethereum", tokenType:"wrapped",    riskLevel:"medium", description:"Wrapped Bitcoin. BitGo custodian risk. Large Aave collateral position — liquidation cascade risk." },
  { id:"cbeth",        label:"cbETH",          type:"token", chain:"ethereum", tokenType:"lst",        riskLevel:"medium", description:"Coinbase staked ETH. Centralised custodian risk." },
  { id:"sol",          label:"SOL",            type:"token", chain:"solana",   tokenType:"native",     riskLevel:"low",    description:"Native Solana asset." },
  { id:"msol",         label:"mSOL",           type:"token", chain:"solana",   tokenType:"lst",        riskLevel:"medium", description:"Marinade Finance staked SOL. Dominant Solana LST." },
  { id:"strk",         label:"STRK",           type:"token", chain:"starknet", tokenType:"governance", riskLevel:"medium", description:"Starknet governance and fee token." },
  { id:"eth-starknet", label:"ETH (Starknet)", type:"token", chain:"starknet", tokenType:"wrapped",    riskLevel:"low",    description:"ETH bridged to Starknet via StarkGate ZK-proof. Low bridge risk." },
  { id:"usdc-starknet",label:"USDC (Starknet)",type:"token", chain:"starknet", tokenType:"stablecoin", riskLevel:"low",    description:"USDC on Starknet via Circle + StarkGate." },
  { id:"uni",          label:"UNI",            type:"token", chain:"ethereum", tokenType:"governance", riskLevel:"low",    description:"Uniswap governance token." },
  { id:"crv",          label:"CRV",            type:"token", chain:"ethereum", tokenType:"governance", riskLevel:"high",   description:"Curve governance token. Used as Aave collateral — 2023 liquidation cascade nearly broke Curve founder's position." },
  { id:"eigen",        label:"EIGEN",          type:"token", chain:"ethereum", tokenType:"governance", riskLevel:"high",   description:"EigenLayer token. AVS operator slashing risk propagates here." },

  // Bridges
  { id:"layerzero", label:"LayerZero",    type:"bridge", chain:"ethereum", dvnCount:1,  riskLevel:"critical", description:"Cross-chain messaging. rsETH used 1-of-1 DVN config — one operator key = $293M exploit. Every token sharing this DVN is simultaneously at risk." },
  { id:"starkgate", label:"StarkGate",    type:"bridge", chain:"starknet", dvnCount:0,  riskLevel:"low",      description:"Starknet official bridge. ZK validity proofs — no DVN/oracle trust assumption. Mathematically verified." },
  { id:"wormhole",  label:"Wormhole",     type:"bridge", chain:"solana",   dvnCount:19, riskLevel:"medium",   description:"Solana/EVM bridge. 19 Guardian nodes, 13/19 threshold. Exploited $320M in Feb 2022." },
  { id:"cctp",      label:"Circle CCTP",  type:"bridge", chain:"ethereum", dvnCount:0,  riskLevel:"low",      description:"Circle native USDC bridge. Burn-and-mint — no wrapped token, no DVN. Priority-1 safe exit destination." },

  // DVNs
  { id:"dvn-layerzero", label:"LayerZero DVN (1/1)", type:"dvn", chain:"ethereum", riskLevel:"critical", description:"Single-operator DVN for rsETH cross-chain messages. One compromised key = entire bridge exploitable. Root cause of $293M KelpDAO hack." },
  { id:"dvn-wormhole",  label:"Wormhole Guardians",  type:"dvn", chain:"solana",   riskLevel:"medium",   description:"19 Guardian validators, 13/19 signing threshold. Multi-operator but a known, small validator set." },
];

export const EDGES: GraphEdge[] = [
  // rsETH exploit chain
  { source:"rseth",    target:"eigenlayer",    type:"DERIVED_FROM",  weight:5, label:"restaked on" },
  { source:"rseth",    target:"layerzero",     type:"BRIDGED_VIA",   weight:5, label:"1-of-1 DVN bridge" },
  { source:"layerzero",target:"dvn-layerzero", type:"SECURED_BY",    weight:5, label:"1-of-1 DVN" },
  { source:"rseth",    target:"aave-v3",       type:"COLLATERAL_IN", weight:5, label:"shared pool collateral" },
  { source:"rseth",    target:"curve",         type:"LIQUIDITY_POOL",weight:4, label:"rsETH/ETH pool" },
  { source:"rseth",    target:"morpho",        type:"COLLATERAL_IN", weight:2, label:"isolated market" },

  // Aave V3 shared pool
  { source:"weth",   target:"aave-v3", type:"COLLATERAL_IN", weight:4 },
  { source:"wsteth", target:"aave-v3", type:"COLLATERAL_IN", weight:4 },
  { source:"weeth",  target:"aave-v3", type:"COLLATERAL_IN", weight:4 },
  { source:"reth",   target:"aave-v3", type:"COLLATERAL_IN", weight:3 },
  { source:"wbtc",   target:"aave-v3", type:"COLLATERAL_IN", weight:3 },
  { source:"cbeth",  target:"aave-v3", type:"COLLATERAL_IN", weight:3 },
  { source:"usdc",   target:"aave-v3", type:"COLLATERAL_IN", weight:4 },
  { source:"usdt",   target:"aave-v3", type:"COLLATERAL_IN", weight:4 },
  { source:"dai",    target:"aave-v3", type:"COLLATERAL_IN", weight:3 },
  { source:"crv",    target:"aave-v3", type:"COLLATERAL_IN", weight:3 },

  // Morpho isolated markets
  { source:"wsteth", target:"morpho", type:"COLLATERAL_IN", weight:3 },
  { source:"weth",   target:"morpho", type:"COLLATERAL_IN", weight:3 },
  { source:"usdc",   target:"morpho", type:"COLLATERAL_IN", weight:3 },
  { source:"weeth",  target:"morpho", type:"COLLATERAL_IN", weight:3 },

  // SparkLend
  { source:"wsteth", target:"sparklend", type:"COLLATERAL_IN", weight:3 },
  { source:"weth",   target:"sparklend", type:"COLLATERAL_IN", weight:3 },
  { source:"usdc",   target:"sparklend", type:"COLLATERAL_IN", weight:3 },
  { source:"dai",    target:"sparklend", type:"COLLATERAL_IN", weight:3 },

  // Curve
  { source:"steth",  target:"curve", type:"LIQUIDITY_POOL", weight:4, label:"stETH/ETH pool" },
  { source:"wsteth", target:"curve", type:"LIQUIDITY_POOL", weight:3 },
  { source:"usdc",   target:"curve", type:"LIQUIDITY_POOL", weight:4, label:"3pool" },
  { source:"usdt",   target:"curve", type:"LIQUIDITY_POOL", weight:4, label:"3pool" },
  { source:"dai",    target:"curve", type:"LIQUIDITY_POOL", weight:4, label:"3pool" },
  { source:"crv",    target:"curve", type:"LIQUIDITY_POOL", weight:3 },

  // Uniswap V3
  { source:"weth", target:"uniswap-v3", type:"LIQUIDITY_POOL", weight:4 },
  { source:"usdc", target:"uniswap-v3", type:"LIQUIDITY_POOL", weight:4 },
  { source:"wbtc", target:"uniswap-v3", type:"LIQUIDITY_POOL", weight:3 },
  { source:"uni",  target:"uniswap-v3", type:"LIQUIDITY_POOL", weight:2 },

  // Lido
  { source:"steth",  target:"lido",      type:"DERIVED_FROM", weight:5, label:"issued by" },
  { source:"wsteth", target:"steth",     type:"DERIVED_FROM", weight:5, label:"wraps" },
  { source:"eth",    target:"lido",      type:"YIELD_SOURCE", weight:4, label:"staked into" },

  // EigenLayer
  { source:"weeth", target:"eigenlayer", type:"DERIVED_FROM", weight:5, label:"restaked on" },
  { source:"eigen", target:"eigenlayer", type:"DERIVED_FROM", weight:4, label:"issued by" },
  { source:"steth", target:"eigenlayer", type:"YIELD_SOURCE", weight:4, label:"restaked via" },

  // Solana
  { source:"sol",  target:"orca",        type:"LIQUIDITY_POOL", weight:4 },
  { source:"msol", target:"orca",        type:"LIQUIDITY_POOL", weight:3 },
  { source:"usdc", target:"orca",        type:"LIQUIDITY_POOL", weight:3 },
  { source:"sol",  target:"kamino",      type:"COLLATERAL_IN",  weight:3 },
  { source:"msol", target:"kamino",      type:"COLLATERAL_IN",  weight:3 },
  { source:"usdc", target:"kamino",      type:"COLLATERAL_IN",  weight:3 },
  { source:"msol", target:"sol",         type:"DERIVED_FROM",   weight:5, label:"staked SOL" },
  { source:"sol",  target:"wormhole",    type:"BRIDGED_VIA",    weight:3 },
  { source:"wormhole", target:"dvn-wormhole", type:"SECURED_BY", weight:3 },

  // Starknet
  { source:"eth-starknet",  target:"starkgate", type:"BRIDGED_VIA",   weight:3 },
  { source:"usdc-starknet", target:"starkgate", type:"BRIDGED_VIA",   weight:3 },
  { source:"eth-starknet",  target:"zklend",    type:"COLLATERAL_IN", weight:3 },
  { source:"usdc-starknet", target:"zklend",    type:"COLLATERAL_IN", weight:3 },
  { source:"strk",          target:"zklend",    type:"COLLATERAL_IN", weight:2 },

  // Safe exit route
  { source:"usdc", target:"cctp", type:"BRIDGED_VIA", weight:2, label:"native bridge (safe exit)" },
];

// ─── Contagion BFS ────────────────────────────────────────────────────────────

export interface ContagionResult {
  nodeId: string;
  hops: number;
  pathWeight: number;
  path: string[];
}

export function findContagionPaths(exploitedId: string, maxHops = 3): ContagionResult[] {
  const adj = new Map<string, { neighbor: string; weight: number }[]>();
  for (const e of EDGES) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push({ neighbor: e.target, weight: e.weight ?? 1 });
    if (e.type === "COLLATERAL_IN" || e.type === "LIQUIDITY_POOL") {
      adj.get(e.target)!.push({ neighbor: e.source, weight: (e.weight ?? 1) * 0.8 });
    }
  }

  const results = new Map<string, ContagionResult>();
  const best = new Map<string, number>();
  const queue: { id: string; hops: number; w: number; path: string[] }[] = [
    { id: exploitedId, hops: 0, w: 1, path: [] },
  ];

  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.hops > maxHops) continue;
    if (cur.id !== exploitedId) {
      if ((best.get(cur.id) ?? 0) >= cur.w) continue;
      best.set(cur.id, cur.w);
      results.set(cur.id, { nodeId: cur.id, hops: cur.hops, pathWeight: cur.w, path: [...cur.path, cur.id] });
    }
    for (const { neighbor, weight } of adj.get(cur.id) ?? []) {
      if (neighbor === exploitedId) continue;
      queue.push({ id: neighbor, hops: cur.hops + 1, w: cur.w * (weight / 5), path: [...cur.path, cur.id] });
    }
  }

  return [...results.values()].sort((a, b) => b.pathWeight - a.pathWeight);
}

export const CHAIN_COLORS: Record<Chain, string> = {
  ethereum: "#627EEA",
  solana:   "#9945FF",
  starknet: "#FF6B2B",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low:      "#22c55e",
  medium:   "#f59e0b",
  high:     "#ef4444",
  critical: "#7c3aed",
};

export const EDGE_COLORS: Record<EdgeType, string> = {
  COLLATERAL_IN:  "#ef4444",
  LIQUIDITY_POOL: "#f59e0b",
  BRIDGED_VIA:    "#8b5cf6",
  SECURED_BY:     "#ec4899",
  DERIVED_FROM:   "#06b6d4",
  YIELD_SOURCE:   "#22c55e",
};

export const EDGE_LABELS: Record<EdgeType, string> = {
  COLLATERAL_IN:  "Collateral In",
  LIQUIDITY_POOL: "Liquidity Pool",
  BRIDGED_VIA:    "Bridged Via",
  SECURED_BY:     "Secured By",
  DERIVED_FROM:   "Derived From",
  YIELD_SOURCE:   "Yield Source",
};
