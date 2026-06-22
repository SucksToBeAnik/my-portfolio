import { desc } from "drizzle-orm";
import { BooksDisplay } from "@/components/BooksDisplay";
import { db } from "@/db";
import { books } from "@/db/schema";

export const metadata = {
  title: "Books | Suckstobeanik",
  description: "Book catalog with ratings and reviews.",
  openGraph: {
    title: "Books | Suckstobeanik",
    description: "Book catalog with ratings and reviews.",
    url: "/books",
  },
  twitter: {
    title: "Books | Suckstobeanik",
    description: "Book catalog with ratings and reviews.",
  },
};

export const revalidate = 3600;

export default async function BooksPage() {
  const all = await db.select().from(books).orderBy(desc(books.sortOrder));
  return <BooksDisplay books={all} />;
}
