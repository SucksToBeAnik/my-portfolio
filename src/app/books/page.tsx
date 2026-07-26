import { desc } from "drizzle-orm";
import ReactDOM from "react-dom";
import { BooksDisplay } from "@/components/BooksDisplay";
import { COVER_WIDTH } from "@/components/Bookshelf";
import { Breadcrumb } from "@/components/Breadcrumb";
import { db } from "@/db";
import { books } from "@/db/schema";
import { cdnImage } from "@/lib/cloudinary";

export const metadata = {
  title: "Books",
  description: "Book catalog with ratings and reviews.",
  openGraph: {
    title: "Books",
    description: "Book catalog with ratings and reviews.",
    url: "/books",
  },
  twitter: {
    title: "Books",
    description: "Book catalog with ratings and reviews.",
  },
};

// Cached until an admin write; every book action revalidates this path.
export const revalidate = false;

export default async function BooksPage() {
  // The grid shows covers and shelf labels — the review HTML belongs to
  // /books/[id] and would otherwise ride along in the payload.
  const all = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      coverUrl: books.coverUrl,
      rating: books.rating,
      category: books.category,
      quote: books.quote,
      status: books.status,
    })
    .from(books)
    .orderBy(desc(books.sortOrder));

  // Shelves render in this order, so these are the covers above the fold —
  // pull them in with the document instead of after layout.
  const aboveTheFold = ["reading", "read", "want_to_read"]
    .flatMap((status) => all.filter((b) => b.status === status))
    .slice(0, 8);
  for (const book of aboveTheFold) {
    if (book.coverUrl) ReactDOM.preload(cdnImage(book.coverUrl, COVER_WIDTH), { as: "image" });
  }

  return <BooksDisplay books={all} header={<Breadcrumb crumbs={[{ label: "What I Read" }]} />} />;
}
