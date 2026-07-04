import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getHeartsCounts } from "@/actions/heart-counts";
import { Breadcrumb } from "@/components/Breadcrumb";
import { HeartButton } from "@/components/HeartButton";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { stripHtml } from "@/lib/seo";

export const metadata = {
  title: "Posts | Suckstobeanik",
  description: "Short-form posts and microblog entries.",
  openGraph: {
    title: "Posts | Suckstobeanik",
    description: "Short-form posts and microblog entries.",
    url: "/posts",
  },
  twitter: {
    title: "Posts | Suckstobeanik",
    description: "Short-form posts and microblog entries.",
  },
};

export const revalidate = 3600;

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function readTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export default async function PostsPage() {
  const posts = await db
    .select()
    .from(microblogs)
    .where(eq(microblogs.published, true))
    .orderBy(desc(microblogs.publishedAt));

  const heartCounts = await getHeartsCounts(
    "microblog",
    posts.map((p) => p.id),
  );

  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Posts" }]} />
      </div>

      {posts.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.id}>
            {post.publishedAt && (
              <p className="text-xs text-muted mb-1.5">
                {fmtDate(new Date(post.publishedAt))}
                <span className="text-fg/20 mx-2">·</span>
                {readTime(post.content)}
              </p>
            )}
            <Link href={`/posts/${post.id}`} className="block space-y-2 group">
              <h2 className="text-sm font-heading leading-snug group-hover:text-fg/60 transition-colors">
                {post.title}
              </h2>
              <p className="text-xs text-fg/60 leading-relaxed line-clamp-3">
                {stripHtml(post.content)}
              </p>
              {post.imageUrl && (
                <div className="overflow-hidden rounded-lg max-h-48 bg-hover-bg">
                  <img
                    src={post.imageUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </Link>
            <div className="mt-2">
              <HeartButton
                entityType="microblog"
                entityId={post.id}
                initialCount={heartCounts[post.id] ?? 0}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
