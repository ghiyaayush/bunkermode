/**
 * One-shot DDL: create the Prisma-backed BunkerMode tables in Postgres
 * without touching Gyan's existing wallets/positions/wallet_exposures.
 *
 * Run with:  bun scripts/init-prisma-tables.ts
 */

import { Client } from "pg";

const DDL = `
CREATE TABLE IF NOT EXISTS "Wallet" (
  id          text PRIMARY KEY,
  address     text UNIQUE NOT NULL,
  telegram    text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Policy" (
  id            text PRIMARY KEY,
  "walletId"    text NOT NULL REFERENCES "Wallet"(id),
  name          text NOT NULL,
  "templateKey" text NOT NULL,
  dsl           text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "Signal" (
  id           text PRIMARY KEY,
  source       text NOT NULL,
  protocol     text NOT NULL,
  asset        text,
  layer        integer NOT NULL,
  severity     text NOT NULL,
  "rawPayload" text NOT NULL,
  "receivedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Event" (
  id            text PRIMARY KEY,
  "walletId"    text NOT NULL REFERENCES "Wallet"(id),
  "policyId"    text REFERENCES "Policy"(id),
  tier          text NOT NULL,
  "attackClass" text,
  "recoveryRate" double precision,
  "t2Window"    integer,
  "exitRoute"   text,
  outcome       text,
  notes         text,
  "firedAt"     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "SignalLink" (
  id        text PRIMARY KEY,
  "eventId" text NOT NULL REFERENCES "Event"(id),
  "signalId" text NOT NULL REFERENCES "Signal"(id)
);

CREATE TABLE IF NOT EXISTS "Audit" (
  id            text PRIMARY KEY,
  "walletId"    text NOT NULL REFERENCES "Wallet"(id),
  protocol      text NOT NULL,
  timelock      integer NOT NULL,
  "multisigM"   integer NOT NULL,
  "multisigN"   integer NOT NULL,
  "oracleType"  text NOT NULL,
  "driftScore"  integer NOT NULL,
  "riskLevel"   text NOT NULL,
  "generatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ThreatEnvironment" (
  id              text PRIMARY KEY,
  level           text NOT NULL,
  reason          text NOT NULL,
  "thresholdMult" double precision NOT NULL,
  "windowMult"    double precision NOT NULL,
  "expiresAt"     timestamptz NOT NULL,
  "createdAt"     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AlertDedup" (
  key         text PRIMARY KEY,
  provider    text NOT NULL,
  "walletId"  text,
  "firstSeen" timestamptz NOT NULL DEFAULT now(),
  "lastSeen"  timestamptz NOT NULL DEFAULT now(),
  count       integer NOT NULL DEFAULT 1,
  "expiresAt" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "Signal_receivedAt_idx" ON "Signal" ("receivedAt" DESC);
CREATE INDEX IF NOT EXISTS "AlertDedup_lastSeen_idx" ON "AlertDedup" ("lastSeen" DESC);
CREATE INDEX IF NOT EXISTS "Event_walletId_idx" ON "Event" ("walletId");
CREATE INDEX IF NOT EXISTS "Policy_walletId_idx" ON "Policy" ("walletId");
`;

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("DIRECT_URL or DATABASE_URL must be set");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log("→ Creating BunkerMode Prisma tables (existing Gyan tables untouched)...");
  await client.query(DDL);
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`,
  );
  console.log("✓ Done. Tables in public schema:");
  for (const r of rows) console.log(`   - ${r.table_name}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
