import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";

interface ProjectItem {
  id: number;
  title: string;
  imageUrl: string | null;
  url: string | null;
  workedOn: string | null;
  published: boolean | null;
}

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function Card({ project }: { project: ProjectItem }) {
  const date = project.workedOn ? relativeDate(project.workedOn) : "";
  const inner = (
    <>
      <h3 className="font-heading text-xs uppercase tracking-wide leading-snug">{project.title}</h3>
      <div className="mt-3 overflow-hidden rounded-xl bg-hover-bg">
        {project.imageUrl ? (
          // Plain <img> (not next/image) so animated GIF covers keep playing.
          <img
            src={project.imageUrl}
            alt={project.title}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </div>
      {date && <span className="mt-3 text-[11px] text-muted">{date}</span>}
    </>
  );

  const cls =
    "group flex snap-start shrink-0 basis-[94%] flex-col rounded-2xl border border-hairline bg-fg/[0.03] p-3 transition-colors hover:bg-fg/[0.06] lg:basis-auto lg:shrink";

  // Published projects have a deep-dive page; otherwise fall back to the
  // external site (or the projects index).
  if (project.published) {
    return (
      <Link href={`/projects/${project.id}`} className={cls}>
        {inner}
      </Link>
    );
  }

  return project.url ? (
    <a href={project.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href="/projects" className={cls}>
      {inner}
    </Link>
  );
}

export function SelectedProjects({ projects }: { projects: ProjectItem[] }) {
  if (projects.length === 0) return null;

  return (
    // Full-bleed break-out: the section spans the viewport and re-centers on a
    // wider max-width than the 680px reading column.
    <section className="relative left-1/2 w-screen -translate-x-1/2 px-6">
      <div className="mx-auto max-w-[940px]">
        <SectionHeader label="Selected Projects" />
        {/* Mobile: horizontal swipe carousel. Desktop: 3-up grid. */}
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x lg:grid lg:grid-cols-3 lg:overflow-visible lg:touch-auto">
          {projects.map((project) => (
            <Card key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
