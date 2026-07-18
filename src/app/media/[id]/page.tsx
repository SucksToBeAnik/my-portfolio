import { Stack, Star } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { getMediaItem } from "@/actions/media";
import { BackButton } from "@/components/BackButton";
import { MediaCase3D } from "@/components/MediaCase3D";
import { truncate } from "@/lib/seo";
import { SourceLink } from "./SourceLink";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMediaItem(Number(id));
  if (!item) return {};
  const description = item.review || item.plot || `${item.title} (${item.year ?? ""})`;
  return {
    title: `${item.title} | Watch`,
    description: truncate(description),
    openGraph: {
      title: `${item.title} | Watch`,
      description: truncate(description),
      url: `/media/${id}`,
      images: item.posterUrl ? [{ url: item.posterUrl }] : undefined,
    },
    twitter: {
      title: `${item.title} | Watch`,
      description: truncate(description),
      images: item.posterUrl ? [item.posterUrl] : undefined,
    },
  };
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": item.type === "movie" ? "Movie" : "TVSeries",
            name: item.title,
            ...(item.year ? { datePublished: item.year } : {}),
            ...(item.posterUrl ? { image: item.posterUrl } : {}),
            ...(item.rating
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: item.rating } }
              : {}),
          }),
        }}
      />
      <div className="space-y-6">
        <BackButton label="What I Watch" fallbackHref="/media" />

        {/* Background panel — the case breaks out above its top edge, and all
            the content sits on the panel, which runs the full column width. */}
        <div className="mt-24 rounded-3xl border border-hairline bg-fg/[0.03] p-6 md:mt-28 md:p-10">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
            <div className="-mt-28 shrink-0 md:-mt-32">
              <MediaCase3D posterUrl={item.posterUrl} title={item.title} />
            </div>
            <div className="min-w-0 flex-1 space-y-4 text-center sm:pt-2 sm:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 font-heading text-[10px] uppercase tracking-[0.2em] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-fg" />
                {statusLabels[item.status] ?? item.status}
              </span>
              <h1 className="text-3xl font-heading leading-tight md:text-4xl">{item.title}</h1>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-fg/50 sm:justify-start">
                {item.year && <span>{item.year}</span>}
                <span className="rounded bg-fg/10 px-1.5 py-0.5 font-heading text-[10px] uppercase tracking-wider text-fg/60">
                  {item.type === "series" ? "Series" : "Movie"}
                </span>
                {item.type === "series" && item.seasons && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-fg/40">
                    <Stack weight="regular" className="w-3 h-3" />
                    {item.seasons} season{item.seasons > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {item.rating && (
                <span className="inline-flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      weight="fill"
                      className={`w-4 h-4 ${(item.rating ?? 0) >= n ? "text-fg" : "text-fg/30"}`}
                    />
                  ))}
                </span>
              )}
              {item.imdbUrl && (
                <div className="flex items-center justify-center pt-2 sm:justify-start">
                  <SourceLink url={item.imdbUrl} />
                </div>
              )}
            </div>
          </div>

          {/* My Take is the primary block — it's the value I add. Plot is a
              small, de-emphasized footnote for context. */}
          {item.review && (
            <div className="mt-10 border-t border-hairline pt-8">
              <h2 className="mb-3 font-heading text-[10px] uppercase tracking-[0.2em] text-muted">
                My Take
              </h2>
              <blockquote className="border-l-2 border-fg/30 pl-5 text-base italic leading-relaxed text-fg/90">
                {item.review}
              </blockquote>
            </div>
          )}

          {item.plot && (
            <div className={item.review ? "mt-8" : "mt-10 border-t border-hairline pt-8"}>
              <h2 className="mb-2 font-heading text-[10px] uppercase tracking-[0.2em] text-muted">
                Plot
              </h2>
              <p className="text-xs leading-relaxed text-fg/45">{item.plot}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
