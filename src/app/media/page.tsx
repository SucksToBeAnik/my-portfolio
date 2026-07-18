import { Star, Stack, PlayCircle } from "@phosphor-icons/react/dist/ssr";
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={`/media/${item.id}`}
                className="group flex h-full flex-col rounded-xl border border-hairline bg-fg/[0.03] p-2.5 transition-colors hover:bg-fg/[0.06]"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <div className="space-y-1">
                    <h2 className="font-heading text-xs uppercase tracking-wide leading-snug line-clamp-2">
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
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
                  </div>
                  {item.review && (
                    <p className="text-[11px] text-fg/55 italic leading-tight line-clamp-3">
                      &ldquo;{item.review}&rdquo;
                    </p>
                  )}
                  <div className="mt-auto overflow-hidden rounded-lg bg-hover-bg">
                    {item.posterUrl ? (
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        loading="lazy"
                        className="aspect-[2/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] w-full items-center justify-center">
                        <PlayCircle weight="thin" className="w-7 h-7 text-fg/20" />
                      </div>
                    )}
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
