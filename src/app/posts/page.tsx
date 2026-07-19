import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { getHeartsCounts } from "@/actions/heart-counts";
import { Breadcrumb } from "@/components/Breadcrumb";
import { HeartButton } from "@/components/HeartButton";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { cardCover } from "@/lib/seo";

export const metadata = {
  title: "Posts",
  description: "Short-form posts and microblog entries.",
  openGraph: {
    title: "Posts",
    description: "Short-form posts and microblog entries.",
    url: "/posts",
  },
  twitter: {
    title: "Posts",
    description: "Short-form posts and microblog entries.",
  },
};

export const revalidate = 3600;

function relativeDate(date: Date) {
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  const days = Math.floor(diff / day);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

export default async function PostsPage() {
  const posts = await db
    .select()
    .from(microblogs)
    .where(eq(microblogs.published, true))
    .orderBy(microblogs.sortOrder);

  const heartCounts = await getHeartsCounts(
    "microblog",
    posts.map((p) => p.id),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <Breadcrumb crumbs={[{ label: "Posts" }]} />
        <Link
          href="/til"
          className="text-xs text-muted hover:text-fg transition-colors inline-flex items-center gap-1 shrink-0"
        >
          Today I learned <ArrowRight weight="thin" className="w-3 h-3" />
        </Link>
      </div>

      {posts.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {posts.map((post) => {
          const blurb = post.microview?.trim();
          const image = cardCover(post.imageUrl, post.content);
          return (
            // Shared subgrid row tracks (title / microview / image / footer): cards
            // in the same grid row size each track to the tallest card in that row,
            // so microviews — and therefore images — line up per row.
            <div
              key={post.id}
              className="group relative row-span-4 grid grid-rows-subgrid gap-3 rounded-2xl border border-hairline bg-fg/[0.03] p-4 transition-colors hover:bg-fg/[0.06]"
            >
              {/* Stretched overlay link: the whole card navigates; the footer sits
                  above it (z-10) so the heart button stays independently clickable. */}
              <Link
                href={`/posts/${post.id}`}
                aria-label={post.title}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              <h2 className="row-start-1 font-heading text-sm uppercase tracking-wide leading-snug">
                {post.title}
              </h2>
              {blurb && (
                <p className="row-start-2 text-sm text-fg/55 leading-tight line-clamp-4">{blurb}</p>
              )}
              {image && (
                <div className="row-start-3 overflow-hidden rounded-xl bg-hover-bg">
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-fill"
                  />
                </div>
              )}
              <div className="row-start-4 relative z-10 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">
                  {post.publishedAt ? relativeDate(new Date(post.publishedAt)) : ""}
                </span>
                <HeartButton
                  entityType="microblog"
                  entityId={post.id}
                  initialCount={heartCounts[post.id] ?? 0}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
