import "server-only";
import { createHmac } from "node:crypto";
import Bowser from "bowser";
import { asc, count, desc, gte, isNotNull, sql } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { dailyVisitors, visitEvents } from "@/db/schema";
import { env } from "@/lib/env";

// Days roll over at midnight in my timezone, matching the home footer clock.
export const TIME_ZONE = "Asia/Dhaka";

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

export type VisitInput = {
  ip: string;
  userAgent: string;
  path: string;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** Keep the existing value, filling it from this beacon if it was never set. */
function keep(column: AnySQLiteColumn) {
  return sql`coalesce(${column}, excluded.${sql.identifier(column.name)})`;
}

/**
 * One row per visitor per day. The first beacon sets where they are and where
 * they came from; later ones bump `lastSeenAt` and append any new page.
 * Resolves to the new row when this was the visitor's first beacon of the day.
 */
export async function recordVisit(visit: VisitInput): Promise<VisitorDetail | null> {
  const now = new Date();
  const day = visitorDay(now);
  const { browser, os, platform } = Bowser.parse(visit.userAgent);
  const values = {
    day,
    visitorHash: hashVisitor(day, visit.ip, visit.userAgent),
    firstSeenAt: now,
    lastSeenAt: now,
    country: visit.country,
    region: visit.region,
    city: visit.city,
    timezone: visit.timezone,
    latitude: visit.latitude,
    longitude: visit.longitude,
    referrer: visit.referrer,
    pages: [visit.path],
    browser: browser.name || null,
    os: os.name || null,
    device: platform.type || null,
  };

  // Try the plain insert first: an upsert can't report whether it inserted,
  // and a new row is what triggers the notification email.
  const [inserted] = await db
    .insert(dailyVisitors)
    .values(values)
    .onConflictDoNothing()
    .returning();
  if (inserted) return inserted;

  const pages = dailyVisitors.pages;
  await db
    .insert(dailyVisitors)
    .values(values)
    .onConflictDoUpdate({
      target: [dailyVisitors.day, dailyVisitors.visitorHash],
      set: {
        lastSeenAt: now,
        // Rows from before the details existed get them on their next beacon.
        firstSeenAt: keep(dailyVisitors.firstSeenAt),
        country: keep(dailyVisitors.country),
        region: keep(dailyVisitors.region),
        city: keep(dailyVisitors.city),
        timezone: keep(dailyVisitors.timezone),
        latitude: keep(dailyVisitors.latitude),
        longitude: keep(dailyVisitors.longitude),
        referrer: keep(dailyVisitors.referrer),
        browser: keep(dailyVisitors.browser),
        os: keep(dailyVisitors.os),
        device: keep(dailyVisitors.device),
        pages: sql`case
          when ${pages} is null then json_array(${visit.path})
          when exists (select 1 from json_each(${pages}) where value = ${visit.path}) then ${pages}
          else json_insert(${pages}, '$[#]', ${visit.path})
        end`,
      },
    });
  return null;
}

export type VisitEventInput =
  | { type: "time"; path: string; durationMs: number }
  | { type: "click"; path: string; href: string; label: string | null };

export async function recordVisitEvent(ip: string, userAgent: string, event: VisitEventInput) {
  const day = visitorDay(new Date());
  await db.insert(visitEvents).values({
    day,
    visitorHash: hashVisitor(day, ip, userAgent),
    ...event,
  });
}

export type VisitorDetail = typeof dailyVisitors.$inferSelect;

export type VisitorPage = { path: string; durationMs: number };
export type VisitorClick = { path: string; href: string; label: string | null };

/** A visitor's day: where they were, each page with its visible time, and what they clicked. */
export type VisitorLogEntry = VisitorDetail & {
  pageTimes: VisitorPage[];
  clicks: VisitorClick[];
  activeMs: number;
};

const visitorKey = (day: string, hash: string) => `${day}:${hash}`;

/** Most recently active visitors that have details, newest first. */
export async function getVisitorLog(limit: number): Promise<VisitorLogEntry[]> {
  const visitors = await db
    .select()
    .from(dailyVisitors)
    .where(isNotNull(dailyVisitors.firstSeenAt))
    .orderBy(desc(dailyVisitors.lastSeenAt))
    .limit(limit);
  if (visitors.length === 0) return [];

  const oldest = visitors.reduce((min, v) => (v.day < min ? v.day : min), visitors[0].day);
  const events = await db
    .select()
    .from(visitEvents)
    .where(gte(visitEvents.day, oldest))
    .orderBy(asc(visitEvents.at));

  const byVisitor = Map.groupBy(events, (e) => visitorKey(e.day, e.visitorHash));

  return visitors.map((v) => {
    const own = byVisitor.get(visitorKey(v.day, v.visitorHash)) ?? [];
    const time = new Map<string, number>();
    const clicks: VisitorClick[] = [];
    for (const e of own) {
      if (e.type === "time") time.set(e.path, (time.get(e.path) ?? 0) + (e.durationMs ?? 0));
      else if (e.href) clicks.push({ path: e.path, href: e.href, label: e.label });
    }
    return {
      ...v,
      pageTimes: (v.pages ?? []).map((path) => ({ path, durationMs: time.get(path) ?? 0 })),
      clicks,
      activeMs: [...time.values()].reduce((sum, ms) => sum + ms, 0),
    };
  });
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
