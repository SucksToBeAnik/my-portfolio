import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { tils } from "@/db/schema";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const til = await db
    .select({ title: tils.title })
    .from(tils)
    .where(eq(tils.id, Number(id)))
    .limit(1)
    .then((r) => r[0]);
  return {
    title: til ? `${til.title} — TIL — Suckstobeanik` : "TIL — Suckstobeanik",
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function TilDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const til = await db
    .select()
    .from(tils)
    .where(eq(tils.id, Number(id)))
    .limit(1)
    .then((r) => r[0]);

  if (!til) notFound();

  return (
    <div className="space-y-6 md:space-y-8">
      <Link
        href="/til"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
      >
        <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
        TIL
      </Link>

      <article className="space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-heading uppercase tracking-widest text-fg/30">
            Today I Learned
          </p>
          <h1 className="text-2xl font-heading leading-snug">{til.title}</h1>
          <p className="text-xs text-muted">{formatDate(new Date(til.createdAt))}</p>
        </div>

        <div
          className="prose-content text-sm text-fg/80 space-y-3"
          dangerouslySetInnerHTML={{ __html: til.content }}
        />
      </article>
    </div>
  );
}
