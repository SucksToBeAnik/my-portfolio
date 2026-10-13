import ReactMarkdown from "react-markdown";
import { DefaultIntro } from "@/components/DefaultIntro";

const components: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="text-base leading-relaxed text-fg/80 max-w-lg">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-fg transition-opacity hover:opacity-70"
    >
      {children}
    </a>
  ),
};

/** The mode's own intro (Markdown, links allowed), or the built-in one. */
export function HomeIntro({ markdown }: { markdown: string }) {
  if (!markdown) return <DefaultIntro />;
  return (
    <div className="space-y-3">
      <ReactMarkdown
        allowedElements={["p", "a", "strong", "em"]}
        unwrapDisallowed
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
