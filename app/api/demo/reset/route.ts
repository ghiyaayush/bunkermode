import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Wipe transient demo state so the Kelp replay starts clean each time.
 * Production version would scope by demo wallet only.
 */
export async function POST() {
  await db.signalLink.deleteMany({});
  await db.event.deleteMany({});
  await db.signal.deleteMany({});
  return NextResponse.json({ ok: true });
}
