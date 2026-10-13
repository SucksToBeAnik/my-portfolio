import { SectionHeader } from "@/components/SectionHeader";

interface TrackItem {
  id: number;
  title: string;
  subtitle: string;
  role: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean | null;
  url: string | null;
}

function year(date: string): string | null {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function yearRange(item: TrackItem): string {
  const start = year(item.startDate) ?? "";
  if (item.current) return `${start}–`;
  const end = item.endDate ? year(item.endDate) : null;
  return end && end !== start ? `${start}–${end}` : start;
}

function Row({ item }: { item: TrackItem }) {
  const inner = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-fg">{item.title}</p>
        {item.subtitle && <p className="truncate text-xs text-muted">{item.subtitle}</p>}
      </div>
      <div className="shrink-0 text-right">
        {item.role && (
          <p className="font-heading text-[11px] uppercase tracking-wider text-fg/60">
            {item.role}
          </p>
        )}
        <p className="font-heading text-[11px] uppercase tracking-wider text-muted">
          {yearRange(item)}
        </p>
      </div>
    </>
  );

  const cls =
    "flex items-start justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0";

  return item.url ? (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} transition-colors hover:bg-fg/[0.04]`}
    >
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** A dated list of life events — work history as "Experience", degrees as "Education". */
export function CareerTrack({ items, label }: { items: TrackItem[]; label: string }) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => {
    const ay = year(a.startDate) ?? "0";
    const by = year(b.startDate) ?? "0";
    return by.localeCompare(ay);
  });

  return (
    <section>
      <SectionHeader label={label} />
      <div className="overflow-hidden rounded-2xl border border-hairline bg-fg/[0.03]">
        {sorted.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
