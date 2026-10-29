import type { VisitorDetail } from "@/lib/visitors";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

type Place = Pick<VisitorDetail, "city" | "region" | "country">;

/** "Berlin, Germany"; Vercel only sends a region code when the city is unknown. */
export function placeName(v: Place): string {
  const country = v.country ? (countryNames.of(v.country) ?? v.country) : null;
  return [v.city ?? v.region, country].filter(Boolean).join(", ") || "Unknown location";
}

/** "2:10 PM" in the given zone. */
export function clock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(
    date,
  );
}

/** "45s", "4m 10s", "1h 5m". */
export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes}m ${seconds % 60}s` : `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** "Chrome on macOS · desktop · from linkedin.com" */
export function visitSummary(
  v: Pick<VisitorDetail, "browser" | "os" | "device" | "referrer">,
): string {
  return [
    [v.browser, v.os].filter(Boolean).join(" on "),
    v.device,
    v.referrer ? `from ${v.referrer}` : "direct",
  ]
    .filter(Boolean)
    .join(" · ");
}
