"use client";

import { type ReactNode, useState } from "react";
import { Bookshelf } from "@/components/Bookshelf";
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
        (b.category ?? "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      ),
    ),
  ).sort();

  const filtered =
    activeCategories.length > 0
      ? books.filter((b) =>
          activeCategories.some((cat) =>
            (b.category ?? "")
              .split(",")
              .map((c) => c.trim())
              .includes(cat),
          ),
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

      <div className="space-y-10 md:space-y-12">
        {groups.map((group) => {
          const items = filtered.filter((b) => b.status === group.key);
          if (items.length === 0) return null;
          return <Bookshelf key={group.key} label={group.label} books={items} />;
        })}
      </div>
    </div>
  );
}
