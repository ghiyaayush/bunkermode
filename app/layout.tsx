import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BunkerMode",
  description: "When DeFi catches fire, your money is already in the stairwell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-bunker-bg text-bunker-text">
          <header className="border-b border-bunker-border px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-mono text-bunker-accent text-lg">
              BUNKER<span className="text-bunker-text">MODE</span>
            </a>
            <nav className="flex gap-5 text-sm font-mono text-bunker-muted">
              <a href="/setup" className="hover:text-bunker-text">Setup</a>
              <a href="/monitor" className="hover:text-bunker-text">Monitor</a>
              <a href="/demo" className="hover:text-bunker-text">Demo</a>
              <a href="/governance-audit" className="hover:text-bunker-text">P11 Audit</a>
              <a href="/re-entry" className="hover:text-bunker-text">Re-entry</a>
              <a href="/pricing" className="hover:text-bunker-text">Pricing</a>
            </nav>
            <div className="text-xs font-mono text-bunker-muted">
              <span className="live-dot"></span>v0.2 (v2 framework)
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
