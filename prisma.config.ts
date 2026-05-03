import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma only auto-loads .env, not .env.local — load it manually
config({ path: ".env.local" });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
});
