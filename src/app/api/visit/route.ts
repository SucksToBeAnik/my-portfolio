import { isbot } from "isbot";
import { after } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { notifyNewVisitor } from "@/lib/visitor-email";
import { recordVisit, recordVisitEvent } from "@/lib/visitors";

const noContent = () => new Response(null, { status: 204 });

const path = z.string().startsWith("/").max(300);

const beaconSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("view"), path, referrer: z.string().max(500).optional() }),
  // Capped at 6h: a tab left open and visible overnight isn't reading time.
  z.object({
    type: z.literal("time"),
    path,
    ms: z
      .number()
      .int()
      .min(0)
      .max(6 * 60 * 60 * 1000),
  }),
  z.object({
    type: z.literal("click"),
    path,
    href: z.string().max(500),
    label: z.string().max(120).optional(),
  }),
]);

/** Vercel URI-encodes the city header ("S%C3%A3o%20Paulo"). */
function geoHeader(req: Request, name: string): string | null {
  const value = req.headers.get(`x-vercel-ip-${name}`);
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function geoNumber(req: Request, name: string): number | null {
  const value = Number.parseFloat(req.headers.get(`x-vercel-ip-${name}`) ?? "");
  return Number.isFinite(value) ? value : null;
}

/** Hostname of an off-site referrer; internal hops and junk are null. */
function externalReferrer(referrer: string | undefined, req: Request): string | null {
  if (!referrer) return null;
  try {
    const bare = (url: string) => new URL(url).hostname.replace(/^www\./, "");
    const host = bare(referrer);
    return host === bare(req.url) ? null : host;
  } catch {
    return null;
  }
}

/**
 * Beacon target for the visitor log. Always answers 204 so the page never
 * learns whether (or why) a visit was skipped.
 */
export async function POST(req: Request) {
  // Dev and preview deployments share the production database; only count
  // real traffic.
  if (env.VERCEL_ENV !== "production") return noContent();

  const userAgent = req.headers.get("user-agent") ?? "";
  if (!userAgent || isbot(userAgent)) return noContent();

  // Vercel overwrites x-forwarded-for with the real client IP, so it can't be
  // spoofed from the browser.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return noContent();

  // Don't count myself.
  if (await auth()) return noContent();

  // sendBeacon posts the JSON as text/plain, so parse the raw body.
  const body = beaconSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return noContent();
  const beacon = body.data;

  if (beacon.type === "time") {
    if (beacon.ms >= 1000) {
      await recordVisitEvent(ip, userAgent, {
        type: "time",
        path: beacon.path,
        durationMs: beacon.ms,
      });
    }
    return noContent();
  }

  if (beacon.type === "click") {
    await recordVisitEvent(ip, userAgent, {
      type: "click",
      path: beacon.path,
      href: beacon.href,
      label: beacon.label || null,
    });
    return noContent();
  }

  const newVisitor = await recordVisit({
    ip,
    userAgent,
    path: beacon.path,
    referrer: externalReferrer(beacon.referrer, req),
    country: geoHeader(req, "country"),
    region: geoHeader(req, "country-region"),
    city: geoHeader(req, "city"),
    timezone: geoHeader(req, "timezone"),
    latitude: geoNumber(req, "latitude"),
    longitude: geoNumber(req, "longitude"),
  });
  // After the response, so the beacon never waits on Resend.
  if (newVisitor) after(() => notifyNewVisitor(newVisitor));
  return noContent();
}
