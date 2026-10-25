import { format, parseISO } from "date-fns";
import { getDailyVisitors, TRACKING_STARTED } from "@/lib/visitors";

const DAYS = 30;

function dayLabel(day: string) {
  return format(parseISO(day), "MMM d");
}

// Keep the first and last few tooltips inside the card instead of centring
// them over a bar at the edge.
function tooltipAlign(i: number) {
  if (i < 4) return "left-0";
  if (i > DAYS - 5) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

export async function VisitorStats() {
  const data = await getDailyVisitors(DAYS);
  const tracked = data.flatMap((d) => (d.visitors === null ? [] : [d.visitors]));
  const today = data[data.length - 1].visitors ?? 0;
  const yesterday = data[data.length - 2].visitors;
  // Averaged over tracked days only — untracked days aren't zeros.
  const average = Math.round(tracked.reduce((sum, v) => sum + v, 0) / tracked.length);
  const max = Math.max(1, ...tracked);
  const hasVisits = tracked.some((v) => v > 0);

  return (
    <section className="relative border border-hairline rounded-xl p-4 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-fg/50">Unique visitors today</p>
          <p className="text-4xl font-heading tabular-nums">{today}</p>
        </div>
        <dl className="flex gap-5 text-right">
          <div>
            <dt className="text-[10px] text-fg/50">Yesterday</dt>
            <dd className="text-sm font-medium tabular-nums">{yesterday ?? "–"}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-fg/50">{tracked.length}-day avg</dt>
            <dd className="text-sm font-medium tabular-nums">{average}</dd>
          </div>
        </dl>
      </div>

      {/* pt-7 is headroom for the tooltip over the tallest bar, so it never
          covers the stats above. */}
      <div className="pt-7">
        {hasVisits ? (
          <div className="flex items-end h-24 gap-[2px] border-b border-hairline" aria-hidden>
            {data.map((d, i) =>
              d.visitors === null ? (
                // Before tracking began: no mark, nothing to hover.
                <div key={d.day} className="flex-1" />
              ) : (
                <div key={d.day} className="group relative flex-1 h-full flex items-end">
                  {d.visitors === 0 ? (
                    // A real zero gets a stub so there's visibly something to hover.
                    <div className="w-full h-[2px] rounded-t-[2px] bg-fg/20 group-hover:bg-fg/50" />
                  ) : (
                    <div
                      className={`w-full rounded-t-[4px] ${
                        i === DAYS - 1 ? "bg-fg" : "bg-fg/60 group-hover:bg-fg"
                      }`}
                      style={{ height: `${(d.visitors / max) * 100}%` }}
                    />
                  )}
                  <div
                    className={`pointer-events-none absolute bottom-full mb-1.5 ${tooltipAlign(i)} hidden group-hover:block whitespace-nowrap px-2 py-1 rounded-md bg-fg text-bg text-[10px] z-10`}
                  >
                    <span className="font-medium tabular-nums">{d.visitors}</span>{" "}
                    {d.visitors === 1 ? "visitor" : "visitors"} · {dayLabel(d.day)}
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center gap-1 border-b border-hairline text-center">
            <p className="text-xs text-fg/60">No visitors yet</p>
            <p className="text-[10px] text-fg/40">Counting since {dayLabel(TRACKING_STARTED)}</p>
          </div>
        )}
        <div className="flex justify-between pt-1.5 text-[10px] text-fg/40" aria-hidden>
          <span>{dayLabel(data[0].day)}</span>
          <span>Today</span>
        </div>
      </div>

      {/* sr-only goes on a wrapper, not the table: Firefox doesn't clip a
          table's caption, so it leaked out and floated over the page. */}
      <div className="sr-only">
        <table>
          <caption>Unique visitors per day, last {DAYS} days</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Visitors</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day}>
                <td>{d.day}</td>
                <td>{d.visitors ?? "not tracked"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
