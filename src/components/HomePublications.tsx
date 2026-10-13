import { PublicationEntry, type PublicationView } from "@/components/publications/PublicationEntry";
import { VenueLegend } from "@/components/publications/VenueLegend";
import { SectionHeader } from "@/components/SectionHeader";
import {
  type PublicationLink,
  parseAuthors,
  publicationYear,
  type Venue,
} from "@/lib/publications";

interface PublicationRow {
  id: number;
  title: string;
  url: string | null;
  authors: string | null;
  venues: Venue[] | null;
  links: PublicationLink[] | null;
  bibtex: string | null;
  description: string | null;
  publishedOn: string | null;
}

const FOOTNOTES: Record<string, string> = {
  "*": "equal contribution",
  "†": "corresponding author",
};

export function HomePublications({ publications }: { publications: PublicationRow[] }) {
  if (publications.length === 0) return null;

  const views: (PublicationView & { year: string })[] = publications.map((p) => {
    const venues = p.venues ?? [];
    return {
      ...p,
      authors: parseAuthors(p.authors),
      venues,
      links: p.links ?? [],
      year: publicationYear({ publishedOn: p.publishedOn, venues }),
    };
  });

  const types = new Set(views.flatMap((v) => v.venues.map((venue) => venue.type)));
  const marks = new Set(views.flatMap((v) => v.authors.flatMap((a) => [...a.marks])));
  const footnotes = Object.entries(FOOTNOTES).filter(([mark]) => marks.has(mark));

  return (
    <section>
      <SectionHeader label="Publications" bordered />
      {types.size > 1 && <VenueLegend types={types} />}
      <div className="space-y-7">
        {views.map((pub) => (
          <PublicationEntry key={pub.id} pub={pub} year={pub.year} />
        ))}
      </div>
      {footnotes.length > 0 && (
        <p className="pt-6 text-[11px] text-muted">
          {footnotes.map(([mark, label]) => (
            <span key={mark} className="mr-3">
              <sup>{mark}</sup> {label}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
