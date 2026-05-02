/**
 * Seed the SQLite db with the demo wallet, the aave-rseth-cascade policy,
 * and a clean event/signal slate so the demo console starts deterministic.
 *
 * Run with: bun scripts/seed-demo.ts
 */

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
const db = new PrismaClient({ adapter });

const DEMO_WALLET = "0xdemoabc123456789demoabc123456789demoabc1";

async function main() {
  console.log("Seeding demo wallet...");

  await db.signalLink.deleteMany({});
  await db.event.deleteMany({});
  await db.signal.deleteMany({});
  await db.policy.deleteMany({ where: { wallet: { address: DEMO_WALLET } } });
  await db.audit.deleteMany({ where: { wallet: { address: DEMO_WALLET } } });

  const wallet = await db.wallet.upsert({
    where: { address: DEMO_WALLET },
    create: { address: DEMO_WALLET },
    update: {},
  });

  const policy = await db.policy.create({
    data: {
      walletId: wallet.id,
      name: "Aave rsETH Cascade Defender",
      templateKey: "aave-rseth-cascade",
      dsl: JSON.stringify({
        name: "Aave rsETH Cascade Defender",
        templateKey: "aave-rseth-cascade",
        asset: "rsETH",
        protocol: "aave-v3",
        position: "shared_pool_supplier",
        rules: {
          utilizationLockoutPct: 85,
          autoFireOn: ["bridge_verifier", "dprk_attributed"],
          exitRoute: ["usdc-base-cctp", "morpho-isolated", "sparklend", "native-eth"],
          reEntryGate: true,
          refuseOnSupplyChain: true,
          hardwareWalletAbove: 50000,
        },
      }),
    },
  });

  console.log(`Demo wallet seeded: ${DEMO_WALLET}`);
  console.log(`Policy id:           ${policy.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
