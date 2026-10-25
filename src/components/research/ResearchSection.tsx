import { Note } from "@phosphor-icons/react/dist/ssr";
import ReactMarkdown from "react-markdown";
import { Peek } from "@/components/Peek";
import { RelatedLink } from "@/components/research/RelatedLink";
import { SectionHeader } from "@/components/SectionHeader";
import { MAX_FEATURED_INTERESTS, type RelatedItem } from "@/lib/research";

interface Interest {
  id: number;
  title: string;
  question: string;
  keywords: string[];
  summary: string;
  featured: boolean;
  related: RelatedItem[];
}

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p>{children}</p>,
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

function InterestRow({ r, n }: { r: Interest; n: number }) {
  return (
    <li className="flex gap-2.5 sm:gap-4">
      <span className="w-5 shrink-0 pt-1 font-mono text-[11px] text-muted tabular-nums sm:w-9">
        {String(n).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="space-y-1.5">
          {/* The heading stays inline so the note icon follows its last word,
              and the dialog lives outside the <h3>. */}
          <div className="text-base font-medium leading-snug text-fg text-pretty">
            <h3 className="inline">{r.question || r.title}</h3>
            {r.summary && (
              <Peek
                ariaLabel={`Read the note on ${r.title}`}
                icon={<Note weight="light" className="h-4 w-4" />}
                title={r.title}
                footer={`note · ${String(n).padStart(2, "0")}`}
                className="ml-1.5 inline-flex translate-y-[3px] cursor-pointer rounded-md p-0.5 text-muted transition-colors hover:bg-hover-bg hover:text-fg aria-expanded:bg-hover-bg aria-expanded:text-fg"
              >
                <div className="space-y-3">
                  <ReactMarkdown
                    allowedElements={["p", "a", "strong", "em"]}
                    unwrapDisallowed
                    components={mdComponents}
                  >
                    {r.summary}
                  </ReactMarkdown>
                </div>
              </Peek>
            )}
          </div>
          {r.keywords.length > 0 && (
            // A handwritten "on" opens the row, like the "by" on publication
            // bylines; wrapped lines hang under the first term, and a term
            // never breaks across lines.
            <p className="pl-[22px] -indent-[22px] text-[13px] leading-relaxed text-fg/70">
              <span
                aria-hidden
                className="mr-1.5 inline-block w-4 indent-0 font-hand text-[16px] leading-none text-muted"
              >
                on
              </span>
              <span className="sr-only">Keywords: </span>
              {r.keywords.map((k, i) => (
                <span key={k}>
                  {i > 0 && <span className="text-muted/60"> · </span>}
                  <span className="whitespace-nowrap">{k}</span>
                </span>
              ))}
            </p>
          )}
        </div>
        {r.related.length > 0 && (
          <ul className="-mx-2">
            {r.related.map((item) => (
              <li key={`${item.kind}-${item.title}`}>
                <RelatedLink item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

// Each interest leads with the question it chases; the write-up is a peek away.
// Featured interests come first, and the rest wait behind "+ N more" so a long
// list never buries the current direction.
export function ResearchSection({ interests }: { interests: Interest[] }) {
  if (interests.length === 0) return null;

  const featured = interests.filter((r) => r.featured);
  const lead = featured.length > 0 ? featured : interests.slice(0, MAX_FEATURED_INTERESTS);
  const rest = interests.filter((r) => !lead.includes(r));

  return (
    <section>
      <SectionHeader label="Research Interests" bordered />
      <ol className="space-y-8">
        {lead.map((r, i) => (
          <InterestRow key={r.id} r={r} n={i + 1} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="group/more mt-8">
          {/* Hidden once open: the list it reveals takes its place. */}
          <summary className="ml-7.5 inline-flex sm:ml-13 cursor-pointer list-none text-xs text-muted transition-colors hover:text-fg group-open/more:hidden [&::-webkit-details-marker]:hidden">
            + {rest.length} more {rest.length === 1 ? "interest" : "interests"}
          </summary>
          <ol className="space-y-8">
            {rest.map((r, i) => (
              <InterestRow key={r.id} r={r} n={lead.length + i + 1} />
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
