import ReactMarkdown from "react-markdown";
import { RelatedLink } from "@/components/research/RelatedLink";
import { SectionHeader } from "@/components/SectionHeader";
import type { RelatedItem } from "@/lib/research";

interface Interest {
  id: number;
  title: string;
  summary: string;
  related: RelatedItem[];
}

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="text-sm leading-relaxed text-fg/75">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-fg underline decoration-fg/30 underline-offset-4 hover:decoration-fg"
    >
      {children}
    </a>
  ),
};

// Numbered rows laid out like the Publications entries below them: a mono
// counter where the year sits, everything visible at once.
export function ResearchSection({ interests }: { interests: Interest[] }) {
  if (interests.length === 0) return null;

  return (
    <section>
      <SectionHeader label="Research Interests" bordered />
      <ol className="space-y-7">
        {interests.map((r, i) => (
          <li key={r.id} className="flex gap-4">
            <span className="w-9 shrink-0 pt-px font-mono text-[11px] text-muted tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="text-sm font-medium leading-snug text-fg">{r.title}</h3>
              {r.summary && (
                <div className="space-y-2">
                  <ReactMarkdown
                    allowedElements={["p", "a", "strong", "em"]}
                    unwrapDisallowed
                    components={mdComponents}
                  >
                    {r.summary}
                  </ReactMarkdown>
                </div>
              )}
              {r.related.length > 0 && (
                <ul className="-mx-2 pt-1">
                  {r.related.map((item) => (
                    <li key={`${item.kind}-${item.title}`}>
                      <RelatedLink item={item} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
