const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/month",
    description: "Get started. T1 alerts only, no autonomous action.",
    features: [
      "T1 alerts via Telegram",
      "Monthly P11 governance audit digest",
      "Drift Three-Question Screen",
      "Wallet x-ray (approval hygiene scan)",
      "API key audit on demand",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/month",
    description: "Full v2 framework on a single wallet, up to 3 protocols.",
    features: [
      "Everything in Free",
      "T2 confirmation flow with WYSIWYS",
      "T3 auto-fire on bridge/DPRK attacks",
      "P4 utilization fast-track",
      "Module A post-incident sequence",
      "Module C re-entry gate",
      "Drained pool circuit breaker",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Whale",
    price: "$249",
    cadence: "/month",
    description: "Multi-wallet, all protocols, multi-chain. Module B active.",
    features: [
      "Everything in Pro",
      "Up to 10 wallets / 8-figure positions",
      "All EVM chains + Solana",
      "Module B supply chain emergency mode",
      "Hardware wallet WYSIWYS for >$50K",
      "Catalysis coverage co-pilot",
      "Priority Telegram support",
    ],
    cta: "Talk to us",
    highlighted: false,
  },
  {
    name: "Treasury",
    price: "$5K-$25K",
    cadence: "/quarter",
    description: "DAOs and funds. Multi-sig integration, custom plans.",
    features: [
      "Everything in Whale",
      "Multi-sig and Safe integration",
      "Custom bunker plans per treasury",
      "Quarterly governance audit + compliance report",
      "Dedicated incident response runbook",
      "On-call retainer",
      "Audit-trail export (SOC2/MICA)",
    ],
    cta: "Book intro",
    highlighted: false,
  },
];

const PER_FIRE_TIERS = [
  {
    label: "Standard execution",
    price: "$X via x402",
    description: "Charged only when T3 fires successfully. Skin-in-the-game pricing.",
  },
  {
    label: "Performance fee",
    price: "5-10% of saved capital",
    description:
      "Optional alternative for whales. We take a slice only when we save you from a measured cascade.",
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      <div>
        <p className="font-mono text-bunker-muted text-sm">PRICING</p>
        <h1 className="text-3xl font-bold">Pay only when we save you.</h1>
        <p className="text-bunker-muted mt-2 max-w-2xl">
          Free tier covers monitoring. Paid tiers unlock autonomous action. Per-fire pricing
          via x402 is the default - you only pay when T3 actually fires.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`bg-bunker-panel border rounded-lg p-6 flex flex-col ${
              t.highlighted ? "border-bunker-accent" : "border-bunker-border"
            }`}
          >
            <div className="font-mono text-xs text-bunker-muted">{t.name.toUpperCase()}</div>
            <div className="mt-2">
              <span className="text-3xl font-bold">{t.price}</span>
              <span className="text-bunker-muted text-sm">{t.cadence}</span>
            </div>
            <p className="text-sm text-bunker-muted mt-2">{t.description}</p>
            <ul className="mt-4 space-y-2 text-sm flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-bunker-accent">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`mt-6 px-4 py-2 rounded font-mono text-sm ${
                t.highlighted
                  ? "bg-bunker-accent text-bunker-bg"
                  : "border border-bunker-border hover:border-bunker-accent"
              }`}
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6">
        <div className="font-mono text-sm text-bunker-muted mb-3">PER-FIRE / VARIABLE</div>
        <div className="grid md:grid-cols-2 gap-6">
          {PER_FIRE_TIERS.map((t) => (
            <div key={t.label} className="space-y-1">
              <div className="font-semibold">{t.label}</div>
              <div className="font-mono text-bunker-accent">{t.price}</div>
              <p className="text-sm text-bunker-muted">{t.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-bunker-muted max-w-3xl">
        Economics example: in a single major incident, BunkerMode protects an average $1M Pro user
        from a 5% cascade drawdown. That is $50K saved. A 5-10% performance fee is $2,500-$5,000
        per user per major incident. With 10 incidents at 2026 pace, that is $25K-$50K per
        power user per year. We make money when you keep yours.
      </div>
    </div>
  );
}
