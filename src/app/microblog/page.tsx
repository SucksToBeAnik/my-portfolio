import { desc, eq } from "drizzle-orm";
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

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MicroblogPage() {
  const items = await db
    .select()
    .from(microblogs)
    .where(eq(microblogs.published, true))
    .orderBy(desc(microblogs.publishedAt));

  const heartsMap = await getHeartsCounts(
    "microblog",
    items.map((p) => p.id),
  );

  return (
    <div>
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Microblog" }]} />
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
