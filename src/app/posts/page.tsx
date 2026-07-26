import { ArrowBendUpRight } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RelativeDate } from "@/components/RelativeDate";
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

// Cached until an admin write calls revalidatePath("/posts") — nothing here is
// time- or visitor-dependent, so there's nothing for a timer to refresh.
export const revalidate = false;

export default async function PostsPage() {
  const posts = await db
    .select()
    .from(microblogs)
    .where(eq(microblogs.published, true))
    .orderBy(microblogs.sortOrder);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <Breadcrumb crumbs={[{ label: "Posts" }]} />
        <Link
          href="/til"
          className="text-xs text-muted hover:text-fg transition-colors inline-flex items-center gap-1 shrink-0"
        >
          Today I learned <ArrowBendUpRight weight="thin" className="w-3 h-3" />
        </Link>
      </div>

      {posts.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {posts.map((post) => {
          const blurb = post.microview?.trim();
          const image = cardCover(post.imageUrl, post.content);
          return (
            // Shared subgrid row tracks (title / microview / image / date): cards
            // in the same grid row size each track to the tallest card in that row,
            // so microviews — and therefore images — line up per row.
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="row-span-4 grid grid-rows-subgrid gap-3 rounded-2xl border border-hairline bg-fg/[0.03] p-4 transition-colors hover:bg-fg/[0.06]"
            >
              <h2 className="row-start-1 font-heading text-sm leading-snug">{post.title}</h2>
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
              {post.publishedAt && (
                <RelativeDate
                  date={post.publishedAt}
                  className="row-start-4 self-end text-[11px] text-muted"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
