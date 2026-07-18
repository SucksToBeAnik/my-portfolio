import { Star, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { db } from "@/db";
import { media } from "@/db/schema";

export const metadata = {
  title: "Watch",
  description: "Movies and series I've watched or plan to watch.",
  openGraph: {
    title: "Watch",
    description: "Movies and series I've watched or plan to watch.",
    url: "/media",
  },
  twitter: {
    title: "Watch",
    description: "Movies and series I've watched or plan to watch.",
  },
};

export const revalidate = 3600;

export default async function WatchPage() {
  const items = await db.select().from(media).orderBy(asc(media.sortOrder));

  const statusLabels: Record<string, string> = {
    watching: "Watching",
    watched: "Watched",
    planned: "Plan to Watch",
    dropped: "Dropped",
  };

  const statusOrder = ["watching", "watched", "planned", "dropped"];
  const grouped: { label: string; items: typeof items }[] = [];
  for (const s of statusOrder) {
    const g = items.filter((i) => i.status === s);
    if (g.length > 0) grouped.push({ label: statusLabels[s], items: g });
  }

  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "What I Watch" }]} />
      </div>

      {grouped.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-heading mb-3 uppercase tracking-wider text-muted">
            {group.label}
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={`/media/${item.id}`}
                className="group relative block overflow-hidden rounded-lg bg-hover-bg ring-1 ring-transparent transition duration-200 hover:-translate-y-1 hover:ring-fg/20"
              >
                {item.posterUrl ? (
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    loading="lazy"
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center">
                    <PlayCircle weight="thin" className="w-8 h-8 text-fg/20" />
                  </div>
                )}

                {item.rating ? (
                  <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[10px] font-heading text-white backdrop-blur-sm">
                    <Star weight="fill" className="w-2.5 h-2.5" />
                    {item.rating}
                  </span>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-2 pt-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <h2 className="font-heading text-[11px] uppercase leading-snug tracking-wide text-white line-clamp-2">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-1 text-[10px] text-white/70">
                    <span>
                      {item.type === "series"
                        ? item.seasons
                          ? `Series · S${item.seasons}`
                          : "Series"
                        : "Movie"}
                    </span>
                    {item.year && <span>· {item.year}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
