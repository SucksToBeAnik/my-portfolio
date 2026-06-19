import { db } from "@/db";
import { lifeEvents } from "@/db/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LifeImage } from "@/components/LifeImage";
import { LinkPreview } from "@/components/LinkPreview";
import {
  Briefcase,
  GraduationCap,
  Compass,
  Star,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";

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

function dateRange(start: string, end: string | null, current: boolean | null) {
  const s = formatDate(start);
  if (end) return `${s} - ${formatDate(end)}`;
  if (current) return `${s} - Present`;
  return s;
}

const typeIcons: Record<string, React.ReactNode> = {
  education: <GraduationCap weight="thin" className="w-4 h-4" />,
  work: <Briefcase weight="thin" className="w-4 h-4" />,
  travel: <Compass weight="thin" className="w-4 h-4" />,
  milestone: <Star weight="thin" className="w-4 h-4" />,
};

export default async function LifePage() {
  const items = await db
    .select()
    .from(lifeEvents)
    .orderBy(lifeEvents.sortOrder);

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
            <span className="absolute left-[-24px] top-2.5 text-fg/70">
              {typeIcons[event.type] || <span className="block w-2.5 h-2.5 rounded-full bg-fg" />}
            </span>
            <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
              {event.imageUrl ? (
                <LifeImage src={event.imageUrl} alt={event.title} />
              ) : (
                <div className="w-16 h-16 shrink-0" />
              )}
              <div>
                  <p className="text-xs text-muted mb-0.5">{dateRange(event.startDate, event.endDate, event.current)}</p>
                  {event.location && (
                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-fg transition-colors"
                    >
                      <MapPin weight="thin" className="w-3 h-3" />
                      {event.location}
                    </a>
                  )}
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
