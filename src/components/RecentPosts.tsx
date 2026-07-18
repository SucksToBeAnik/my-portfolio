import { HomeListRow } from "@/components/HomeListRow";
import { SectionHeader } from "@/components/SectionHeader";

interface PostItem {
  id: number;
  title: string;
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
      <SectionHeader label="Recent Posts" />
      <div>
        {posts.map((post) => (
          <HomeListRow
            key={post.id}
            title={post.title}
            meta={post.publishedAt ? fmtDate(post.publishedAt) : undefined}
            href={`/posts/${post.id}`}
          />
        ))}
      </div>
    </section>
  );
}
