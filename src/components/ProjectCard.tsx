import Link from "next/link";
import { HeartButton } from "@/components/HeartButton";
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

export function ProjectCard({
  project,
  heartCount = 0,
}: {
  project: ProjectCardItem;
  heartCount?: number;
}) {
  const blurb = project.microview?.trim();
  const cover = cardCover(project.imageUrl, project.content);

  return (
    // Shared subgrid row tracks (title / microview / image / footer): cards in the
    // same grid row size each track to the tallest card in that row, so microviews
    // — and therefore images — line up per row.
    <div className="group relative row-span-4 grid grid-rows-subgrid gap-3 rounded-2xl border border-hairline bg-fg/[0.03] p-4 transition-colors hover:bg-fg/[0.06]">
      {/* Stretched overlay link: the whole card navigates; the footer sits above
          it (z-10) so the heart button stays independently clickable. */}
      <Link
        href={`/projects/${project.id}`}
        aria-label={project.title}
        className="absolute inset-0 z-0 rounded-2xl"
      />
      <h2 className="row-start-1 font-heading text-sm uppercase tracking-wide leading-snug">
        {project.title}
      </h2>
      {blurb && (
        <p className="row-start-2 text-sm text-fg/55 leading-tight line-clamp-4">{blurb}</p>
      )}
      {cover && (
        <div className="row-start-3 overflow-hidden rounded-xl bg-hover-bg">
          {/* Plain <img> so animated GIF covers keep playing. */}
          <img src={cover} alt="" loading="lazy" className="aspect-[4/3] w-full object-fill" />
        </div>
      )}
      <div className="row-start-4 relative z-10 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted">
          {project.workedOn ? fmtDate(project.workedOn) : ""}
        </span>
        <HeartButton entityType="project" entityId={project.id} initialCount={heartCount} />
      </div>
    </div>
  );
}
