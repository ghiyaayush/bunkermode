import { DependencyGraph, RSETH_GRAPH } from "@/components/DependencyGraph";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="space-y-2 mb-12">
        <p className="font-mono text-bunker-muted text-sm">v0.2 / v2 framework</p>
        <h1 className="text-5xl font-bold tracking-tight">
          When DeFi catches fire,
          <br />
          your money is already in the stairwell.
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="space-y-3">
          <p className="text-bunker-text text-lg">
            BunkerMode is a user-level crisis response layer for DeFi. It ingests threat signals
            from multiple feeds, classifies the attack class, and executes pre-staged exit plans
            on your positions before the cascade panic begins.
          </p>
          <p className="text-bunker-muted">
            We do not try to outrun attackers. We outrun the panic crowd, then prevent the
            second-attack trap.
          </p>
        </div>
        <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6 space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-bunker-muted">KelpDAO direct loss</span>
            <span>$292M</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bunker-muted">Cascade outflows in 48h</span>
            <span className="text-bunker-danger">$13.21B</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bunker-muted">Aave bad debt absorbed</span>
            <span className="text-bunker-danger">$196M</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bunker-muted">2026 YTD losses (110 days)</span>
            <span className="text-bunker-danger">$775M+</span>
          </div>
          <hr className="border-bunker-border my-3" />
          <div className="flex justify-between">
            <span className="text-bunker-muted">Drift drain time</span>
            <span>12 min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bunker-muted">Kelp drain time</span>
            <span>46 min before pause</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bunker-muted">Aave WETH lockout</span>
            <span>7h before official freeze</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <a
          href="/setup"
          className="bg-bunker-panel border border-bunker-border rounded-lg p-6 hover:border-bunker-accent transition-colors"
        >
          <div className="text-bunker-accent font-mono text-sm mb-2">01 / SETUP</div>
          <div className="text-lg font-semibold mb-1">Configure a bunker policy</div>
          <div className="text-sm text-bunker-muted">
            Pick a template or write your own DSL. Connect wallet and Telegram.
          </div>
        </a>
        <a
          href="/monitor"
          className="bg-bunker-panel border border-bunker-border rounded-lg p-6 hover:border-bunker-accent transition-colors"
        >
          <div className="text-bunker-accent font-mono text-sm mb-2">02 / MONITOR</div>
          <div className="text-lg font-semibold mb-1">Watch threat tier in real time</div>
          <div className="text-sm text-bunker-muted">
            Signals, corroboration, attack class, utilization, exit route.
          </div>
        </a>
        <a
          href="/demo"
          className="bg-bunker-panel border border-bunker-border rounded-lg p-6 hover:border-bunker-accent transition-colors"
        >
          <div className="text-bunker-accent font-mono text-sm mb-2">03 / DEMO</div>
          <div className="text-lg font-semibold mb-1">Replay the Kelp incident</div>
          <div className="text-sm text-bunker-muted">
            Forked-mainnet replay of April 18, 2026 with your wallet protected.
          </div>
        </a>
      </div>

      <div className="mb-12">
        <DependencyGraph asset="rsETH" nodes={RSETH_GRAPH} />
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6 space-y-4">
        <div className="font-mono text-sm text-bunker-muted">THE V2 FRAMEWORK</div>
        <pre className="font-mono text-xs leading-relaxed text-bunker-text overflow-x-auto">
{`MONTHLY (proactive)
  └─ P11: Governance audit → flag Drift-profile protocols before attack

ONGOING (reactive watch)
  └─ P1-P5: Dependency graph + pool architecture + collateral stack
            + utilization + signal hierarchy → T1/T2/T3 corroboration
  └─ P8:    Threat env multiplier → tighten after major hack

WHEN SIGNAL FIRES
  └─ P6: Which asset layer am I? → calibrate response speed
  └─ P7: Where am I going? → pre-defined exit routing
  └─ P9: Classify the attack → set T2 window + post-T3 guide

AFTER T3 FIRES
  └─ Module A: Post-incident classifier → timed Telegram sequence
  └─ Module C: Re-entry gate → blocked until all 3 trust layers verified
  └─ P10:      Re-entry checklist → all 3 layers must be green

SPECIAL CASE: SUPPLY CHAIN DETECTED
  └─ Module B: Emergency opsec mode → no autonomous execution,
               device isolation, clean-device transfer guide`}
        </pre>
      </div>
    </div>
  );
}
