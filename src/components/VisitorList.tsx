import { VisitorRow } from "@/components/VisitorRow";
import { type VisitorLogEntry, visitorDay } from "@/lib/visitors";

function dayHeading(day: string): string {
  const now = Date.now();
  if (day === visitorDay(new Date(now))) return "Today";
  if (day === visitorDay(new Date(now - 24 * 60 * 60 * 1000))) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(day));
}

/** The visitor log, one section per day, newest first. */
export function VisitorList({ visitors }: { visitors: VisitorLogEntry[] }) {
  if (visitors.length === 0) {
    return (
      <p className="border border-hairline rounded-xl py-10 text-center text-xs text-fg/60">
        No visitor details yet
      </p>
    );
  }

  const days = Map.groupBy(visitors, (v) => v.day);

  return (
    <div className="space-y-6">
      {[...days].map(([day, entries]) => (
        <section key={day} className="space-y-2">
          <h2 className="flex justify-between px-1 text-xs text-fg/50">
            <span>{dayHeading(day)}</span>
            <span className="tabular-nums">
              {entries.length} {entries.length === 1 ? "visitor" : "visitors"}
            </span>
          </h2>
          <ul className="space-y-3">
            {entries.map((v) => (
              <VisitorRow key={v.visitorHash} v={v} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
