/**
 * Standalone P11 governance audit runner.
 *
 * Useful for monthly cron jobs or CLI inspection without needing the
 * Next.js server up. Prints the digest to stdout.
 *
 * Run with: bun scripts/run-audit.ts
 */

import { classifyAuditRisk, formatAuditDigest } from "../lib/audit";
import type { ProtocolGovernanceData } from "../lib/audit";

const PORTFOLIO: ProtocolGovernanceData[] = [
  {
    protocol: "Aave V3",
    timelockHours: 48,
    multisigM: 8,
    multisigN: 12,
    oracleType: "chainlink",
    adminCanAssignOracle: false,
  },
  {
    protocol: "Morpho",
    timelockHours: 72,
    multisigM: 5,
    multisigN: 9,
    oracleType: "pyth",
    adminCanAssignOracle: false,
  },
  {
    protocol: "Cetus CLMM",
    timelockHours: 24,
    multisigM: 3,
    multisigN: 5,
    oracleType: "internal",
    adminCanAssignOracle: false,
  },
  {
    protocol: "Sky USDS",
    timelockHours: 48,
    multisigM: 5,
    multisigN: 9,
    oracleType: "chainlink",
    adminCanAssignOracle: false,
  },
  {
    protocol: "New Protocol X",
    timelockHours: 0,
    multisigM: 2,
    multisigN: 5,
    oracleType: "admin",
    adminCanAssignOracle: true,
  },
];

const profiles = PORTFOLIO.map(classifyAuditRisk);
const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
console.log(formatAuditDigest(profiles, month));
