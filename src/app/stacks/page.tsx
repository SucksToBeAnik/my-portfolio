import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { db } from "@/db";
import { stacks } from "@/db/schema";

export const metadata: Metadata = {
  title: "Stacks",
  description: "Tools, software, and gear I use.",
  openGraph: {
    title: "Stacks",
    description: "Tools, software, and gear I use.",
    url: "/stacks",
  },
  twitter: {
    title: "Stacks",
    description: "Tools, software, and gear I use.",
  },
};

const CATEGORIES = [
  "Editor / IDE",
  "Language / Runtime",
  "Framework",
  "Database",
  "Design",
  "DevOps / Infrastructure",
  "AI / ML",
  "Terminal / CLI",
  "Productivity",
  "Hardware",
];

export const revalidate = 3600;

export default async function StacksPage() {
  const all = await db.select().from(stacks).orderBy(asc(stacks.sortOrder));

  const grouped = CATEGORIES.map((category) => ({
    category,
    items: all.filter((s) => (s.category ?? "") === category),
  })).filter((g) => g.items.length > 0);

  const uncategorized = all.filter((s) => !s.category);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Stacks I Use" }]} />
        {all.length > 0 && (
          <Link
            href="/sites"
            className="text-xs text-muted hover:text-fg transition-colors inline-flex items-center gap-1 shrink-0"
          >
            See sites I find useful <ArrowRight weight="thin" className="w-3 h-3" />
          </Link>
        )}
      </div>

      {all.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      {grouped.map(({ category, items }) => (
        <StackSection key={category} title={category} items={items} />
      ))}

      {uncategorized.length > 0 && (
        <StackSection title="Other" items={uncategorized} />
      )}
    </div>
  );
}

type Stack = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  platform: string | null;
};

function StackSection({ title, items }: { title: string; items: Stack[] }) {
  return (
    <section className="space-y-1">
      <h2 className="text-[11px] font-heading text-muted uppercase tracking-wider mb-2">
        {title}
      </h2>
      <div>
        {items.map((stack) => (
          <StackRow key={stack.id} stack={stack} />
        ))}
      </div>
    </section>
  );
}

function StackRow({ stack }: { stack: Stack }) {
  return (
    <a
      href={stack.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 py-2.5 border-b border-hairline/50 last:border-b-0"
    >
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="w-5 h-5 shrink-0 flex items-center justify-center">
          {stack.imageUrl ? (
            <img
              src={stack.imageUrl}
              alt=""
              loading="lazy"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-muted text-xs">◈</span>
          )}
        </span>
        <h3 className="text-sm font-heading whitespace-nowrap">{stack.name}</h3>
      </div>

      {stack.description && (
        <span className="text-xs text-muted leading-relaxed flex-1 min-w-0 sm:truncate pl-[30px] sm:pl-0">
          {stack.description}
        </span>
      )}

      <ArrowRight
        weight="thin"
        className="hidden sm:block w-3.5 h-3.5 text-muted shrink-0 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0"
      />
    </a>
  );
}
