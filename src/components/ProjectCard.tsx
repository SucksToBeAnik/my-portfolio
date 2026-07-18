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
    <div className="group flex h-full flex-col rounded-2xl border border-hairline bg-fg/[0.03] p-4 transition-colors hover:bg-fg/[0.06]">
      <Link href={`/projects/${project.id}`} className="flex flex-1 flex-col gap-3">
        <h2 className="font-heading text-sm uppercase tracking-wide leading-snug">
          {project.title}
        </h2>
        {blurb && <p className="text-sm text-fg/55 leading-tight line-clamp-4">{blurb}</p>}
        {cover && (
          <div className="overflow-hidden rounded-xl bg-hover-bg">
            {/* Plain <img> so animated GIF covers keep playing. */}
            <img src={cover} alt="" loading="lazy" className="aspect-[4/3] w-full object-fill" />
          </div>
        )}
      </Link>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted">
          {project.workedOn ? fmtDate(project.workedOn) : ""}
        </span>
        <HeartButton entityType="project" entityId={project.id} initialCount={heartCount} />
      </div>
    </div>
  );
}
