"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getHeartsForEntities } from "@/actions/hearts";
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

interface PublicationItem {
  id: number;
  title: string;
  description: string | null;
  venue: string | null;
  url: string | null;
  publishedOn: string | null;
}

export function ContentTabs({
  projects,
  publications,
  projectHearts = {},
}: {
  projects: ProjectItem[];
  publications: PublicationItem[];
  projectHearts: Record<number, number>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "publications" ? "publications" : "projects";

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

  function switchTab(t: "projects" | "publications") {
    const url = t === "publications" ? "/?tab=publications" : "/";
    router.replace(url, { scroll: false });
  }

  return (
    <section id="content">
      <div className="sticky top-0 z-10 bg-bg flex gap-6 pt-6 pb-2.5 mb-8">
        <button
          onClick={() => switchTab("projects")}
          className={`pb-2.5 text-xs font-heading uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
            tab === "projects"
              ? "border-fg text-fg"
              : "border-transparent text-fg/50 hover:text-fg"
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => switchTab("publications")}
          className={`pb-2.5 text-xs font-heading uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
            tab === "publications"
              ? "border-fg text-fg"
              : "border-transparent text-fg/50 hover:text-fg"
          }`}
        >
          Publications
        </button>
      </div>

      {tab === "projects" && (
        <div className="space-y-12">
          {projects.length === 0 && (
            <p className="text-sm text-muted">Nothing here yet.</p>
          )}
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
      )}

      {tab === "publications" && (
        <div className="space-y-8">
          {publications.length === 0 && (
            <p className="text-sm text-muted">Nothing here yet.</p>
          )}
          {publications.map((publication) => (
            <article key={publication.id} className="space-y-1.5">
              {publication.publishedOn && (
                <p className="text-xs text-muted">{fmtDate(publication.publishedOn)}</p>
              )}
              {publication.url ? (
                <a
                  href={publication.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <h2 className="text-sm font-heading leading-snug group-hover:text-fg/60 transition-colors">
                    {publication.title}
                  </h2>
                </a>
              ) : (
                <h2 className="text-sm font-heading leading-snug">{publication.title}</h2>
              )}
              {publication.venue && (
                <p className="text-xs text-fg/60 italic">{publication.venue}</p>
              )}
              {publication.description && (
                <p className="text-xs text-fg/70 leading-relaxed">{publication.description}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
