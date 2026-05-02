import { webhookCallback } from "grammy";
import { createBot } from "@/lib/bot";

const bot = createBot();
const handler = webhookCallback(bot, "std/http");

export const POST = handler;

// Health check
export async function GET() {
  return new Response(JSON.stringify({ ok: true, bot: "BunkerMode" }), {
    headers: { "Content-Type": "application/json" },
  });
}
