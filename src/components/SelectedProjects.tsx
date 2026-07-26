import Link from "next/link";
import { RelativeDate } from "@/components/RelativeDate";
import { SectionHeader } from "@/components/SectionHeader";

interface ProjectItem {
  id: number;
  title: string;
  imageUrl: string | null;
  url: string | null;
  workedOn: string | null;
  published: boolean | null;
}

function Card({ project }: { project: ProjectItem }) {
  const inner = (
    <>
      <h3 className="font-heading text-sm leading-snug">{project.title}</h3>
      <div className="mt-3 overflow-hidden rounded-xl bg-hover-bg">
        {project.imageUrl ? (
          // Plain <img> (not next/image) so animated GIF covers keep playing.
          <img
            src={project.imageUrl}
            alt={project.title}
            loading="lazy"
            className="aspect-[4/3] w-full object-fill"
          />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </div>
      {project.workedOn && (
        <RelativeDate date={project.workedOn} className="mt-3 text-[11px] text-muted" />
      )}
    </>
  );

  const cls =
    "group flex snap-start shrink-0 basis-[94%] flex-col rounded-2xl border border-hairline bg-fg/[0.03] p-3 transition-colors hover:bg-fg/[0.06] sm:basis-auto sm:shrink";

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
    <section>
      <SectionHeader label="Selected Projects" href="/projects" linkLabel="View all" />
      {/* Mobile: horizontal swipe carousel. Desktop: 2-up grid, tight gap. */}
      <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-auto sm:grid sm:grid-cols-2 sm:overflow-visible">
        {projects.map((project) => (
          <Card key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
