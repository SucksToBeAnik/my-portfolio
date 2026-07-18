import { SectionHeader } from "@/components/SectionHeader";
import { stripHtml } from "@/lib/seo";

interface WorkItem {
  id: number;
  title: string;
  description: string | null;
  role: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean | null;
}

function year(date: string): string | null {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function yearRange(item: WorkItem): string {
  const start = year(item.startDate) ?? "";
  if (item.current) return `${start}–`;
  const end = item.endDate ? year(item.endDate) : null;
  return end && end !== start ? `${start}–${end}` : start;
}

export function CareerTrack({ items }: { items: WorkItem[] }) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => {
    const ay = year(a.startDate) ?? "0";
    const by = year(b.startDate) ?? "0";
    return by.localeCompare(ay);
  });

  return (
    <section>
      <SectionHeader label="Experience" />
      <div className="overflow-hidden rounded-2xl border border-hairline bg-fg/[0.03]">
        {sorted.map((item) => {
          const subtitle = item.description ? stripHtml(item.description) : "";
          return (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
