import { ProgressRing } from "@/components/ProgressRing";
import { clock, formatDuration, placeName } from "@/lib/visitor-format";
import { TIME_ZONE, type VisitorLogEntry } from "@/lib/visitors";

function clickTarget(href: string): string {
  try {
    const url = new URL(href);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return href;
  }
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-fg/50">{label}</dt>
      <dd className="text-xs truncate">{value}</dd>
      {sub && <dd className="text-[11px] text-fg/50 truncate capitalize">{sub}</dd>}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="text-[10px] text-fg/50 mb-1.5">{children}</p>;
}

/** One visitor's day as a card: where and when, how they got here, and what they read. */
export function VisitorRow({ v }: { v: VisitorLogEntry }) {
  // firstSeenAt is non-null: getVisitorLog only returns rows with details.
  const seen = v.firstSeenAt as Date;
  const theirTime =
    v.timezone && clock(seen, v.timezone) !== clock(seen, TIME_ZONE)
      ? `${clock(seen, v.timezone)} their time`
      : null;
  const longestPage = Math.max(1, ...v.pageTimes.map((p) => p.durationMs));

  return (
    <li className="border border-hairline rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{placeName(v)}</p>
          {theirTime && <p className="text-[11px] text-fg/50">{theirTime}</p>}
        </div>
        <p className="shrink-0 text-sm tabular-nums">{clock(seen, TIME_ZONE)}</p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Fact
          label="Device"
          value={[v.browser, v.os].filter(Boolean).join(" on ") || "Unknown"}
          sub={v.device}
        />
        <Fact label="Came from" value={v.referrer ?? "Direct"} />
        <Fact label="Time on site" value={v.activeMs >= 1000 ? formatDuration(v.activeMs) : "–"} />
      </dl>

      {v.pageTimes.length > 0 && (
        <div className="border-t border-hairline pt-3">
          <SectionLabel>Pages, in order</SectionLabel>
          <ol className="space-y-1.5">
            {v.pageTimes.map((p) => (
              <li
                key={p.path}
                className="flex items-center justify-between gap-3 font-mono text-[11px]"
              >
                <span className="truncate">{p.path}</span>
                <span className="flex items-center gap-1.5 shrink-0 text-fg/50 tabular-nums">
                  {p.durationMs >= 1000 ? formatDuration(p.durationMs) : "–"}
                  <ProgressRing value={p.durationMs / longestPage} className="text-fg" />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {v.clicks.length > 0 && (
        <div className="border-t border-hairline pt-3">
          <SectionLabel>Clicked</SectionLabel>
          <ul className="space-y-1">
            {v.clicks.map((c, i) => (
              // Clicks can repeat, so position is the stable key.
              <li key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
                <span className="truncate">↗ {c.label ?? clickTarget(c.href)}</span>
                <span className="truncate text-fg/50">{clickTarget(c.href)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
