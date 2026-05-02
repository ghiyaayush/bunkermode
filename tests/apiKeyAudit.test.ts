import { describe, expect, test } from "bun:test";
import { auditApiKey, summarizeAudit, type ApiKeyEntry } from "../lib/apiKeyAudit";

describe("API Key Audit", () => {
  const now = new Date("2026-05-01");

  test("forgotten key with full permissions → REVOKE_IMMEDIATELY", () => {
    const k: ApiKeyEntry = {
      service: "okx",
      label: "old",
      createdAt: new Date("2022-01-01"),
      lastUsed: null,
      permissions: ["read", "trade", "withdraw", "transfer", "futures", "margin"],
      ipWhitelist: [],
      hasWithdrawalEnabled: true,
      appearsForgotten: true,
    };
    const finding = auditApiKey(k, now);
    expect(finding.recommendation).toBe("REVOKE_IMMEDIATELY");
    expect(finding.flags.length).toBeGreaterThan(3);
  });

  test("read-only IP-whitelisted key → OK or MONITOR", () => {
    const k: ApiKeyEntry = {
      service: "coinbase",
      label: "dashboard",
      createdAt: new Date("2025-09-01"),
      lastUsed: new Date("2026-04-30"),
      permissions: ["read"],
      ipWhitelist: ["1.2.3.4"],
      hasWithdrawalEnabled: false,
      appearsForgotten: false,
    };
    const finding = auditApiKey(k, now);
    expect(["OK", "MONITOR"]).toContain(finding.recommendation);
  });

  test("withdrawal enabled is the heaviest flag", () => {
    const k: ApiKeyEntry = {
      service: "binance",
      label: "bot",
      createdAt: new Date("2025-09-01"),
      lastUsed: new Date("2026-04-30"),
      permissions: ["read", "trade", "withdraw"],
      ipWhitelist: ["1.2.3.4"],
      hasWithdrawalEnabled: true,
      appearsForgotten: false,
    };
    const finding = auditApiKey(k, now);
    expect(finding.riskScore).toBeGreaterThanOrEqual(50);
    expect(finding.flags.some((f) => f.match(/withdrawal/i))).toBe(true);
  });

  test("summary headline picks the worst recommendation", () => {
    const findings = [
      auditApiKey(
        {
          service: "a",
          label: "1",
          createdAt: new Date("2022-01-01"),
          lastUsed: null,
          permissions: ["read", "trade", "withdraw", "transfer", "futures", "margin"],
          ipWhitelist: [],
          hasWithdrawalEnabled: true,
          appearsForgotten: true,
        },
        now,
      ),
    ];
    const summary = summarizeAudit(findings);
    expect(summary.headline).toMatch(/IMMEDIATE/);
    expect(summary.revokeImmediately).toBe(1);
  });
});
