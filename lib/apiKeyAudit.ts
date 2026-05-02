/**
 * API Key Audit (v2 addition to P11).
 *
 * API keys with withdrawal permissions are equivalent to private keys from
 * a security standpoint. The monthly audit prompts a review of all API
 * integrations. Any with unnecessary withdrawal permissions get flagged
 * for revocation.
 *
 * This catches the class of attacks where a compromised API key on a
 * trading bot becomes the entry point for a portfolio drain.
 */

export type ApiPermission = "read" | "trade" | "withdraw" | "transfer" | "futures" | "margin";

export interface ApiKeyEntry {
  service: string; // "binance" | "bybit" | "okx" | "self-hosted" | etc
  label: string; // user-assigned label
  createdAt: Date;
  lastUsed: Date | null;
  permissions: ApiPermission[];
  ipWhitelist: string[];
  hasWithdrawalEnabled: boolean;
  /** is this key tied to a service the user can't recall using recently? */
  appearsForgotten: boolean;
}

export interface ApiKeyRiskFinding {
  key: ApiKeyEntry;
  riskScore: number; // 0..100
  flags: string[];
  recommendation: "REVOKE_IMMEDIATELY" | "REVOKE" | "REDUCE_PERMISSIONS" | "MONITOR" | "OK";
}

export function auditApiKey(key: ApiKeyEntry, now: Date = new Date()): ApiKeyRiskFinding {
  const flags: string[] = [];
  let score = 0;

  if (key.hasWithdrawalEnabled) {
    flags.push("Withdrawal permission enabled. Equivalent to private key exposure.");
    score += 50;
  }
  if (key.permissions.includes("withdraw") || key.permissions.includes("transfer")) {
    flags.push("Withdrawal/transfer permission scope on the key.");
    score += 25;
  }
  if (key.permissions.includes("futures") || key.permissions.includes("margin")) {
    flags.push("Leverage permissions enabled. Drain via shorting at extreme size is possible.");
    score += 15;
  }
  if (key.ipWhitelist.length === 0) {
    flags.push("No IP whitelist configured. Any IP can use this key.");
    score += 20;
  }

  const ageDays = (now.getTime() - key.createdAt.getTime()) / (24 * 3600 * 1000);
  if (ageDays > 365) {
    flags.push(`Key is ${Math.floor(ageDays / 30)} months old. Rotation overdue.`);
    score += 10;
  }

  const idleDays = key.lastUsed
    ? (now.getTime() - key.lastUsed.getTime()) / (24 * 3600 * 1000)
    : Infinity;
  if (key.appearsForgotten || idleDays > 90) {
    flags.push(
      key.appearsForgotten
        ? "User does not recall using this key recently."
        : `Key idle for ${Math.floor(idleDays)} days.`,
    );
    score += 30;
  }

  let recommendation: ApiKeyRiskFinding["recommendation"];
  if (score >= 80) recommendation = "REVOKE_IMMEDIATELY";
  else if (score >= 60) recommendation = "REVOKE";
  else if (score >= 30) recommendation = "REDUCE_PERMISSIONS";
  else if (score >= 10) recommendation = "MONITOR";
  else recommendation = "OK";

  return { key, riskScore: Math.min(score, 100), flags, recommendation };
}

export function summarizeAudit(findings: ApiKeyRiskFinding[]): {
  total: number;
  revokeImmediately: number;
  revoke: number;
  reduce: number;
  monitor: number;
  ok: number;
  headline: string;
} {
  const counts = {
    revokeImmediately: 0,
    revoke: 0,
    reduce: 0,
    monitor: 0,
    ok: 0,
  };
  for (const f of findings) {
    if (f.recommendation === "REVOKE_IMMEDIATELY") counts.revokeImmediately++;
    else if (f.recommendation === "REVOKE") counts.revoke++;
    else if (f.recommendation === "REDUCE_PERMISSIONS") counts.reduce++;
    else if (f.recommendation === "MONITOR") counts.monitor++;
    else counts.ok++;
  }
  const headline =
    counts.revokeImmediately > 0
      ? `${counts.revokeImmediately} key(s) require IMMEDIATE revocation.`
      : counts.revoke > 0
        ? `${counts.revoke} key(s) recommended for revocation.`
        : counts.reduce > 0
          ? `${counts.reduce} key(s) have unnecessary permissions.`
          : "All API keys within acceptable risk.";

  return { total: findings.length, ...counts, headline };
}
