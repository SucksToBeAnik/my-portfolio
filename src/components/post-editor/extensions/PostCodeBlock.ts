import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockNodeView } from "@/components/post-editor/extensions/CodeBlockNodeView";

/**
 * The default StarterKit code block plus a React node view that adds a language
 * picker. StarterKit's `codeBlock` must be disabled where this is registered so
 * the two don't both claim the `codeBlock` node name.
 */
export const PostCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
});
