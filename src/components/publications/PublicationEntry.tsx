import { AuthorList } from "@/components/publications/AuthorList";
import { PublicationActions } from "@/components/publications/PublicationActions";
import { VenueBadge } from "@/components/publications/VenueBadge";
import { type Author, type PublicationLink, sortVenues, type Venue } from "@/lib/publications";

export interface PublicationView {
  id: number;
  title: string;
  url: string | null;
  authors: Author[];
  venues: Venue[];
  links: PublicationLink[];
  bibtex: string | null;
  description: string | null;
}

export function PublicationEntry({ pub, year }: { pub: PublicationView; year: string }) {
  // The primary paper link doubles as the first "paper" resource link.
  const links: PublicationLink[] = pub.url
    ? [{ kind: "pdf", url: pub.url }, ...pub.links]
    : pub.links;
  const deduped = links.filter((l, i) => links.findIndex((o) => o.url === l.url) === i);
  const venue = sortVenues(pub.venues)[0];
  const venueLabel = venue ? [venue.name, venue.year].filter(Boolean).join(" ") : "";

  return (
    // Small screens: the year sits on its own line above the title with the
    // actions across from it, so neither eats a column or a row of their own.
    <article className="relative flex flex-col gap-1.5 sm:flex-row sm:gap-4">
      <span className="shrink-0 pt-px font-mono text-[11px] text-muted tabular-nums sm:w-9">
        {year}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        {/* Title and byline read as one unit; the gap below sets the venue apart. */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium leading-snug text-fg">
            {pub.url ? (
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-[3px] decoration-fg/30 hover:underline"
              >
                {pub.title}
              </a>
            ) : (
              pub.title
            )}
          </h3>
          <AuthorList authors={pub.authors} />
        </div>
        {/* Venues on the left, actions pinned to the right of the first one. */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
          {pub.venues.length > 0 && (
            <div className="min-w-0 space-y-1">
              {sortVenues(pub.venues).map((v, i) => (
                <VenueBadge key={`${v.name}-${v.year}-${i}`} venue={v} />
              ))}
            </div>
          )}
          <div className="absolute -top-1 right-0 sm:static">
            <PublicationActions
              links={deduped}
              abstract={pub.description}
              abstractFooter={venueLabel || year}
              bibtex={pub.bibtex}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
