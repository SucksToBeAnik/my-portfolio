import "server-only";
import { createHmac } from "node:crypto";
import { count, gte } from "drizzle-orm";
import { db } from "@/db";
import { dailyVisitors } from "@/db/schema";
import { env } from "@/lib/env";

// Days roll over at midnight in my timezone, matching the home footer clock.
const TIME_ZONE = "Asia/Dhaka";

/** First day the beacon was live. Earlier days have no data, not zero visitors. */
export const TRACKING_STARTED = "2026-10-25";

/** `YYYY-MM-DD` for the given instant, in TIME_ZONE. */
export function visitorDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/**
 * Anonymous per-day visitor id. Keyed by AUTH_SECRET + day so the hash can't be
 * brute-forced back to an IP without the secret, and the same person gets an
 * unrelated id tomorrow.
 */
export function hashVisitor(day: string, ip: string, userAgent: string): string {
  return createHmac("sha256", `${env.AUTH_SECRET}:visitors:${day}`)
    .update(`${ip}\n${userAgent}`)
    .digest("hex");
}

export async function recordVisit(ip: string, userAgent: string) {
  const day = visitorDay(new Date());
  await db
    .insert(dailyVisitors)
    .values({ day, visitorHash: hashVisitor(day, ip, userAgent) })
    .onConflictDoNothing();
}

/** `visitors` is null for days before TRACKING_STARTED. */
export type DailyVisitorCount = { day: string; visitors: number | null };

/**
 * Unique visitors for each of the last `days` days, oldest first. Tracked days
 * with no rows are 0; days before tracking began are null.
 */
export async function getDailyVisitors(days: number): Promise<DailyVisitorCount[]> {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const range = Array.from({ length: days }, (_, i) =>
    visitorDay(new Date(now - (days - 1 - i) * DAY_MS)),
  );

  const rows = await db
    .select({ day: dailyVisitors.day, visitors: count() })
    .from(dailyVisitors)
    .where(gte(dailyVisitors.day, range[0]))
    .groupBy(dailyVisitors.day);

  const byDay = new Map(rows.map((r) => [r.day, r.visitors]));
  return range.map((day) => ({
    day,
    visitors: day < TRACKING_STARTED ? null : (byDay.get(day) ?? 0),
  }));
}
