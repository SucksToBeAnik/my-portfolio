import { ArrowBendUpRight, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import ReactDOM from "react-dom";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LinkPreview } from "@/components/LinkPreview";
import { db } from "@/db";
import { stacks } from "@/db/schema";
import { cdnImage } from "@/lib/cloudinary";

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

// Cached until an admin write; all four stack actions revalidate this path.
// Metadata repair lives in the admin `refreshMetadata()` action, not in this
// render — it used to sit on the critical path of every cold load.
export const revalidate = false;

export default async function StacksPage() {
  const all = await db
    .select({
      id: stacks.id,
      name: stacks.name,
      url: stacks.url,
      description: stacks.description,
      imageUrl: stacks.imageUrl,
      platform: stacks.platform,
      category: stacks.category,
      previewImage: stacks.previewImage,
    })
    .from(stacks)
    .orderBy(asc(stacks.sortOrder));

  // Icons are ~0.7 KB each off our CDN, and the whole page is a couple of
  // screens, so the top of the list is worth pulling in with the document.
  for (const row of all.slice(0, 16)) {
    if (row.imageUrl) ReactDOM.preload(cdnImage(row.imageUrl, 40), { as: "image" });
  }

  const grouped = CATEGORIES.map((category) => ({
    category,
    items: all.filter((s) => (s.category ?? "") === category),
  })).filter((g) => g.items.length > 0);

  const uncategorized = all.filter((s) => !s.category);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <Breadcrumb crumbs={[{ label: "Stacks I Use" }]} />
        {all.length > 0 && (
          <Link
            href="/sites"
            className="text-xs text-muted hover:text-fg transition-colors inline-flex items-center gap-1 shrink-0"
          >
            See sites I find useful <ArrowBendUpRight weight="thin" className="w-3 h-3" />
          </Link>
        )}
      </div>

      {all.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      {grouped.map(({ category, items }) => (
        <StackSection key={category} title={category} items={items} />
      ))}

      {uncategorized.length > 0 && <StackSection title="Other" items={uncategorized} />}
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
  previewImage: string | null;
};

function StackSection({ title, items }: { title: string; items: Stack[] }) {
  return (
    <section className="space-y-1">
      <h2 className="text-[11px] font-heading text-muted uppercase tracking-wider mb-2">{title}</h2>
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
    <LinkPreview
      url={stack.url}
      className="w-full"
      preload={{
        title: stack.name,
        description: stack.description,
        logo: stack.imageUrl,
        image: stack.previewImage || null,
      }}
    >
      <a
        href={stack.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 w-full py-2.5 border-b border-hairline/50"
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-5 h-5 shrink-0 flex items-center justify-center">
            {stack.imageUrl ? (
              <img
                src={cdnImage(stack.imageUrl, 40)}
                alt=""
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-muted text-xs">◈</span>
            )}
          </span>
          <h3 className="text-sm font-semibold whitespace-nowrap">{stack.name}</h3>
        </div>

        {stack.description && (
          <span className="text-xs text-muted leading-relaxed flex-1 min-w-0 sm:truncate pl-[30px] sm:pl-0">
            {stack.description}
          </span>
        )}

        <ArrowRight
          weight="thin"
          className="hidden sm:block sm:ml-auto w-3.5 h-3.5 text-muted shrink-0 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0"
        />
      </a>
    </LinkPreview>
  );
}
