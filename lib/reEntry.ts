/**
 * P10 + Module C: Re-Entry Verification + Gate.
 *
 * v1 told you when to leave. v2 tells you when it's safe to come back.
 *
 * Three trust layers must be independently verified before BunkerMode
 * unlocks re-entry. Cream Finance got hit twice three months apart by
 * the same flash loan oracle exploit because nobody verified the fix.
 *
 *   Token Layer    - Whitelist reinstated with timelock, ERC-20 validated, real liquidity
 *   Price Layer    - TWAP 24h+, two feeds within 2%, deviation circuit breaker
 *   Governance Layer - 48-72h timelock, 4/7 multisig, all keys rotated, audit published
 *
 * The gate is NOT automatic on re-entry - humans must read the audit.
 * BunkerMode forces the question: has this actually been fixed, or am I
 * just assuming because time has passed?
 */

export type LayerState = "GREEN" | "YELLOW" | "RED";

export interface TokenLayerCheck {
  whitelistReinstated: boolean;
  whitelistTimelockHours: number;
  erc20Validated: boolean;
  hasFeeOnTransfer: boolean;
  hasHoneypot: boolean;
  realLiquidityUsd: number;
  liquiditySpreadAcrossPools: number;
  state: LayerState;
}

export interface PriceLayerCheck {
  twapWindowHours: number;
  feedsAgreeing: number;
  feedsWithinTolerance: boolean;
  deviationCircuitBreaker: boolean;
  state: LayerState;
}

export interface GovernanceLayerCheck {
  timelockHours: number;
  multisigM: number;
  multisigN: number;
  hasHardwareWallets: boolean;
  allKeysRotated: boolean;
  durableNoncePreSigningAllowed: boolean;
  auditPublishedUrl: string | null;
  state: LayerState;
}

export interface ReEntryStatus {
  protocol: string;
  blockedSince: Date;
  blockExpiresAt: Date | null;
  tokenLayer: TokenLayerCheck;
  priceLayer: PriceLayerCheck;
  governanceLayer: GovernanceLayerCheck;
  /** Cream double-hit protection: if a second exploit hits within 30 days, gate resets */
  secondaryExploitDetected: boolean;
  unlockable: boolean;
  reasoning: string[];
}

export function evaluateTokenLayer(
  c: Omit<TokenLayerCheck, "state">,
): TokenLayerCheck {
  let state: LayerState = "GREEN";
  if (!c.whitelistReinstated) state = "RED";
  else if (c.whitelistTimelockHours < 48) state = "YELLOW";
  if (!c.erc20Validated || c.hasFeeOnTransfer || c.hasHoneypot) state = "RED";
  if (c.realLiquidityUsd < 10_000_000) state = "RED";
  if (c.liquiditySpreadAcrossPools < 2) state = "YELLOW";
  return { ...c, state };
}

export function evaluatePriceLayer(c: Omit<PriceLayerCheck, "state">): PriceLayerCheck {
  let state: LayerState = "GREEN";
  if (c.twapWindowHours < 24) state = "RED";
  if (c.feedsAgreeing < 2 || !c.feedsWithinTolerance) state = "RED";
  if (!c.deviationCircuitBreaker) state = "YELLOW";
  return { ...c, state };
}

export function evaluateGovernanceLayer(
  c: Omit<GovernanceLayerCheck, "state">,
): GovernanceLayerCheck {
  let state: LayerState = "GREEN";
  if (c.timelockHours < 48) state = "RED";
  else if (c.timelockHours < 72) state = "YELLOW";
  if (c.multisigM < 4 || c.multisigN < 7) state = "RED";
  if (!c.hasHardwareWallets) state = "RED";
  if (!c.allKeysRotated) state = "RED";
  if (c.durableNoncePreSigningAllowed) state = "RED";
  if (!c.auditPublishedUrl) state = "RED";
  return { ...c, state };
}

export function evaluateReEntry(input: {
  protocol: string;
  blockedSince: Date;
  blockDurationDays?: number;
  tokenChecks: Omit<TokenLayerCheck, "state">;
  priceChecks: Omit<PriceLayerCheck, "state">;
  governanceChecks: Omit<GovernanceLayerCheck, "state">;
  secondaryExploitDetected?: boolean;
  now?: Date;
}): ReEntryStatus {
  const now = input.now ?? new Date();
  const blockDurationDays = input.blockDurationDays ?? 14;
  const blockExpiresAt = new Date(
    input.blockedSince.getTime() + blockDurationDays * 24 * 3600 * 1000,
  );

  const tokenLayer = evaluateTokenLayer(input.tokenChecks);
  const priceLayer = evaluatePriceLayer(input.priceChecks);
  const governanceLayer = evaluateGovernanceLayer(input.governanceChecks);

  const reasoning: string[] = [];
  let unlockable = true;

  // Hard gate: secondary exploit within 30 days resets the timer entirely
  if (input.secondaryExploitDetected) {
    unlockable = false;
    reasoning.push("Cream double-hit protection: secondary exploit detected within 30d. Gate reset.");
  }

  // Block period must have elapsed
  if (now.getTime() < blockExpiresAt.getTime()) {
    unlockable = false;
    reasoning.push(`Drained pool circuit breaker active until ${blockExpiresAt.toISOString()}.`);
  }

  // All three layers must be GREEN
  if (tokenLayer.state !== "GREEN") {
    unlockable = false;
    reasoning.push(`Token layer is ${tokenLayer.state}.`);
  }
  if (priceLayer.state !== "GREEN") {
    unlockable = false;
    reasoning.push(`Price layer is ${priceLayer.state}.`);
  }
  if (governanceLayer.state !== "GREEN") {
    unlockable = false;
    reasoning.push(`Governance layer is ${governanceLayer.state}.`);
  }

  if (unlockable) {
    reasoning.push("All three trust layers GREEN. Block period elapsed. Re-entry permitted on manual confirmation.");
  }

  return {
    protocol: input.protocol,
    blockedSince: input.blockedSince,
    blockExpiresAt,
    tokenLayer,
    priceLayer,
    governanceLayer,
    secondaryExploitDetected: input.secondaryExploitDetected ?? false,
    unlockable,
    reasoning,
  };
}

/**
 * Format a re-entry status as a Telegram-ready weekly digest.
 * Sent every 7 days post-T3 until the gate unlocks.
 */
export function formatReEntryDigest(status: ReEntryStatus, weekNumber: number): string {
  const flag = (s: LayerState) => (s === "GREEN" ? "OK" : s === "YELLOW" ? "WARN" : "BLOCKED");
  return `Week ${weekNumber} post-incident: ${status.protocol}

Timelock:  ${status.governanceLayer.timelockHours}h ${flag(status.governanceLayer.state)}
Oracle:    TWAP ${status.priceLayer.twapWindowHours}h ${flag(status.priceLayer.state)}
Multisig:  ${status.governanceLayer.multisigM}/${status.governanceLayer.multisigN} ${flag(status.governanceLayer.state)}
Liquidity: $${(status.tokenLayer.realLiquidityUsd / 1e6).toFixed(1)}M ${flag(status.tokenLayer.state)}
Audit:     ${status.governanceLayer.auditPublishedUrl ?? "not published"}

${status.unlockable ? "Gate UNLOCKABLE on manual confirmation." : "Gate LOCKED."}
Reasoning:
${status.reasoning.map((r) => `  - ${r}`).join("\n")}`;
}
