import { Star, Stack, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { db } from "@/db";
import { media } from "@/db/schema";

export const metadata = {
  title: "Watch | Suckstobeanik",
  description: "Movies and series I've watched or plan to watch.",
  openGraph: {
    title: "Watch | Suckstobeanik",
    description: "Movies and series I've watched or plan to watch.",
    url: "/media",
  },
  twitter: {
    title: "Watch | Suckstobeanik",
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
        <Breadcrumb crumbs={[{ label: "Watch" }]} />
      </div>

      {grouped.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-heading mb-3 uppercase tracking-wider text-muted">
            {group.label}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={`/utils/media/${item.id}`}
                className="group relative flex flex-col border border-hairline rounded-xl overflow-hidden transition-colors hover:bg-hover-bg"
              >
                <div className="aspect-[2/3] bg-hover-bg overflow-hidden">
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle weight="thin" className="w-8 h-8 text-fg/20" />
                    </div>
                  )}
                </div>
                <div className="p-2.5 space-y-1.5">
                  <p className="text-xs font-medium leading-tight line-clamp-2">{item.title}</p>
                  <div className="flex items-center flex-wrap gap-1 text-[10px]">
                    <span className="px-1 py-px rounded font-heading uppercase tracking-wider bg-fg/10 text-fg/60">
                      {item.type === "series" ? "Series" : "Movie"}
                    </span>
                    {item.type === "series" && item.seasons && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-px rounded bg-fg/5 text-fg/50">
                        <Stack weight="regular" className="w-2.5 h-2.5" />
                        {item.seasons}
                      </span>
                    )}
                    {item.year && <span className="text-fg/40">{item.year}</span>}
                  </div>
                  {item.rating ? (
                    <span className="inline-flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          weight="fill"
                          className={`w-2.5 h-2.5 ${(item.rating ?? 0) >= n ? "text-fg" : "text-fg/30"}`}
                        />
                      ))}
                    </span>
                  ) : null}
                  {item.review && (
                    <>
                      <div className="h-px bg-hairline" />
                      <p className="text-[10px] text-fg/50 italic leading-relaxed line-clamp-3">
                        &ldquo;{item.review}&rdquo;
                      </p>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
