import { getProjects } from "@/actions/projects";
import { getHeartsCounts } from "@/actions/heart-counts";
import { ProjectLink } from "@/components/ProjectLink";
import { HeartButton } from "@/components/HeartButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ClickableImage } from "@/components/ClickableImage";
import { VideoEmbed } from "@/components/VideoEmbed";

export const metadata = {
  title: "Projects — Suckstobeanik",
  description: "Things I've built — side projects, open source, and experiments.",
};

export const revalidate = 3600;

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
  const projectIds = items.map((p) => p.id);
  const heartsMap = await getHeartsCounts("project", projectIds);

  return (
    <div className="space-y-12">
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Projects" }]} />
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted">Nothing here yet.</p>
      )}

      {items.map((project) => {
        const heartCount = heartsMap[project.id] ?? 0;
        return (
        <article
          key={project.id}
          className="space-y-6 sm:grid sm:grid-cols-[100px_1fr] sm:gap-6"
        >
          <div className="flex sm:flex-col justify-between sm:items-end items-start gap-4 sm:gap-0 text-xs text-muted sm:text-right">
            <div className="flex sm:block items-center gap-4 sm:space-y-4">
              {project.workedOn && (
                <p>{formatDate(project.workedOn)}</p>
              )}
              <HeartButton
                entityType="project"
                entityId={project.id}
                initialCount={heartCount}
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

          <div className={`space-y-4 sm:grid sm:gap-4 min-h-0 ${project.videoUrl ? "sm:grid-cols-[3fr_2fr]" : "sm:grid-cols-[1fr_1fr]"}`}>
            {project.videoUrl ? (
              <VideoEmbed url={project.videoUrl} title={project.title} />
            ) : project.imageUrl ? (
              <ClickableImage
                src={project.imageUrl}
                alt={project.title}
                className="overflow-hidden rounded-lg max-h-[400px] cursor-pointer hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="bg-hover-bg rounded-lg max-h-[400px]" />
            )}
            <div className="overflow-y-auto max-h-[400px] space-y-2 pr-1">
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
