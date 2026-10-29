import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteConfig } from "@/db/schema";
import { sendEmail } from "@/lib/resend";
import { siteUrl } from "@/lib/seo";
import { clock, placeName, visitSummary } from "@/lib/visitor-format";
import { TIME_ZONE, type VisitorDetail } from "@/lib/visitors";

/** site_config key; anything but "off" means on, so emails start enabled. */
export const VISITOR_EMAILS_KEY = "visitor_emails";

export async function visitorEmailsEnabled(): Promise<boolean> {
  const [row] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, VISITOR_EMAILS_KEY))
    .limit(1);
  return row?.value !== "off";
}

/** One email per new visitor per day, sent through the contact-form inbox. */
export async function notifyNewVisitor(v: VisitorDetail) {
  if (!(await visitorEmailsEnabled())) return;

  const seen = v.firstSeenAt ?? new Date();
  const place = placeName(v);
  const theirs =
    v.timezone && clock(seen, v.timezone) !== clock(seen, TIME_ZONE)
      ? ` (${clock(seen, v.timezone)} their time)`
      : "";

  await sendEmail({
    subject: `New visitor from ${place}`,
    text: [
      `Someone from ${place} just opened ${v.pages?.[0] ?? "the site"}.`,
      "",
      visitSummary(v),
      `${clock(seen, TIME_ZONE)}${theirs}`,
      "",
      `All visitors: ${siteUrl("/admin/visitors")}`,
    ].join("\n"),
  });
}
