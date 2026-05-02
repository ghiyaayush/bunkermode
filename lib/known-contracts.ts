// On-chain contracts mapped to graph node IDs
// Used to detect which protocols/tokens a wallet holds

export interface TokenContract {
  contract: string;   // checksummed EVM address
  nodeId: string;     // maps to GraphNode.id in contagion-graph.ts
  name: string;
  decimals: number;
  chain: "ethereum";
}

export interface ProtocolTokenContract extends TokenContract {
  protocolNodeId: string; // the protocol this receipt token represents
  description: string;
}

// ─── Direct ERC-20 tokens → token nodes ──────────────────────────────────────
export const ETH_TOKEN_CONTRACTS: TokenContract[] = [
  { contract: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", nodeId: "weth",   name: "WETH",   decimals: 18, chain: "ethereum" },
  { contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", nodeId: "usdc",   name: "USDC",   decimals: 6,  chain: "ethereum" },
  { contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7", nodeId: "usdt",   name: "USDT",   decimals: 6,  chain: "ethereum" },
  { contract: "0x6B175474E89094C44Da98b954EedeAC495271d0F", nodeId: "dai",    name: "DAI",    decimals: 18, chain: "ethereum" },
  { contract: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", nodeId: "steth",  name: "stETH",  decimals: 18, chain: "ethereum" },
  { contract: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", nodeId: "wsteth", name: "wstETH", decimals: 18, chain: "ethereum" },
  { contract: "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7", nodeId: "rseth",  name: "rsETH",  decimals: 18, chain: "ethereum" },
  { contract: "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee", nodeId: "weeth",  name: "weETH",  decimals: 18, chain: "ethereum" },
  { contract: "0xae78736Cd615f374D3085123A210448E74Fc6393", nodeId: "reth",   name: "rETH",   decimals: 18, chain: "ethereum" },
  { contract: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704", nodeId: "cbeth",  name: "cbETH",  decimals: 18, chain: "ethereum" },
  { contract: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", nodeId: "wbtc",   name: "WBTC",   decimals: 8,  chain: "ethereum" },
  { contract: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", nodeId: "uni",    name: "UNI",    decimals: 18, chain: "ethereum" },
  { contract: "0xD533a949740bb3306d119CC777fa900bA034cd52", nodeId: "crv",    name: "CRV",    decimals: 18, chain: "ethereum" },
  { contract: "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83", nodeId: "eigen",  name: "EIGEN",  decimals: 18, chain: "ethereum" },
];

// ─── Protocol receipt tokens → protocol nodes (Aave aTokens, Curve LP, etc.) ─
export const PROTOCOL_RECEIPT_CONTRACTS: ProtocolTokenContract[] = [
  // Aave V3 Ethereum aTokens — holding any = you have an Aave position
  { contract: "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8", nodeId: "aave-v3", protocolNodeId: "aave-v3", name: "aWETH (Aave V3)",   decimals: 18, chain: "ethereum", description: "Aave V3 WETH supply" },
  { contract: "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c", nodeId: "aave-v3", protocolNodeId: "aave-v3", name: "aUSDC (Aave V3)",   decimals: 6,  chain: "ethereum", description: "Aave V3 USDC supply" },
  { contract: "0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a", nodeId: "aave-v3", protocolNodeId: "aave-v3", name: "aUSDT (Aave V3)",   decimals: 6,  chain: "ethereum", description: "Aave V3 USDT supply" },
  { contract: "0x018008bfb33d285247A21d44E50697654f754e63", nodeId: "aave-v3", protocolNodeId: "aave-v3", name: "aDAI (Aave V3)",    decimals: 18, chain: "ethereum", description: "Aave V3 DAI supply" },
  { contract: "0x0B925eD163218f6662a35e0f0371Ac234f9E9371", nodeId: "aave-v3", protocolNodeId: "aave-v3", name: "awstETH (Aave V3)", decimals: 18, chain: "ethereum", description: "Aave V3 wstETH supply" },
  { contract: "0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8", nodeId: "aave-v3", protocolNodeId: "aave-v3", name: "aWBTC (Aave V3)",   decimals: 8,  chain: "ethereum", description: "Aave V3 WBTC supply" },
  { contract: "0xfA1fDbBD71B0aA16162D76914d69cD8CB3Ef92da", nodeId: "aave-v3", protocolNodeId: "aave-v3", name: "arsETH (Aave V3)",  decimals: 18, chain: "ethereum", description: "Aave V3 rsETH supply" },
  // Curve LP tokens
  { contract: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490", nodeId: "curve", protocolNodeId: "curve", name: "Curve 3pool LP",       decimals: 18, chain: "ethereum", description: "Curve USDC/USDT/DAI pool" },
  { contract: "0x06325440D014e39736583c165C2963BA99fAf14E", nodeId: "curve", protocolNodeId: "curve", name: "Curve stETH/ETH LP",   decimals: 18, chain: "ethereum", description: "Curve stETH/ETH pool" },
  { contract: "0x447Ddd4960d9fdBF6af9a790560d0AF76795CB08", nodeId: "curve", protocolNodeId: "curve", name: "Curve rETH/ETH LP",    decimals: 18, chain: "ethereum", description: "Curve rETH/ETH pool" },
  // Lido staking (stETH is also a staking receipt)
  { contract: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", nodeId: "lido", protocolNodeId: "lido", name: "stETH (Lido)",           decimals: 18, chain: "ethereum", description: "Lido staked ETH" },
  // EigenLayer restaking receipts
  { contract: "0x54945180dB7943c0ed0FEE7EdaB2Bd24620256bc", nodeId: "eigenlayer", protocolNodeId: "eigenlayer", name: "cbETH shares (EigenLayer)", decimals: 18, chain: "ethereum", description: "EigenLayer cbETH restake" },
];

// ─── Solana known SPL token mints ─────────────────────────────────────────────
export const SOL_TOKEN_MINTS: { mint: string; nodeId: string; name: string; decimals: number }[] = [
  { mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", nodeId: "msol",  name: "mSOL",  decimals: 9 },
  { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", nodeId: "usdc",  name: "USDC (Solana)", decimals: 6 },
  { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  nodeId: "usdt",  name: "USDT (Solana)", decimals: 6 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function detectChain(address: string): "ethereum" | "solana" | "unknown" {
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) return "ethereum";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return "solana";
  return "unknown";
}

export function formatBalance(raw: bigint, decimals: number): number {
  return Number(raw) / 10 ** decimals;
}

export const MIN_BALANCE_USD_EQUIV = 0.01; // ignore dust
