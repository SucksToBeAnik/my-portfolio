import { PostEditor } from "@/components/post-editor/PostEditor";

export default function NewPostPage() {
  return (
    <PostEditor initial={{ title: "", content: "", imageUrl: "", tags: "", published: false }} />
  );
}
