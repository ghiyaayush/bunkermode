import { Bot, InlineKeyboard } from "grammy";
import { detectChain } from "./known-contracts";
import { fetchEthereumPositions, fetchSolanaPositions } from "./position-fetcher";
import { findContagionPaths, NODES, RISK_COLORS } from "./contagion-graph";
import {
  getWalletsByChatId, walletExists, registerWallet,
  upsertPositions, getPositionsForWallet, deactivateWallet,
  type Wallet,
} from "./supabase";

// ─── Formatting helpers ───────────────────────────────────────────────────────

const RISK_EMOJI: Record<string, string> = {
  critical: "🔴", high: "🟠", medium: "🟡", low: "🟢",
};

function riskBar(weight: number): string {
  const pct = Math.round(weight * 100);
  const filled = Math.round(pct / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled) + ` ${pct}%`;
}

function shortAddr(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function chainEmoji(chain: string): string {
  return chain === "ethereum" ? "⟠" : chain === "solana" ? "◎" : "★";
}

// Given a wallet's position node IDs, compute top contagion risks
function computeRisks(positionNodeIds: string[]): { label: string; riskLevel: string; weight: number }[] {
  const riskMap = new Map<string, number>();
  for (const id of positionNodeIds) {
    for (const r of findContagionPaths(id, 4)) {
      riskMap.set(r.nodeId, Math.max(riskMap.get(r.nodeId) ?? 0, r.pathWeight));
    }
  }
  // Remove nodes that are themselves positions
  for (const id of positionNodeIds) riskMap.delete(id);

  return [...riskMap.entries()]
    .filter(([, w]) => w > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, weight]) => {
      const node = NODES.find((n) => n.id === id);
      return { label: node?.label ?? id, riskLevel: node?.riskLevel ?? "medium", weight };
    });
}

function formatPositionSummary(
  address: string,
  chain: string,
  positions: { node_id: string; name: string; balance: number | null; is_protocol: boolean }[]
): string {
  const posIds = positions.map((p) => p.node_id);
  const risks = computeRisks(posIds);

  const posLines = positions.length > 0
    ? positions
        .map((p) => {
          const node = NODES.find((n) => n.id === p.node_id);
          const emoji = RISK_EMOJI[node?.riskLevel ?? "low"];
          const bal = p.balance && p.balance > 0.0001 ? ` — ${p.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : "";
          return `  ${emoji} ${p.name}${bal}`;
        })
        .join("\n")
    : "  No DeFi positions detected";

  const riskLines = risks.length > 0
    ? risks.map((r) => `  ${RISK_EMOJI[r.riskLevel]} ${r.label}  ${riskBar(r.weight)}`).join("\n")
    : "  None detected";

  return [
    `${chainEmoji(chain)} \`${shortAddr(address)}\``,
    "",
    "*Your positions:*",
    posLines,
    "",
    "*Contagion exposure (4 hops):*",
    riskLines,
    "",
    "🟢 Safe exits: USDC/CCTP · Native ETH · Morpho isolated",
  ].join("\n");
}

// ─── Bot factory ──────────────────────────────────────────────────────────────

export function createBot(): Bot {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN is not set");
  const bot = new Bot(token);

  // ── /start ──────────────────────────────────────────────────────────────────
  bot.command("start", async (ctx) => {
    await ctx.reply(
      [
        "🛡 *BunkerMode*",
        "",
        "I monitor your DeFi positions and map how a hack in one protocol can cascade to yours — up to 4 connections away.",
        "",
        "*Commands:*",
        "  /register `<address>` — add a wallet",
        "  /positions — show your current positions",
        "  /remove — unregister a wallet",
        "  /help — show this message",
        "",
        "Send me your Ethereum or Solana address to get started.",
      ].join("\n"),
      { parse_mode: "Markdown" }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "*BunkerMode commands:*",
        "",
        "/register `<address>` — register Ethereum or Solana wallet",
        "/positions — view positions + contagion map for all wallets",
        "/remove — unregister a wallet",
        "",
        "Ethereum addresses start with `0x`",
        "Solana addresses are 32–44 base58 characters",
      ].join("\n"),
      { parse_mode: "Markdown" }
    );
  });

  // ── /register ────────────────────────────────────────────────────────────────
  bot.command("register", async (ctx) => {
    const address = ctx.match?.trim();
    const chatId = String(ctx.chat.id);

    if (!address) {
      await ctx.reply(
        "Please provide a wallet address:\n`/register 0x...`",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const chain = detectChain(address);
    if (chain === "unknown") {
      await ctx.reply(
        "❌ That doesn't look like a valid address\\.\n\nEthereum: starts with `0x`, 42 chars\nSolana: 32–44 base58 characters",
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (await walletExists(chatId, address)) {
      await ctx.reply(`⚠️ \`${shortAddr(address)}\` is already registered\\.`, { parse_mode: "Markdown" });
      return;
    }

    const scanning = await ctx.reply("⏳ Scanning wallet\\.\\.\\.", { parse_mode: "Markdown" });

    try {
      const rawPositions = chain === "ethereum"
        ? await fetchEthereumPositions(address)
        : await fetchSolanaPositions(address);

      // Persist to Supabase
      const wallet = await registerWallet(chatId, address, chain);
      await upsertPositions(
        wallet.id,
        rawPositions.map((p) => ({
          node_id: p.nodeId,
          name: p.name,
          balance: p.balance,
          is_protocol: p.isProtocol,
        }))
      );

      const summary = formatPositionSummary(address, chain, rawPositions.map((p) => ({
        node_id: p.nodeId, name: p.name, balance: p.balance, is_protocol: p.isProtocol,
      })));

      await ctx.api.editMessageText(
        chatId, scanning.message_id,
        `✅ *Wallet registered\\!*\n\n${escMd(summary)}`,
        { parse_mode: "MarkdownV2" }
      );
    } catch (err) {
      console.error("register error", err);
      await ctx.api.editMessageText(
        chatId, scanning.message_id,
        "❌ Failed to scan wallet\\. Please try again in a moment\\.",
        { parse_mode: "MarkdownV2" }
      );
    }
  });

  // ── /positions ───────────────────────────────────────────────────────────────
  bot.command("positions", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const wallets = await getWalletsByChatId(chatId);

    if (wallets.length === 0) {
      await ctx.reply(
        "No wallets registered yet\\. Use `/register <address>` to start\\.",
        { parse_mode: "MarkdownV2" }
      );
      return;
    }

    for (const wallet of wallets) {
      const positions = await getPositionsForWallet(wallet.id);
      const summary = formatPositionSummary(wallet.address, wallet.chain, positions);
      await ctx.reply(escMd(summary), { parse_mode: "MarkdownV2" });
    }
  });

  // ── /remove ──────────────────────────────────────────────────────────────────
  bot.command("remove", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const wallets = await getWalletsByChatId(chatId);

    if (wallets.length === 0) {
      await ctx.reply("No wallets registered\\.", { parse_mode: "MarkdownV2" });
      return;
    }

    if (wallets.length === 1) {
      // Single wallet — confirm inline
      const kb = new InlineKeyboard()
        .text("Yes, remove it", `remove:${wallets[0].id}`)
        .text("Cancel", "remove:cancel");
      await ctx.reply(
        `Remove \`${shortAddr(wallets[0].address)}\`?`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // Multiple wallets — show list to pick from
    const kb = new InlineKeyboard();
    for (const w of wallets) {
      kb.text(`${chainEmoji(w.chain)} ${shortAddr(w.address)}`, `remove:${w.id}`).row();
    }
    kb.text("Cancel", "remove:cancel");
    await ctx.reply("Which wallet do you want to remove?", { reply_markup: kb });
  });

  // Inline button handler for /remove
  bot.callbackQuery(/^remove:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.match[1];
    if (id === "cancel") {
      await ctx.editMessageText("Cancelled.");
      return;
    }
    try {
      await deactivateWallet(id);
      await ctx.editMessageText("✅ Wallet removed\\.", { parse_mode: "MarkdownV2" });
    } catch {
      await ctx.editMessageText("❌ Failed to remove wallet\\.", { parse_mode: "MarkdownV2" });
    }
  });

  // Catch-all for unknown messages
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    // If it looks like an address, suggest /register
    if (/^0x[0-9a-fA-F]{40}$/.test(text) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text)) {
      await ctx.reply(
        `Looks like a wallet address\\! Use:\n\`/register ${escMd(text)}\``,
        { parse_mode: "MarkdownV2" }
      );
      return;
    }
    await ctx.reply("Use /help to see available commands\\.", { parse_mode: "MarkdownV2" });
  });

  return bot;
}

// ─── MarkdownV2 escape helper ────────────────────────────────────────────────
// Telegram MarkdownV2 requires escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !

function escMd(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
