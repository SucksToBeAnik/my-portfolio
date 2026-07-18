import { Star } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { BookCover3D } from "@/components/BookCover3D";
import { ShareButton } from "@/components/ShareButton";
import { db } from "@/db";
import { books } from "@/db/schema";
import { stripHtml, truncate } from "@/lib/seo";

const statusLabels: Record<string, string> = {
  reading: "Currently reading",
  read: "Read",
  want_to_read: "Want to read",
};

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await db
    .select({
      title: books.title,
      author: books.author,
      review: books.review,
      coverUrl: books.coverUrl,
      rating: books.rating,
    })
    .from(books)
    .where(eq(books.id, Number(id)))
    .limit(1)
    .then((r) => r[0]);
  if (!book) return { title: "Books" };
  const description = book.review ? stripHtml(book.review) : `By ${book.author}`;
  return {
    title: `${book.title} | Books`,
    description: truncate(description),
    openGraph: {
      title: `${book.title} | Books`,
      description: truncate(description),
      url: `/books/${id}`,
      images: book.coverUrl ? [{ url: book.coverUrl }] : undefined,
    },
    twitter: {
      title: `${book.title} | Books`,
      description: truncate(description),
      images: book.coverUrl ? [book.coverUrl] : undefined,
    },
  };
}

function ratingStars(rating: number | null) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          weight="fill"
          className={`w-4 h-4 ${(rating ?? 0) >= n ? "text-fg" : "text-fg/30"}`}
        />
      ))}
    </span>
  );
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = (
    await db
      .select()
      .from(books)
      .where(eq(books.id, Number(id)))
      .limit(1)
  )[0];
  if (!book) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            author: book.author,
            ...(book.coverUrl ? { image: book.coverUrl } : {}),
            ...(book.rating
              ? {
                  review: {
                    "@type": "Review",
                    reviewRating: { "@type": "Rating", ratingValue: book.rating },
                  },
                }
              : {}),
          }),
        }}
      />
      <div className="space-y-6">
        <BackButton label="Books" fallbackHref="/books" />

        {/* Background panel — the book breaks out above its top edge, and all
            the content sits on the panel, which runs the full column width. */}
        <div className="mt-24 rounded-3xl border border-hairline bg-fg/[0.03] p-6 md:mt-28 md:p-10">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
            <div className="-mt-28 shrink-0 md:-mt-32">
              <BookCover3D coverUrl={book.coverUrl} title={book.title} />
            </div>
            <div className="min-w-0 flex-1 space-y-4 text-center sm:pt-2 sm:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 font-heading text-[10px] uppercase tracking-[0.2em] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-fg" />
                {statusLabels[book.status] ?? book.status}
              </span>
              <h1 className="text-3xl font-heading leading-tight md:text-4xl">{book.title}</h1>
              <p className="font-heading text-sm text-muted">{book.author}</p>
              {book.quote && (
                <p className="text-sm italic text-fg/70">&ldquo;{book.quote}&rdquo;</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 sm:justify-start">
                <ShareButton title={book.title} />
              </div>
            </div>
          </div>

          {/* Description + Details, on the same panel */}
          <div className="mt-10 grid gap-8 border-t border-hairline pt-8 sm:grid-cols-[1fr_180px] sm:gap-12">
            <div>
              <h2 className="mb-3 font-heading text-[10px] uppercase tracking-[0.2em] text-muted">
                Description
              </h2>
              {book.review ? (
                <div
                  className="prose-content space-y-3 text-sm text-fg/80"
                  dangerouslySetInnerHTML={{ __html: book.review }}
                />
              ) : (
                <p className="text-sm text-muted">No description yet.</p>
              )}
            </div>

            {(book.rating || book.category) && (
              <div>
                <h2 className="mb-3 font-heading text-[10px] uppercase tracking-[0.2em] text-muted">
                  Details
                </h2>
                <dl className="space-y-4 text-sm">
                  {book.rating ? (
                    <div className="space-y-1">
                      <dt className="text-xs text-muted">Rating</dt>
                      <dd>{ratingStars(book.rating)}</dd>
                    </div>
                  ) : null}
                  {book.category && (
                    <div className="space-y-1.5">
                      <dt className="text-xs text-muted">Category</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {book.category.split(",").map((c) => (
                          <span
                            key={c.trim()}
                            className="rounded bg-hover-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg/50"
                          >
                            {c.trim()}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
