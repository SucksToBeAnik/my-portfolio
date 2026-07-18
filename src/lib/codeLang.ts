/** Fence-language helpers shared by the code block: alias normalisation for
 *  Prism grammar names, and pretty labels for the header badge. */

/** Common fence aliases → the Prism grammar name the editor expects. */
const ALIASES: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup",
  dockerfile: "docker",
};

/** Pretty display names for the header badge; falls back to the raw token. */
const LABELS: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  tsx: "TSX",
  jsx: "JSX",
  python: "Python",
  ruby: "Ruby",
  bash: "Bash",
  json: "JSON",
  yaml: "YAML",
  markup: "HTML",
  css: "CSS",
  scss: "SCSS",
  sql: "SQL",
  go: "Go",
  rust: "Rust",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  java: "Java",
  php: "PHP",
  markdown: "Markdown",
  diff: "Diff",
  docker: "Dockerfile",
  toml: "TOML",
};

/** Languages offered in the editor's code-block dropdown. Values are the tokens
 *  written into the markdown fence (```value); the reader normalises them with
 *  canonicalLang(), so `html` maps to the `markup` grammar, etc. An empty value
 *  means a plain (unhighlighted) block. */
export const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: "", label: "Plain text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "tsx", label: "TSX" },
  { value: "jsx", label: "JSX" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
];

/** Canonical Prism grammar name for a fence language (`ts` → `typescript`). */
export function canonicalLang(lang?: string): string | undefined {
  if (!lang) return undefined;
  const raw = lang.toLowerCase().trim();
  return ALIASES[raw] ?? raw;
}

/** Human label for the header badge (`ts` → `TypeScript`). */
export function languageLabel(lang?: string): string | undefined {
  const canonical = canonicalLang(lang);
  if (!canonical) return undefined;
  return LABELS[canonical] ?? canonical;
}
