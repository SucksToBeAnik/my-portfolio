import { db } from "@/db";
import { lifeEvents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LifeImage } from "@/components/LifeImage";
import { LinkPreview } from "@/components/LinkPreview";

export const metadata = {
  title: "Life — Suckstobeanik",
  description: "Personal milestones, achievements, and travels.",
};

function formatDate(date: string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function dateRange(start: string, end: string | null) {
  const s = formatDate(start);
  if (!end) return `${s} — Present`;
  return `${s} — ${formatDate(end)}`;
}

export default async function LifePage() {
  const items = await db
    .select()
    .from(lifeEvents)
    .orderBy(desc(lifeEvents.startDate));

  return (
    <div className="space-y-12">
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Life" }]} />
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted">Nothing here yet.</p>
      )}

      <div className="relative pl-8 space-y-10 before:absolute before:left-[15.5px] before:top-2 before:bottom-2 before:w-px before:bg-hairline">
        {items.map((event) => (
          <article key={event.id} className="relative">
            <span className="absolute left-[-20px] top-1.5 w-2 h-2 rounded-full bg-fg" />
            <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
              {event.imageUrl && (
                <LifeImage src={event.imageUrl} alt={event.title} />
              )}
              <div>
                <p className="text-xs text-muted mb-1">{dateRange(event.startDate, event.endDate)}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-2">{event.type}</p>
                <h2 className="text-base font-heading leading-snug mb-2">
                  {event.url ? (
                    <LinkPreview url={event.url}>
                      <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {event.title}
                      </a>
                    </LinkPreview>
                  ) : (
                    event.title
                  )}
                </h2>
                {event.description && (
                  <div
                    className="text-xs text-fg/80 prose-content"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
