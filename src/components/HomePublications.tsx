import { HomeListRow } from "@/components/HomeListRow";
import { SectionHeader } from "@/components/SectionHeader";

interface PublicationItem {
  id: number;
  title: string;
  url: string | null;
  publishedOn: string | null;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function HomePublications({ publications }: { publications: PublicationItem[] }) {
  if (publications.length === 0) return null;

  return (
    <section>
      <SectionHeader label="Publications" />
      <div>
        {publications.map((pub) => (
          <HomeListRow
            key={pub.id}
            title={pub.title}
            meta={pub.publishedOn ? fmtDate(pub.publishedOn) : undefined}
            href={pub.url ?? undefined}
            external
          />
        ))}
      </div>
    </section>
  );
}
