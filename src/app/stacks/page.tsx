import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { db } from "@/db";
import { stacks } from "@/db/schema";

export const metadata: Metadata = {
  title: "Stacks | Suckstobeanik",
  description: "Tools, software, and gear I use.",
  openGraph: {
    title: "Stacks | Suckstobeanik",
    description: "Tools, software, and gear I use.",
    url: "/stacks",
  },
  twitter: {
    title: "Stacks | Suckstobeanik",
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
        <section key={category} className="space-y-4">
          <h2 className="text-xs font-heading text-muted uppercase tracking-wider">
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((stack) => (
              <StackCard key={stack.id} stack={stack} />
            ))}
          </div>
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-heading text-muted uppercase tracking-wider">
            Other
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uncategorized.map((stack) => (
              <StackCard key={stack.id} stack={stack} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StackCard({ stack }: { stack: { id: number; name: string; url: string; description: string | null; imageUrl: string | null; platform: string | null } }) {
  return (
    <a
      href={stack.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 border border-hairline rounded-xl p-4 hover:bg-hover-bg transition-colors group"
    >
      {stack.imageUrl && (
        <div className="w-10 h-10 shrink-0 rounded-lg bg-hover-bg overflow-hidden flex items-center justify-center">
          <img
            src={stack.imageUrl}
            alt={stack.name}
            loading="lazy"
            className="w-8 h-8 object-contain"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-heading">{stack.name}</h3>
        {stack.platform && (
          <div className="flex flex-wrap gap-1 mt-1">
            {stack.platform.split(",").map((p) => p.trim()).filter(Boolean).map((p) => (
              <span key={p} className="px-1.5 py-0.5 text-[10px] bg-hover-bg rounded text-fg/50">
                {p}
              </span>
            ))}
          </div>
        )}
        {stack.description && (
          <p className="text-xs text-fg/50 mt-1 leading-relaxed">{stack.description}</p>
        )}
      </div>
    </a>
  );
}
