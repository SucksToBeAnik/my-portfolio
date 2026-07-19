import { common, createLowlight } from "lowlight";

/**
 * One highlight.js/lowlight instance shared by both code-block surfaces:
 *  - the editor (via CodeBlockLowlight in PostCodeBlock)
 *  - the reader (CodeBlock highlights fenced code with it)
 *
 * `common` bundles ~35 languages and their aliases (so `html`→xml, `ts`/`tsx`→
 * typescript, `js`/`jsx`→javascript, `py`→python, `yml`→yaml, `c++`→cpp all
 * resolve), which covers every entry in CODE_LANGUAGES.
 */
export const lowlight = createLowlight(common);

/** True when `lang` (name or alias) can be highlighted; false → render plain. */
export function canHighlight(lang?: string): boolean {
  const name = lang?.toLowerCase().trim();
  return !!name && lowlight.registered(name);
}
