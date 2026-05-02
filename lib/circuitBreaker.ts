/**
 * Drained Pool Circuit Breaker.
 *
 * After T3 fires, BunkerMode blocks the wallet from re-interacting with
 * the drained protocol for the duration of the lock-out window (default 14 days).
 *
 * Users frequently try to "arbitrage" distorted price ratios in drained pools
 * and lose more. The block requires explicit hardware wallet override to disable.
 *
 * The block list lives in the db (Wallet.metadata or a separate table); for
 * the hackathon we keep an in-memory cache plus persist to a JSON column on
 * the Event row.
 */

export interface BlockedProtocol {
  protocol: string;
  reason: string;
  blockedSince: Date;
  blockUntil: Date;
  /** SHA-256 of a hardware wallet signature, set when user manually overrides */
  overrideSig?: string;
}

const BLOCK_DURATION_DAYS = 14;

export function createBlockEntry(
  protocol: string,
  reason: string,
  now: Date = new Date(),
): BlockedProtocol {
  return {
    protocol,
    reason,
    blockedSince: now,
    blockUntil: new Date(now.getTime() + BLOCK_DURATION_DAYS * 24 * 3600 * 1000),
  };
}

export function isProtocolBlocked(
  blockList: BlockedProtocol[],
  protocol: string,
  now: Date = new Date(),
): boolean {
  return blockList.some(
    (b) =>
      b.protocol === protocol &&
      now.getTime() < b.blockUntil.getTime() &&
      !b.overrideSig,
  );
}

/**
 * If a second exploit hits the same protocol within 30 days of the first,
 * the gate resets - we re-block for the full duration. Cream Finance
 * protection.
 */
export function recheckOnSecondaryExploit(
  block: BlockedProtocol,
  newExploitAt: Date,
): BlockedProtocol {
  const daysBetween =
    (newExploitAt.getTime() - block.blockedSince.getTime()) / (24 * 3600 * 1000);
  if (daysBetween > 30) return block;
  return {
    ...block,
    blockedSince: newExploitAt,
    blockUntil: new Date(newExploitAt.getTime() + BLOCK_DURATION_DAYS * 24 * 3600 * 1000),
    reason: `${block.reason} (Cream protection: secondary exploit within 30d, gate reset)`,
    overrideSig: undefined, // any prior override is invalidated
  };
}

export function applyHardwareOverride(
  block: BlockedProtocol,
  hardwareSig: string,
): BlockedProtocol {
  return { ...block, overrideSig: hardwareSig };
}

/**
 * In-memory cache for the demo. Production version queries db.
 */
const inMemoryBlockList = new Map<string, BlockedProtocol[]>();

export function addBlock(walletAddress: string, block: BlockedProtocol): void {
  const list = inMemoryBlockList.get(walletAddress) ?? [];
  list.push(block);
  inMemoryBlockList.set(walletAddress, list);
}

export function getBlocks(walletAddress: string): BlockedProtocol[] {
  return inMemoryBlockList.get(walletAddress) ?? [];
}

export function clearBlocks(walletAddress: string): void {
  inMemoryBlockList.delete(walletAddress);
}
