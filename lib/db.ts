import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function build(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Lazy fallback: at import time we may have no env (e.g. building static
    // pages). Routes that actually hit the DB will fail with a clearer error
    // when they execute, instead of crashing the whole server on import.
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error("DATABASE_URL is not set; cannot reach Postgres");
      },
    });
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? build();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
