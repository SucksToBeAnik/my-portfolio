import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Star } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Book — Suckstobeanik",
};

function ratingStars(rating: number | null) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} weight="fill" className={`w-4 h-4 ${(rating ?? 0) >= n ? "text-fg" : "text-fg/30"}`} />
      ))}
    </span>
  );
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = (await db.select().from(books).where(eq(books.id, Number(id))).limit(1))[0];
  if (!book) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/books"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
      >
        <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
        Books
      </Link>

      <div className="flex gap-6">
        {book.coverUrl ? (
          <div className="w-28 shrink-0">
            <img src={book.coverUrl} alt={book.title} className="w-full rounded-lg" />
          </div>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-2xl font-heading">{book.title}</h1>
          <p className="text-sm text-muted">{book.author}</p>
          {ratingStars(book.rating)}
          {book.category && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {book.category.split(",").map((c) => (
                <span key={c.trim()} className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-hover-bg text-fg/50">
                  {c.trim()}
                </span>
              ))}
            </div>
          )}
          {book.quote && (
            <p className="text-sm text-fg/60 italic">&ldquo;{book.quote}&rdquo;</p>
          )}
        </div>
      </div>

      {book.review && (
        <div className="prose-content text-sm text-fg/80 space-y-3" dangerouslySetInnerHTML={{ __html: book.review }} />
      )}
    </div>
  );
}
