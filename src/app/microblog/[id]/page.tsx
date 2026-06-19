import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { eq, lt, gt, desc, asc, and } from "drizzle-orm";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { HeartButton } from "@/components/HeartButton";
import { getHeartData } from "@/actions/hearts";

export const metadata = {
  title: "Microblog — Suckstobeanik",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MicroblogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (await db.select().from(microblogs).where(eq(microblogs.id, Number(id))).limit(1))[0];
  if (!post) notFound();

  const heartData = await getHeartData("microblog", post.id);

  const prev = (
    await db
      .select({ id: microblogs.id, title: microblogs.title })
      .from(microblogs)
      .where(and(eq(microblogs.published, true), lt(microblogs.sortOrder, post.sortOrder ?? 0)))
      .orderBy(desc(microblogs.sortOrder))
      .limit(1)
  )[0] ?? null;

  const next = (
    await db
      .select({ id: microblogs.id, title: microblogs.title })
      .from(microblogs)
      .where(and(eq(microblogs.published, true), gt(microblogs.sortOrder, post.sortOrder ?? 0)))
      .orderBy(asc(microblogs.sortOrder))
      .limit(1)
  )[0] ?? null;

  return (
    <div className="space-y-6 md:space-y-8">
      <Link
        href="/microblog"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
      >
        <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
        Microblog
      </Link>

      <article className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-heading">{post.title}</h1>
          {post.publishedAt && (
            <p className="text-xs text-muted">
              {formatDate(new Date(post.publishedAt))}
            </p>
          )}
        </div>

        {post.imageUrl && (
          <div className="overflow-hidden rounded-lg">
            <img src={post.imageUrl} alt="" className="w-full" />
          </div>
        )}

        <div
          className="prose-content text-sm text-fg/80 space-y-3"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <HeartButton
          entityType="microblog"
          entityId={post.id}
          initialCount={heartData.count}
          initialHearted={heartData.hearted}
        />
      </article>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-hairline">
        {prev ? (
          <Link
            href={`/microblog/${prev.id}`}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors group"
          >
            <ArrowLeft weight="thin" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="truncate max-w-[200px]">{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/microblog/${next.id}`}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors group text-right"
          >
            <span className="truncate max-w-[200px]">{next.title}</span>
            <ArrowRight weight="thin" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
