// Local development: runs the bot in long-polling mode (no webhook needed)
// Usage: npx tsx scripts/dev-bot.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { createBot } from "../lib/bot";

const bot = createBot();

bot.catch((err) => console.error("Bot error:", err));

console.log("Starting BunkerMode bot in polling mode...");
bot.start({
  onStart: (info) => console.log(`Bot running as @${info.username}`),
});
