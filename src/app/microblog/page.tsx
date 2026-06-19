import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getHeartsCounts } from "@/actions/heart-counts";
import { Breadcrumb } from "@/components/Breadcrumb";
import { HeartButton } from "@/components/HeartButton";
import { db } from "@/db";
import { microblogs } from "@/db/schema";

export const metadata = {
  title: "Microblog — Suckstobeanik",
};

export const revalidate = 3600;

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

function readTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const min = Math.max(1, Math.ceil(words / 200));
  return `${min} min read`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MicroblogPage({
  searchParams,
}: {
  searchParams: Promise<{ til?: string }>;
}) {
  const { til } = await searchParams;
  const showTil = til === "1";

  const items = await db
    .select()
    .from(microblogs)
    .where(and(eq(microblogs.published, true), showTil ? eq(microblogs.til, true) : undefined))
    .orderBy(desc(microblogs.publishedAt));

  const heartsMap = await getHeartsCounts(
    "microblog",
    items.map((p) => p.id),
  );

  return (
    <div>
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: showTil ? "Today I Learned" : "Microblog" }]} />
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href="/microblog"
          className={`text-xs transition-colors border-b-2 pb-1 ${!showTil ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"}`}
        >
          All
        </Link>
        <Link
          href="/microblog?til=1"
          className={`text-xs transition-colors border-b-2 pb-1 ${showTil ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"}`}
        >
          TIL
        </Link>
      </div>

      {items.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div>
        {items.map((post) => {
          const heartCount = heartsMap[post.id] ?? 0;
          return (
            <div key={post.id}>
              <article className="pb-8">
                {post.publishedAt && (
                  <p className="text-xs text-muted mb-3">
                    {formatDate(new Date(post.publishedAt))}
                    <span className="text-fg/20 mx-2">·</span>
                    {readTime(post.content)}
                    {post.til && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                        TIL
                      </span>
                    )}
                  </p>
                )}
                <Link href={`/microblog/${post.id}`} className="block space-y-3 group">
                  <h2 className="text-base font-heading leading-snug">{post.title}</h2>
                  <p className="text-xs text-fg/60 line-clamp-3">{stripHtml(post.content)}</p>
                  {post.imageUrl && (
                    <div className="overflow-hidden rounded-lg max-h-60 -mx-1 bg-hover-bg">
                      <img
                        src={post.imageUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </Link>
                <div className="mt-3">
                  <HeartButton
                    entityType="microblog"
                    entityId={post.id}
                    initialCount={heartCount}
                  />
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
