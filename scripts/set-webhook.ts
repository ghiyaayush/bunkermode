// Run once after deploying to Vercel to register the webhook URL with Telegram
// Usage: DEPLOY_URL=https://your-app.vercel.app npx tsx scripts/set-webhook.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const token = process.env.BOT_TOKEN;
const deployUrl = process.env.DEPLOY_URL || process.argv[2];

if (!token) { console.error("BOT_TOKEN not set"); process.exit(1); }
if (!deployUrl) { console.error("Provide DEPLOY_URL env var or as argument"); process.exit(1); }

const webhookUrl = `${deployUrl.replace(/\/$/, "")}/api/telegram`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "callback_query"] }),
});

const data = await res.json();
if (data.ok) {
  console.log(`✅ Webhook set: ${webhookUrl}`);
} else {
  console.error("❌ Failed:", data.description);
}
