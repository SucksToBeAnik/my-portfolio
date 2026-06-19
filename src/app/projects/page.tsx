import { getProjects } from "@/actions/projects";
import { ProjectLink } from "@/components/ProjectLink";
import { HeartButton } from "@/components/HeartButton";
import { getHeartsForEntities } from "@/actions/hearts";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ClickableImage } from "@/components/ClickableImage";

export const metadata = {
  title: "Projects — Suckstobeanik",
};

function formatDate(date: string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProjectsPage() {
  const items = await getProjects();
  const heartsMap = await getHeartsForEntities(
    "project",
    items.map((p) => p.id),
  );

  return (
    <div className="space-y-12">
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Projects" }]} />
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted">Nothing here yet.</p>
      )}

      {items.map((project) => {
        const heart = heartsMap[project.id] ?? { count: 0, hearted: false };
        return (
        <article
          key={project.id}
          className="space-y-6 sm:grid sm:grid-cols-[100px_1fr] sm:gap-6"
        >
          <div className="flex sm:flex-col justify-between sm:justify-start items-start gap-4 sm:gap-0 text-xs text-muted text-right">
            <div className="flex sm:block items-center gap-4 sm:space-y-4">
              {project.workedOn && (
                <p>{formatDate(project.workedOn)}</p>
              )}
              <HeartButton
                entityType="project"
                entityId={project.id}
                initialCount={heart.count}
                initialHearted={heart.hearted}
              />
            </div>
            <div className="flex sm:block gap-2 sm:space-y-1">
              {project.url && (
                <ProjectLink url={project.url} label="Website" />
              )}
              {project.githubUrl && (
                <ProjectLink url={project.githubUrl} label="GitHub" />
              )}
            </div>
          </div>

          <div className="space-y-4 sm:grid sm:grid-cols-[1fr_1fr] sm:gap-4 min-h-0">
            {project.imageUrl ? (
              <ClickableImage
                src={project.imageUrl}
                alt={project.title}
                className="overflow-hidden rounded-lg max-h-[220px] cursor-pointer hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="bg-hover-bg rounded-lg max-h-[220px]" />
            )}
            <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1">
              <h2 className="text-xl font-heading leading-snug">
                {project.title}
              </h2>
              {project.description && (
                <div
                  className="text-xs text-fg/80 prose-content"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              )}
            </div>
          </div>
        </article>
        );
      })}
    </div>
  );
}
