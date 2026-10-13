import { HomeListRow } from "@/components/HomeListRow";
import { SectionHeader } from "@/components/SectionHeader";

interface PostItem {
  id: number;
  title: string;
  imageUrl: string | null;
  publishedAt: Date | null;
}

function fmtDate(date: Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function RecentPosts({ posts }: { posts: PostItem[] }) {
  if (posts.length === 0) return null;

  return (
    <section>
      <SectionHeader label="Recent Posts" href="/posts" linkLabel="View all" bordered />
      <div className="space-y-1">
        {posts.map((post) => (
          <HomeListRow
            key={post.id}
            title={post.title}
            imageUrl={post.imageUrl}
            meta={post.publishedAt ? fmtDate(post.publishedAt) : undefined}
            href={`/posts/${post.id}`}
          />
        ))}
      </div>
    </section>
  );
}
