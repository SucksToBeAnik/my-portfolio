import { notFound } from "next/navigation";
import { getMicroblog } from "@/actions/microblogs";
import { PostEditor } from "@/components/post-editor/PostEditor";
import { microblogDraftSchema, parseDraft } from "@/lib/drafts";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getMicroblog(Number(id));
  if (!post) notFound();

  // A buffered draft only applies to a published post; ignore it otherwise.
  const draft = post.published ? parseDraft(microblogDraftSchema, post.draft) : null;

  return (
    <PostEditor
      postId={post.id}
      initial={{
        title: post.title,
        content: post.content,
        microview: post.microview ?? "",
        tags: post.tags ?? "",
        imageUrl: post.imageUrl ?? "",
        published: post.published ?? false,
        draft: draft
          ? {
              title: draft.title,
              content: draft.content,
              microview: draft.microview ?? "",
              tags: draft.tags ?? "",
              imageUrl: draft.imageUrl ?? "",
            }
          : null,
      }}
    />
  );
}
