import { SectionHeader } from "@/components/SectionHeader";
import type { Source } from "@/lib/sources";

// Past this many, the rest fold behind "+ N more" so a long bibliography never
// outweighs the post it closes.
const VISIBLE = 6;

// Reads like a reference list: "Author, Title (Venue Year)", with the title as
// the link and the parts around it quieter.
function SourceRow({ s, n }: { s: Source; n: number }) {
  const where = [s.publisher, s.year].filter(Boolean).join(" ");
  return (
    <li className="flex gap-2.5 sm:gap-4">
      <span className="w-5 shrink-0 pt-[3px] font-mono text-[11px] text-muted tabular-nums sm:w-9">
        {String(n).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm leading-relaxed text-pretty text-muted">
          {s.author && <>{s.author}, </>}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline decoration-fg/30 underline-offset-[3px] transition-colors hover:decoration-fg"
          >
            {s.title}
          </a>
          {where && <> ({where})</>}
        </p>
        {s.note && (
          <p className="font-hand text-[17px] leading-snug text-muted text-pretty">{s.note}</p>
        )}
      </div>
    </li>
  );
}

// The works an article leans on, numbered like the research interests, with the
// author's handwritten aside under any source that has one.
export function PostSources({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  const lead = sources.slice(0, VISIBLE);
  const rest = sources.slice(VISIBLE);

  return (
    <section aria-label="Sources" className="mt-16">
      <SectionHeader label="Sources" bordered />
      <ol className="space-y-3">
        {lead.map((s, i) => (
          <SourceRow key={`${s.url}-${i}`} s={s} n={i + 1} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="group/more mt-3">
          <summary className="ml-7.5 inline-flex cursor-pointer list-none text-xs text-muted transition-colors hover:text-fg group-open/more:hidden sm:ml-13 [&::-webkit-details-marker]:hidden">
            + {rest.length} more {rest.length === 1 ? "source" : "sources"}
          </summary>
          <ol className="space-y-3">
            {rest.map((s, i) => (
              <SourceRow key={`${s.url}-${i}`} s={s} n={VISIBLE + i + 1} />
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
