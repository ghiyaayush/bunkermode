import { db } from "@/lib/db";
import { mapAddressesToNodeIds, nodeLabel } from "@/lib/forta-address-mapper";

export const dynamic = "force-dynamic";

interface DisplaySignal {
  id: string;
  source: string;
  protocol: string;
  asset: string | null;
  layer: number;
  severity: string;
  receivedAt: Date;
  alertName?: string;
  affectedNodes: string[];
  txHash?: string;
}

const SEVERITY_STYLES: Record<string, { dot: string; label: string }> = {
  CRITICAL: { dot: "bg-red-500", label: "text-red-400 border-red-500/40" },
  ELEVATED: { dot: "bg-orange-500", label: "text-orange-400 border-orange-500/40" },
  WATCH:    { dot: "bg-yellow-500", label: "text-yellow-400 border-yellow-500/40" },
  INFO:     { dot: "bg-zinc-500", label: "text-zinc-400 border-zinc-500/40" },
};

function relTime(d: Date): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default async function AlertsPage() {
  const [signals, dedup] = await Promise.all([
    db.signal.findMany({ orderBy: { receivedAt: "desc" }, take: 50 }),
    db.alertDedup.findMany({ orderBy: { lastSeen: "desc" }, take: 50 }),
  ]);

  const display: DisplaySignal[] = signals.map((s) => {
    const payload = safeParse(s.rawPayload) as Record<string, unknown> | null;
    const addrs = Array.isArray(payload?.addresses) ? (payload.addresses as string[]) : [];
    return {
      id: s.id,
      source: s.source,
      protocol: s.protocol,
      asset: s.asset,
      layer: s.layer,
      severity: s.severity,
      receivedAt: s.receivedAt,
      alertName: typeof payload?.name === "string" ? (payload.name as string) : undefined,
      affectedNodes: mapAddressesToNodeIds(addrs),
      txHash: typeof payload?.transactionHash === "string" ? (payload.transactionHash as string) : undefined,
    };
  });

  const totalDeliveries = dedup.reduce((acc, d) => acc + d.count, 0);
  const activeWindows = dedup.filter((d) => d.expiresAt > new Date()).length;
  const counts = signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.severity] = (acc[s.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-bunker-muted text-sm">v0.2 / threat feed</p>
        <h1 className="text-4xl font-bold tracking-tight">Alerts</h1>
        <p className="text-bunker-muted mt-2">
          Live feed of webhook signals (Forta / Hypernative / Cyvers) translated into BunkerMode tiers
          and matched against monitored wallets.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <Stat label="Total signals (50 most recent)" value={signals.length} />
        <Stat label="Telegram dispatches" value={totalDeliveries} />
        <Stat label="Active dedup windows" value={activeWindows} />
        <Stat
          label="By severity"
          value={
            <span className="text-sm font-mono space-x-3">
              <span className="text-red-400">CRIT {counts.CRITICAL ?? 0}</span>
              <span className="text-orange-400">ELEV {counts.ELEVATED ?? 0}</span>
              <span className="text-yellow-400">WATCH {counts.WATCH ?? 0}</span>
              <span className="text-zinc-400">INFO {counts.INFO ?? 0}</span>
            </span>
          }
        />
      </div>

      <div className="bg-bunker-panel border border-bunker-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-bunker-border flex items-center justify-between">
          <div className="font-mono text-sm text-bunker-muted">RECENT SIGNALS</div>
          <a
            href="/api/alerts"
            className="text-xs font-mono text-bunker-muted hover:text-bunker-text"
          >
            JSON →
          </a>
        </div>
        {display.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-bunker-border">
            {display.map((s) => {
              const sev = SEVERITY_STYLES[s.severity] ?? SEVERITY_STYLES.INFO;
              return (
                <li key={s.id} className="px-6 py-4 hover:bg-bunker-bg/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`w-2 h-2 rounded-full ${sev.dot}`} />
                        <span className={`font-mono text-xs px-2 py-0.5 border rounded ${sev.label}`}>
                          {s.severity}
                        </span>
                        <span className="font-mono text-xs text-bunker-muted uppercase">
                          {s.source}
                        </span>
                        <span className="font-mono text-xs text-bunker-muted">
                          L{s.layer}
                        </span>
                      </div>
                      <div className="text-sm font-semibold mb-1">
                        {s.alertName ?? `${s.source} signal`}
                      </div>
                      <div className="text-xs text-bunker-muted font-mono">
                        protocol: <span className="text-bunker-text">{s.protocol}</span>
                        {s.asset && (
                          <>
                            {"  ·  "}asset: <span className="text-bunker-text">{s.asset}</span>
                          </>
                        )}
                        {s.txHash && (
                          <>
                            {"  ·  "}tx: <span className="text-bunker-text">{shortHash(s.txHash)}</span>
                          </>
                        )}
                      </div>
                      {s.affectedNodes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {s.affectedNodes.map((n) => (
                            <span
                              key={n}
                              className="text-xs font-mono px-2 py-0.5 bg-bunker-bg border border-bunker-border rounded"
                            >
                              {nodeLabel(n)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono text-bunker-muted whitespace-nowrap">
                      {relTime(s.receivedAt)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {dedup.length > 0 && (
        <div className="bg-bunker-panel border border-bunker-border rounded-lg mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-bunker-border font-mono text-sm text-bunker-muted">
            DEDUP STATE (recent dispatch windows)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs font-mono text-bunker-muted">
                <tr>
                  <th className="text-left px-6 py-2">provider</th>
                  <th className="text-left px-6 py-2">chat / wallet</th>
                  <th className="text-right px-6 py-2">count</th>
                  <th className="text-left px-6 py-2">first seen</th>
                  <th className="text-left px-6 py-2">last seen</th>
                  <th className="text-left px-6 py-2">expires</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {dedup.map((d) => (
                  <tr key={d.key} className="border-t border-bunker-border/50">
                    <td className="px-6 py-2">{d.provider}</td>
                    <td className="px-6 py-2 truncate max-w-32">{d.walletId ?? "—"}</td>
                    <td className="px-6 py-2 text-right">{d.count}</td>
                    <td className="px-6 py-2 text-bunker-muted">{relTime(d.firstSeen)}</td>
                    <td className="px-6 py-2 text-bunker-muted">{relTime(d.lastSeen)}</td>
                    <td className="px-6 py-2 text-bunker-muted">
                      {d.expiresAt > new Date() ? `in ${minsUntil(d.expiresAt)}m` : "expired"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-bunker-panel border border-bunker-border rounded-lg px-5 py-4">
      <div className="font-mono text-xs text-bunker-muted mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center text-sm text-bunker-muted">
      <div className="font-mono mb-3">No signals yet.</div>
      <div className="space-y-1">
        <div>Wire a Forta notification policy to <code className="font-mono text-bunker-text">/api/webhook/forta</code></div>
        <div>or fire a test alert with:</div>
      </div>
      <pre className="mt-4 inline-block text-left text-xs bg-bunker-bg border border-bunker-border rounded px-4 py-3 font-mono">
        {"curl -X POST http://localhost:3000/api/dev/forta-replay"}
      </pre>
    </div>
  );
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function shortHash(h: string): string {
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h;
}

function minsUntil(d: Date): number {
  return Math.max(0, Math.round((new Date(d).getTime() - Date.now()) / 60_000));
}
