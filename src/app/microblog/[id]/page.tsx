import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Microblog — Suckstobeanik",
};

export default async function MicroblogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (await db.select().from(microblogs).where(eq(microblogs.id, Number(id))).limit(1))[0];
  if (!post) notFound();

  return (
    <div className="space-y-8">
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
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
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
      </article>
    </div>
  );
}
