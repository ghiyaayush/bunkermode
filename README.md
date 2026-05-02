# BunkerMode

> When DeFi catches fire, your money is already in the stairwell.

User-level crisis response layer for DeFi. v2 framework: 11 principles, 3 modules.

This repo is the working hackathon implementation: Next.js 16 + Prisma 7 + Bun, with an MCP server, a Telegram bot, and a forked-mainnet demo console that replays the April 18, 2026 KelpDAO incident with the demo wallet protected.

## What works out of the box

- Setup screen: pick a template, create a policy, save to db
- Monitor screen: live tier state, P9 attack class, P4 utilization, P8 threat env, P7 exit route
- Demo console: replay the Kelp timeline in real time + Module B supply chain refusal beat + PnL chart
- API routes: `/api/signal`, `/api/policy`, `/api/threat`, `/api/fire`, `/api/audit`, `/api/utilization`, `/api/telegram`, `/api/demo/reset`
- MCP server: 4 tools (`create_bunker_plan`, `list_active_threats`, `run_governance_audit`, `simulate_fire`)
- Telegram bot: `/start`, `/audit`, `/status`, `/help` + Module A timed sequence + Module B refusal
- All v2 framework logic (11 principles + 3 modules) implemented in `lib/`

## What is mocked (with TODO markers)

- **KeeperHub workflow execution:** mocked in `lib/keeperhub.ts`. Wire `KEEPERHUB_API_KEY` to enable real calls.
- **x402 / MPP payments:** stubbed in `lib/keeperhub.ts`. Wire `CDP_API_KEY` for real charges.
- **Forta / Hypernative / Twitter feeds:** demo console drives signals manually. Production version subscribes to real webhooks.
- **Aave V3 utilization read:** real path in `lib/utilization.ts`. Demo path uses `mockUtilizationCurve`.
- **Anvil mainnet fork:** scaffolding only. See `Demo on a real fork` below for the real setup.

## Quickstart

```bash
# 1. Install
bun install
# (or: npm install)

# 2. Set up env
cp .env.example .env
# edit .env with at least TELEGRAM_BOT_TOKEN if you want the bot

# 3. Initialize sqlite db
bun prisma db push

# 4. Seed the demo wallet + policy
bun scripts/seed-demo.ts

# 5. Run the app
bun dev
# open http://localhost:3000
```

## Run the demo

1. Open http://localhost:3000/demo
2. Click `Start Kelp replay`
3. Watch signals corroborate, P9 classify, P4 utilization climb, T3 fire at ~T+90s
4. After the run, click `Reset` then `Module B: trigger supply chain` to see the refusal beat
5. PnL chart appears at the bottom showing protected vs unprotected wallet

The demo wallet address is hardcoded as `0xdemoabc123456789demoabc123456789demoabc1`.

## MCP server (Claude Desktop integration)

In a separate terminal:

```bash
bun mcp/server.ts
```

Or wire into Claude Desktop by copying `mcp/claude_desktop_config.example.json` into Claude's config (typically `~/Library/Application Support/Claude/mcp_config.json`).

Then in Claude:

> Hey Claude, create a bunker plan for wallet 0xdemoabc... using the aave-rseth-cascade template.
>
> Now run a governance audit on that wallet.
>
> Show me the active threats.

## Telegram bot

```bash
bun telegram/bot.ts
```

Commands:
- `/start <wallet>` link this chat to a wallet (anonymous, only chat_id stored)
- `/audit <wallet>` run P11 governance audit
- `/status <wallet>` get current threat tier
- `/help`

## Demo on a real Anvil fork (optional)

For the hackathon judges' demo we recommend a forked mainnet for visual realism:

```bash
# in a separate terminal
anvil --fork-url $MAINNET_RPC --fork-block-number 22250000

# then update .env:
ANVIL_RPC_URL=http://localhost:8545
ANVIL_FORK_BLOCK=22250000
```

The demo console will detect this and route P4 utilization reads to the live Aave V3 contract instead of the mock curve.

## Architecture overview

```
                                 ┌──────────────────┐
                                 │  Demo Console    │
                                 │  (manual fire)   │
                                 └────────┬─────────┘
                                          │
┌─────────────┐                          ▼
│   Forta*    │──┐                ┌──────────────────┐
│ Hypernative*│──┼─── webhooks ──▶│  Signal Ingest   │
│  Twitter*   │──┘                │  /api/signal/*   │
│ Utilization │──┘                └────────┬─────────┘
│ checker(P4) │                            │
└─────────────┘                            ▼
                                  ┌──────────────────┐         ┌──────────────┐
                                  │   Corroborator   │────────▶│   SQLite     │
                                  │  + Classifier    │         │  policies    │
                                  │  (P8/P9/P4)      │         │  signals     │
                                  └────────┬─────────┘         │  events      │
                                           │                   │  audits      │
                       ┌───────────────────┼─────────┐         └──────────────┘
                       ▼                   ▼         ▼
               ┌──────────────┐    ┌──────────────┐ ┌──────────────┐
               │ T1: Telegram │    │ T2: Confirm  │ │ T3: KeeperHub│
               └──────────────┘    └──────────────┘ └──────┬───────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │ Anvil fork   │
                                                    │ Aave V3 +    │
                                                    │ P7 routing   │
                                                    └──────────────┘

PROACTIVE TRACK (P11):
   /audit cron ──▶ Drift Three-Question Screen ──▶ Telegram digest

DEFENSIVE TRACK (Module B):
   Supply chain signal ──▶ REFUSE auto-exec ──▶ Manual instructions
```

## v2 framework, file by file

| Principle / Module | File |
|---|---|
| P1 Dependency graph | `data/incidents/kelp-2026.json` (static graph for demo) |
| P2 Pool architecture | tagged on protocols in templates |
| P3 Three-layer collateral risk | `lib/types.ts` (CollateralRiskScore) |
| **P4 Utilization lockout** | **`lib/utilization.ts`** |
| P5 Signal hierarchy | `lib/types.ts` (SignalLayer) |
| P6 Contagion stratification | `lib/types.ts` (PositionLayer) |
| **P7 Exit routing** | **`lib/exit-router.ts`** |
| P8 Threat env multiplier | `lib/threat-multiplier.ts` |
| **P9 Attack classification** | **`lib/classifier.ts`** |
| P10 Re-entry verification | (Tier 3, deferred) |
| **P11 Governance audit** | **`lib/audit.ts`** |
| **Module A** post-incident sequence | **`lib/postIncident.ts`** |
| **Module B** supply chain refusal | **`lib/postIncident.ts` + `components/SupplyChainRefusal.tsx`** |
| Module C re-entry gate | (Tier 3, deferred) |
| Corroborator (T1/T2/T3) | `lib/corroborator.ts` |
| KeeperHub + x402 | `lib/keeperhub.ts` |

Tier 1 items (bold) are wired live for the demo. Tier 2 is architecture-present. Tier 3 is post-hackathon scope.

## License

MIT.
