import { isbot } from "isbot";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { recordVisit } from "@/lib/visitors";

const noContent = () => new Response(null, { status: 204 });

/**
 * Beacon target for the daily unique-visitor count. Always answers 204 so the
 * page never learns whether (or why) a visit was skipped.
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

  await recordVisit(ip, userAgent);
  return noContent();
}
