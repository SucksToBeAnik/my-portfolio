import { ClickableImage } from "@/components/ClickableImage";
import { HeartButton } from "@/components/HeartButton";
import { ProjectLink } from "@/components/ProjectLink";
import { stripHtml } from "@/lib/seo";

export interface ProjectCardItem {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  githubUrl: string | null;
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
  return (
    <article className="flex flex-col rounded-2xl border border-hairline bg-fg/[0.03] p-4 transition-colors hover:bg-fg/[0.06]">
      {project.imageUrl ? (
        <ClickableImage
          src={project.imageUrl}
          alt={project.title}
          className="w-full aspect-video overflow-hidden rounded-xl bg-hover-bg cursor-pointer hover:opacity-80 transition-opacity"
        />
      ) : (
        <div className="w-full aspect-video rounded-xl bg-hover-bg" />
      )}

      <div className="pt-4 space-y-2 flex-1 flex flex-col">
        <h2 className="text-base font-heading leading-snug">{project.title}</h2>
        {project.description && (
          <p className="text-xs text-fg/70 leading-relaxed line-clamp-4 flex-1">
            {stripHtml(project.description)}
          </p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-xs text-muted">
          <div className="flex items-center gap-3">
            {project.workedOn && <span>{fmtDate(project.workedOn)}</span>}
            <HeartButton entityType="project" entityId={project.id} initialCount={heartCount} />
          </div>
          <div className="flex items-center gap-2">
            {project.url && <ProjectLink url={project.url} label="Website" />}
            {project.githubUrl && <ProjectLink url={project.githubUrl} label="GitHub" />}
          </div>
        </div>
      </div>
    </article>
  );
}
