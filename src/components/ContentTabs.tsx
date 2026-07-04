"use client";

import { useEffect, useState } from "react";
import { getHeartsForEntities } from "@/actions/hearts";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ClickableImage } from "@/components/ClickableImage";
import { HeartButton } from "@/components/HeartButton";
import { ProjectLink } from "@/components/ProjectLink";
import { VideoEmbed } from "@/components/VideoEmbed";

function fmtDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ProjectItem {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  url: string | null;
  githubUrl: string | null;
  workedOn: string | null;
}

export function ContentTabs({
  projects,
  projectHearts = {},
}: {
  projects: ProjectItem[];
  projectHearts: Record<number, number>;
}) {
  const [heartedMap, setHeartedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) return;
    getHeartsForEntities("project", projectIds).then((ph) => {
      const map: Record<string, boolean> = {};
      for (const [id, val] of Object.entries(ph)) map[`project-${id}`] = val.hearted;
      setHeartedMap(map);
    });
  }, []);

  return (
    <section id="content">
      <div className="sticky top-0 z-10 bg-bg pt-6 pb-4 mb-8 border-b border-hairline">
        <Breadcrumb crumbs={[{ label: "Projects" }]} />
      </div>

      <div className="space-y-12">
        {projects.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}
        {projects.map((project) => {
          const heartCount = projectHearts[project.id] ?? 0;
          return (
            <article
              key={project.id}
              className="space-y-6 sm:grid sm:grid-cols-[100px_1fr] sm:gap-6"
            >
              <div className="flex sm:flex-col justify-between sm:items-end items-start gap-4 sm:gap-0 text-xs text-muted sm:text-right">
                <div className="flex sm:block items-center gap-4 sm:space-y-4">
                  {project.workedOn && <p>{fmtDate(project.workedOn)}</p>}
                  <HeartButton entityType="project" entityId={project.id} initialCount={heartCount} initialHearted={heartedMap[`project-${project.id}`]} />
                </div>
                <div className="flex sm:flex-col gap-2 sm:items-end sm:space-y-1.5">
                  {project.url && <ProjectLink url={project.url} label="Website" />}
                  {project.githubUrl && <ProjectLink url={project.githubUrl} label="GitHub" />}
                </div>
              </div>

              <div
                className={`space-y-4 sm:grid sm:gap-4 min-h-0 ${
                  project.videoUrl
                    ? "sm:grid-cols-[3fr_2fr]"
                    : "sm:grid-cols-[1fr_1fr]"
                }`}
              >
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
                  <h2 className="text-xl font-heading leading-snug">{project.title}</h2>
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
    </section>
  );
}
