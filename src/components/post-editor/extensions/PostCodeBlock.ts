import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockNodeView } from "@/components/post-editor/extensions/CodeBlockNodeView";
import { lowlight } from "@/lib/lowlight";

/**
 * Code block with live lowlight syntax highlighting plus a React node view that
 * adds a language picker. Uses the shared lowlight instance so the editor and
 * the reader highlight with the exact same engine and token classes. StarterKit's
 * `codeBlock` must be disabled where this is registered (same node name).
 */
export const PostCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
}).configure({ lowlight });
