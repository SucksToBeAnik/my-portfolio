import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata = {
  title: "Microblog — Suckstobeanik",
};

export default async function MicroblogPage() {
  const items = await db
    .select()
    .from(microblogs)
    .where(eq(microblogs.published, true))
    .orderBy(desc(microblogs.sortOrder));

  return (
    <div className="space-y-12">
      <div className="mb-16">
        <Breadcrumb crumbs={[{ label: "Microblog" }]} />
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted">Nothing here yet.</p>
      )}

      <div className="space-y-10">
        {items.map((post) => (
          <article key={post.id}>
            <Link href={`/microblog/${post.id}`} className="block space-y-2 group">
              <h2 className="text-base font-heading leading-snug group-hover:underline">
                {post.title}
              </h2>
              {post.publishedAt && (
                <p className="text-xs text-muted">
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {post.imageUrl && (
                <div className="overflow-hidden rounded-lg max-h-48">
                  <img src={post.imageUrl} alt="" className="object-cover w-full h-full" />
                </div>
              )}
              <p className="text-xs text-fg/60 line-clamp-3 prose-content" dangerouslySetInnerHTML={{ __html: post.content }} />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
