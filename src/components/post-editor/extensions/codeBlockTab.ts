import { Extension } from "@tiptap/react";

const INDENT = "  "; // two spaces, matching the reader's tab size

/**
 * Makes Tab / Shift-Tab indent inside code blocks instead of moving focus out
 * of the editor. Outside a code block, Tab is left alone (returns false) so the
 * default behaviour is preserved.
 */
export const CodeBlockTab = Extension.create({
  name: "codeBlockTab",

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { editor } = this;
        if (!editor.isActive("codeBlock")) return false;
        // insertContent() parses its string as HTML, which collapses the two
        // spaces to nothing — insert as raw text through the transaction instead.
        return editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) dispatch(tr.insertText(INDENT));
          return true;
        });
      },
      "Shift-Tab": () => {
        const { editor } = this;
        if (!editor.isActive("codeBlock")) return false;
        const { $from, empty } = editor.state.selection;
        if (!empty) return true;
        const before = $from.parent.textBetween(
          Math.max(0, $from.parentOffset - INDENT.length),
          $from.parentOffset,
        );
        let remove = 0;
        for (let i = before.length - 1; i >= 0 && before[i] === " "; i--) remove += 1;
        if (remove > 0) {
          editor.commands.deleteRange({ from: $from.pos - remove, to: $from.pos });
        }
        return true;
      },
    };
  },
});
