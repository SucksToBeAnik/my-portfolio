import { notFound } from "next/navigation";
import { getMicroblog } from "@/actions/microblogs";
import { PostEditor } from "@/components/post-editor/PostEditor";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getMicroblog(Number(id));
  if (!post) notFound();

  return (
    <PostEditor
      postId={post.id}
      initial={{
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl ?? "",
        tags: post.tags ?? "",
        published: post.published ?? false,
      }}
    />
  );
}
