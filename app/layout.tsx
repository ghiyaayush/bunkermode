import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BunkerMode — DeFi Contagion Map",
  description: "Interactive cross-protocol exploit propagation map for Ethereum, Solana, and Starknet DeFi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
