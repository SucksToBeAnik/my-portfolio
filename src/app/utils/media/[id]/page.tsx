import { ArrowLeft, Stack, Star } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaItem } from "@/actions/media";
import { SourceLink } from "./SourceLink";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMediaItem(Number(id));
  if (!item) return {};
  return { title: `${item.title} — Suckstobeanik` };
}

const statusLabels: Record<string, string> = {
  watching: "Watching",
  watched: "Watched",
  planned: "Plan to Watch",
  dropped: "Dropped",
};

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMediaItem(Number(id));
  if (!item) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/utils?tab=media"
          className="flex items-center gap-1.5 text-xs font-heading text-muted hover:text-fg transition-colors"
        >
          <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
          Media
        </Link>
        {item.imdbUrl && <SourceLink url={item.imdbUrl} />}
      </div>

      <div className="flex gap-6">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-28 sm:w-36 shrink-0 rounded-xl object-cover self-start"
          />
        ) : (
          <div className="w-28 sm:w-36 shrink-0 aspect-[2/3] rounded-xl bg-hover-bg" />
        )}

        <div className="min-w-0 flex-1 space-y-3 pt-1">
          <div className="space-y-1">
            <h1 className="text-xl font-heading leading-tight">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-fg/50">
              {item.year && <span>{item.year}</span>}
              <span className="px-1.5 py-0.5 rounded bg-fg/10 text-fg/60 text-[10px] font-heading uppercase tracking-wider">
                {item.type === "series" ? "Series" : "Movie"}
              </span>
              {item.type === "series" && item.seasons && (
                <span className="inline-flex items-center gap-1 text-fg/40 text-[10px]">
                  <Stack weight="regular" className="w-3 h-3" />
                  {item.seasons} season{item.seasons > 1 ? "s" : ""}
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-fg/5 text-fg/40 text-[10px]">
                {statusLabels[item.status]}
              </span>
            </div>
          </div>

          {item.rating && (
            <span className="inline-flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  weight="fill"
                  className={`w-3.5 h-3.5 ${(item.rating ?? 0) >= n ? "text-fg" : "text-fg/20"}`}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      {item.review && (
        <div className="space-y-2">
          <p className="text-[11px] font-heading text-fg/30 uppercase tracking-wider">My Take</p>
          <blockquote className="border-l-2 border-hairline pl-4 text-sm text-fg/70 italic leading-relaxed">
            {item.review}
          </blockquote>
        </div>
      )}

      {item.plot && (
        <div className="space-y-2">
          <p className="text-[11px] font-heading text-fg/30 uppercase tracking-wider">Plot</p>
          <p className="text-sm text-fg/60 leading-relaxed">{item.plot}</p>
        </div>
      )}
    </div>
  );
}
