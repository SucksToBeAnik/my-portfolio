import { SectionHeader } from "@/components/SectionHeader";

interface AwardItem {
  id: number;
  title: string;
  detail: string | null;
  year: string | null;
  url: string | null;
}

function Row({ award }: { award: AwardItem }) {
  const inner = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{award.title}</p>
        {award.detail && <p className="text-xs text-muted">{award.detail}</p>}
      </div>
      {award.year && (
        <p className="shrink-0 font-heading text-[11px] uppercase tracking-wider text-muted">
          {award.year}
        </p>
      )}
    </>
  );

  // Same row treatment as CareerTrack, so the home page's boxed lists match.
  const cls =
    "flex items-start justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0";

  return award.url ? (
    <a
      href={award.url}
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

/** Honors and awards, in the order set from the admin dashboard. */
export function AwardsList({ awards }: { awards: AwardItem[] }) {
  if (awards.length === 0) return null;

  return (
    <section>
      <SectionHeader label="Honors & Awards" />
      <div className="overflow-hidden rounded-2xl border border-hairline bg-fg/[0.03]">
        {awards.map((award) => (
          <Row key={award.id} award={award} />
        ))}
      </div>
    </section>
  );
}
