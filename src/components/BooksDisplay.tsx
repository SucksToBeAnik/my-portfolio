"use client";

import { type ReactNode, useState } from "react";
import { Star } from "@phosphor-icons/react";
import Link from "next/link";
import { FilterPopover } from "@/components/FilterPopover";

type Book = {
  id: number;
  title: string;
  author: string;
  coverUrl: string | null;
  rating: number | null;
  category: string | null;
  quote: string | null;
  status: string;
};

function ratingStars(rating: number | null) {
  return (
    <span className="inline-flex gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          weight="fill"
          className={`w-3 h-3 ${(rating ?? 0) >= n ? "text-fg" : "text-fg/30"}`}
        />
      ))}
    </span>
  );
}

const groups = [
  { label: "Reading", key: "reading" },
  { label: "Read", key: "read" },
  { label: "Want to Read", key: "want_to_read" },
];

export function BooksDisplay({ books, header }: { books: Book[]; header?: ReactNode }) {
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  const allCategories = Array.from(
    new Set(
      books.flatMap((b) =>
        (b.category ?? "").split(",").map((c) => c.trim()).filter(Boolean)
      )
    )
  ).sort();

  const filtered =
    activeCategories.length > 0
      ? books.filter((b) =>
          activeCategories.some((cat) =>
            (b.category ?? "").split(",").map((c) => c.trim()).includes(cat)
          )
        )
      : books;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-16">
        {header}
        <FilterPopover
          tags={allCategories}
          active={activeCategories}
          onChange={setActiveCategories}
        />
      </div>

      {books.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      {groups.map((group) => {
        const items = filtered.filter((b) => b.status === group.key);
        if (items.length === 0) return null;

        return (
          <section key={group.key} className="space-y-4">
            <h2 className="text-xs font-heading text-muted uppercase tracking-wider">
              {group.label}
            </h2>
            <div className="space-y-3">
              {items.map((book, i) => (
                <Link
                  key={`${activeCategories.join(',')}-${book.id}`}
                  href={`/books/${book.id}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="flex gap-4 border border-hairline rounded-xl p-4 hover:bg-hover-bg transition-colors animate-fade-up"
                >
                  {book.coverUrl ? (
                    <div className="w-12 h-16 rounded-md overflow-hidden shrink-0">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        loading="lazy"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-16 rounded-md bg-hover-bg shrink-0 flex items-center justify-center text-xs text-muted">
                      {book.title[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-heading truncate">{book.title}</h3>
                      {ratingStars(book.rating)}
                    </div>
                    <p className="text-xs text-muted">{book.author}</p>
                    {book.category && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {book.category.split(",").map((c) => (
                          <span
                            key={c.trim()}
                            className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-hover-bg text-fg/50"
                          >
                            {c.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {book.quote && (
                      <p className="text-xs text-fg/60 italic line-clamp-2">
                        &ldquo;{book.quote}&rdquo;
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
