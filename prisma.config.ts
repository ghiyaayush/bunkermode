import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
  datasource: {
    // Direct port 5432 for migrations/DDL (pgbouncer pooled port 6543 doesn't support DDL)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
