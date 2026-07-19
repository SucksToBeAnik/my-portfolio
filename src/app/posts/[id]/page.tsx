import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHeartsCounts } from "@/actions/heart-counts";
import { BackButton } from "@/components/BackButton";
import { HeartButton } from "@/components/HeartButton";
import { PostPreview } from "@/components/post-editor/PostPreview";
import { SubscribeForm } from "@/components/SubscribeForm";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { firstImage, stripMarkdown, truncate } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const rows = await db
    .select({ id: microblogs.id })
    .from(microblogs)
    .where(eq(microblogs.published, true));
  return rows.map((r) => ({ id: String(r.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db
    .select({
      title: microblogs.title,
      content: microblogs.content,
      imageUrl: microblogs.imageUrl,
      publishedAt: microblogs.publishedAt,
    })
    .from(microblogs)
    .where(eq(microblogs.id, Number(id)))
    .limit(1)
    .then((r) => r[0]);
  if (!post) return { title: "Posts" };
  const ogImage = post.imageUrl ?? firstImage(post.content);
  return {
    title: `${post.title} | Posts`,
    description: truncate(stripMarkdown(post.content)),
    openGraph: {
      title: `${post.title} | Posts`,
      description: truncate(stripMarkdown(post.content)),
      url: `/posts/${id}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      title: `${post.title} | Posts`,
      description: truncate(stripMarkdown(post.content)),
      images: ogImage ? [ogImage] : undefined,
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

function readTime(content: string) {
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length;
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
            ...((post.imageUrl ?? firstImage(post.content))
              ? { image: post.imageUrl ?? firstImage(post.content) }
              : {}),
          }),
        }}
      />
      <div className="space-y-6 md:space-y-8">
        <BackButton label="Posts" fallbackHref="/posts" />

        <article>
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

          <PostPreview content={post.content} className="mt-12 text-fg/80" />
        </article>
      </div>

      <footer className="mt-16 rounded-3xl bg-fg/[0.03] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="font-heading text-xs uppercase tracking-[0.15em] text-muted">
            Thanks for reading
          </p>
          <HeartButton entityType="microblog" entityId={post.id} initialCount={heartCount} />
        </div>

        <div className="mt-10">
          <SubscribeForm />
        </div>

        {(prev || next) && (
          <nav className="mt-10 grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                href={`/posts/${prev.id}`}
                className="group flex flex-col gap-1 rounded-xl bg-fg/[0.04] p-3 hover:bg-fg/[0.08] transition-colors"
              >
                <span className="flex items-center gap-1 text-[10px] font-heading uppercase tracking-wider text-muted">
                  <ArrowLeft
                    weight="thin"
                    className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform"
                  />
                  Previous
                </span>
                <span className="text-xs text-fg truncate">{prev.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/posts/${next.id}`}
                className="group flex flex-col gap-1 rounded-xl bg-fg/[0.04] p-3 text-right hover:bg-fg/[0.08] transition-colors"
              >
                <span className="flex items-center justify-end gap-1 text-[10px] font-heading uppercase tracking-wider text-muted">
                  Next
                  <ArrowRight
                    weight="thin"
                    className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
                <span className="text-xs text-fg truncate">{next.title}</span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </footer>
    </>
  );
}
