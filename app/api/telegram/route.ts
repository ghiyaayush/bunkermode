import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/telegram
 *
 * Links a Telegram chat_id to a wallet address. The user clicks
 * t.me/YourBot?start=<wallet_hash> from the Setup screen, the bot
 * captures the chat_id, and pings this endpoint.
 *
 * Anonymous: only the chat_id is stored, never the @handle.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { walletAddress, chatId } = body as { walletAddress: string; chatId: string };

  if (!walletAddress || !chatId) {
    return NextResponse.json({ error: "walletAddress + chatId required" }, { status: 400 });
  }

  const wallet = await db.wallet.upsert({
    where: { address: walletAddress.toLowerCase() },
    create: { address: walletAddress.toLowerCase(), telegram: chatId },
    update: { telegram: chatId },
  });

  return NextResponse.json({ ok: true, walletId: wallet.id });
}
