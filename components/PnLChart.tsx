"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/**
 * The screenshot moment.
 *
 * Hardcoded series modeled after the actual rsETH/Aave aftermath:
 *   Unprotected: -23% over 21 days, locked out for 14 days
 *   Protected:   approximately flat (slightly positive on USDC yield)
 */

const data = Array.from({ length: 22 }, (_, day) => {
  const unprotected = (() => {
    if (day < 1) return 0;
    if (day === 1) return -8; // initial drawdown
    if (day < 4) return -15;
    if (day < 8) return -22;
    return -23;
  })();
  const protectedSeries = day === 0 ? 0 : 0.01 * day; // ~1bp/day on USDC
  return {
    day,
    unprotected,
    protected: Number(protectedSeries.toFixed(2)),
  };
});

export function PnLChart() {
  return (
    <div className="bg-bunker-panel border border-bunker-border rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-mono text-xs text-bunker-muted">DAYS POST-INCIDENT</div>
          <div className="text-lg font-semibold">PnL: protected vs unprotected wallet</div>
        </div>
        <div className="text-right">
          <div className="text-bunker-accent text-2xl font-bold">+0.21%</div>
          <div className="text-bunker-muted text-xs">protected</div>
          <div className="text-bunker-danger text-2xl font-bold mt-2">-23%</div>
          <div className="text-bunker-muted text-xs">unprotected, locked 14d</div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -10, top: 8 }}>
            <XAxis dataKey="day" stroke="#7A8392" fontSize={12} />
            <YAxis stroke="#7A8392" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "#11161D", border: "1px solid #1F2730" }}
              labelFormatter={(d) => `Day ${d}`}
              formatter={(v) => `${v}%`}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#1F2730" />
            <Line
              type="monotone"
              dataKey="unprotected"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Unprotected"
            />
            <Line
              type="monotone"
              dataKey="protected"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Protected (BunkerMode)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs font-mono text-bunker-muted mt-4 leading-relaxed">
        Unprotected curve modeled on actual rsETH holder + Aave WETH supplier outcome
        post-April 18, 2026. 14 day lockout reflects 100% utilization on the WETH market
        from T+1.4h to T+14d.
      </div>
    </div>
  );
}
