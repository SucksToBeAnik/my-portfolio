import Link from "next/link";
import { cardCover } from "@/lib/seo";

export interface ProjectCardItem {
  id: number;
  title: string;
  microview: string | null;
  content: string | null;
  imageUrl: string | null;
  workedOn: string | null;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ProjectCard({ project }: { project: ProjectCardItem }) {
  const blurb = project.microview?.trim();
  const cover = cardCover(project.imageUrl, project.content);

  return (
    // Shared subgrid row tracks (title / microview / image / date): cards in the
    // same grid row size each track to the tallest card in that row, so microviews
    // — and therefore images — line up per row.
    <Link
      href={`/projects/${project.id}`}
      className="row-span-4 grid grid-rows-subgrid gap-3 rounded-2xl border border-hairline bg-fg/[0.03] p-4 transition-colors hover:bg-fg/[0.06]"
    >
      <h2 className="row-start-1 font-heading text-sm leading-snug">{project.title}</h2>
      {blurb && (
        <p className="row-start-2 text-sm text-fg/55 leading-tight line-clamp-4">{blurb}</p>
      )}
      {cover && (
        <div className="row-start-3 overflow-hidden rounded-xl bg-hover-bg">
          {/* Plain <img> so animated GIF covers keep playing. */}
          <img src={cover} alt="" loading="lazy" className="aspect-[4/3] w-full object-fill" />
        </div>
      )}
      <span className="row-start-4 self-end text-[11px] text-muted">
        {project.workedOn ? fmtDate(project.workedOn) : ""}
      </span>
    </Link>
  );
}
