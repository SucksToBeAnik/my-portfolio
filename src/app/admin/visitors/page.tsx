import { VisitorEmailToggle } from "@/components/VisitorEmailToggle";
import { VisitorList } from "@/components/VisitorList";
import { VisitorMap, type VisitorMapPoint } from "@/components/VisitorMap";
import { VisitorStats } from "@/components/VisitorStats";
import { visitorEmailsEnabled } from "@/lib/visitor-email";
import { placeName } from "@/lib/visitor-format";
import { getVisitorLog, type VisitorLogEntry } from "@/lib/visitors";

export const metadata = {
  title: "Visitors | Admin",
};

const LIMIT = 200;

/** One dot per place; Vercel gives everyone in a city the same coordinates. */
function mapPoints(visitors: VisitorLogEntry[]): VisitorMapPoint[] {
  const points = new Map<string, VisitorMapPoint>();
  for (const v of visitors) {
    if (v.latitude === null || v.longitude === null) continue;
    const label = placeName(v);
    const point = points.get(label);
    if (point) point.visitors++;
    else points.set(label, { lat: v.latitude, lng: v.longitude, label, visitors: 1 });
  }
  return [...points.values()];
}

export default async function VisitorsPage() {
  const [visitors, emailsEnabled] = await Promise.all([
    getVisitorLog(LIMIT),
    visitorEmailsEnabled(),
  ]);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md">
        <h1 className="text-lg font-heading">Visitors</h1>
      </div>
      <VisitorStats />
      <VisitorMap points={mapPoints(visitors)} />
      <VisitorEmailToggle enabled={emailsEnabled} />
      <VisitorList visitors={visitors} />
    </div>
  );
}
