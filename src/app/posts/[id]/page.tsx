import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHeartsCounts } from "@/actions/heart-counts";
import { HeartButton } from "@/components/HeartButton";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { stripHtml, truncate } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db
    .select({ title: microblogs.title, content: microblogs.content, publishedAt: microblogs.publishedAt, imageUrl: microblogs.imageUrl })
    .from(microblogs)
    .where(eq(microblogs.id, Number(id)))
    .limit(1)
    .then((r) => r[0]);
  if (!post) return { title: "Posts | Suckstobeanik" };
  return {
    title: `${post.title} | Posts | Suckstobeanik`,
    description: truncate(stripHtml(post.content)),
    openGraph: {
      title: `${post.title} | Posts | Suckstobeanik`,
      description: truncate(stripHtml(post.content)),
      url: `/posts/${id}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
    twitter: {
      title: `${post.title} | Posts | Suckstobeanik`,
      description: truncate(stripHtml(post.content)),
      images: post.imageUrl ? [post.imageUrl] : undefined,
    },
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function readTime(html: string) {
  const words = html
    .replace(/<[^>]*>/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  const min = Math.max(1, Math.ceil(words / 200));
  return `${min} min read`;
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (
    await db
      .select()
      .from(microblogs)
      .where(eq(microblogs.id, Number(id)))
      .limit(1)
  )[0];
  if (!post) notFound();

  const [heartCounts] = await Promise.all([getHeartsCounts("microblog", [post.id])]);
  const heartCount = heartCounts[post.id] ?? 0;

  const prev =
    (
      await db
        .select({ id: microblogs.id, title: microblogs.title })
        .from(microblogs)
        .where(and(eq(microblogs.published, true), lt(microblogs.sortOrder, post.sortOrder ?? 0)))
        .orderBy(desc(microblogs.sortOrder))
        .limit(1)
    )[0] ?? null;

  const next =
    (
      await db
        .select({ id: microblogs.id, title: microblogs.title })
        .from(microblogs)
        .where(and(eq(microblogs.published, true), gt(microblogs.sortOrder, post.sortOrder ?? 0)))
        .orderBy(asc(microblogs.sortOrder))
        .limit(1)
    )[0] ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            datePublished: post.publishedAt,
            author: { "@type": "Person", name: "Suckstobeanik" },
            ...(post.imageUrl ? { image: post.imageUrl } : {}),
          }),
        }}
      />
      <div className="space-y-6 md:space-y-8">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
      >
        <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
        Posts
      </Link>

      <article className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-heading">{post.title}</h1>
          {post.publishedAt && (
            <p className="text-xs text-muted">
              {formatDate(new Date(post.publishedAt))}
              <span className="text-fg/20 mx-2">·</span>
              {readTime(post.content)}
            </p>
          )}
        </div>

        {post.imageUrl && (
          <div className="overflow-hidden rounded-lg">
            <img src={post.imageUrl} alt="" loading="lazy" className="w-full" />
          </div>
        )}

        <div
          className="prose-content text-sm text-fg/80 space-y-3"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <HeartButton entityType="microblog" entityId={post.id} initialCount={heartCount} />
      </article>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-hairline">
        {prev ? (
          <Link
            href={`/posts/${prev.id}`}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors group"
          >
            <ArrowLeft
              weight="thin"
              className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="truncate max-w-[200px]">{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/posts/${next.id}`}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors group text-right"
          >
            <span className="truncate max-w-[200px]">{next.title}</span>
            <ArrowRight
              weight="thin"
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
    </>
  );
}
