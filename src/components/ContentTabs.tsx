"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getHeartsForEntities } from "@/actions/hearts";
import { ClickableImage } from "@/components/ClickableImage";
import { HeartButton } from "@/components/HeartButton";
import { ProjectLink } from "@/components/ProjectLink";
import { VideoEmbed } from "@/components/VideoEmbed";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

function fmtDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function readTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
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

interface PostItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: Date | null;
}

export function ContentTabs({
  projects,
  posts,
  projectHearts = {},
  postHearts = {},
}: {
  projects: ProjectItem[];
  posts: PostItem[];
  projectHearts: Record<number, number>;
  postHearts: Record<number, number>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "posts" ? "posts" : "projects";

  const [heartedMap, setHeartedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const projectIds = projects.map((p) => p.id);
    const postIds = posts.map((p) => p.id);
    Promise.all([
      projectIds.length ? getHeartsForEntities("project", projectIds) : {} as Record<number, { count: number; hearted: boolean }>,
      postIds.length ? getHeartsForEntities("microblog", postIds) : {} as Record<number, { count: number; hearted: boolean }>,
    ]).then(([ph, mh]) => {
      const map: Record<string, boolean> = {};
      for (const [id, val] of Object.entries(ph)) map[`project-${id}`] = val.hearted;
      for (const [id, val] of Object.entries(mh)) map[`microblog-${id}`] = val.hearted;
      setHeartedMap(map);
    });
  }, []);

  function switchTab(t: "projects" | "posts") {
    const url = t === "posts" ? "/?tab=posts" : "/";
    router.replace(url, { scroll: false });
  }

  return (
    <section id="content">
      <div className="sticky top-0 z-10 bg-bg flex gap-6 pt-6 mb-8 border-b border-hairline">
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
          onClick={() => switchTab("posts")}
          className={`pb-2.5 text-xs font-heading uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
            tab === "posts"
              ? "border-fg text-fg"
              : "border-transparent text-fg/50 hover:text-fg"
          }`}
        >
          Posts
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
                  <div className="flex sm:block gap-2 sm:space-y-1">
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

      {tab === "posts" && (
        <div className="space-y-8">
          {posts.length === 0 && (
            <p className="text-sm text-muted">Nothing here yet.</p>
          )}
          {posts.map((post) => {
            const heartCount = postHearts[post.id] ?? 0;
            return (
              <article key={post.id}>
                {post.publishedAt && (
                  <p className="text-xs text-muted mb-1.5">
                    {fmtDate(new Date(post.publishedAt))}
                    <span className="text-fg/20 mx-2">·</span>
                    {readTime(post.content)}
                  </p>
                )}
                <Link href={`/posts/${post.id}`} className="block space-y-2 group">
                  <h2 className="text-sm font-heading leading-snug group-hover:text-fg/60 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs text-fg/60 leading-relaxed line-clamp-3">
                    {stripHtml(post.content)}
                  </p>
                  {post.imageUrl && (
                    <div className="overflow-hidden rounded-lg max-h-48 bg-hover-bg">
                      <img
                        src={post.imageUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </Link>
                <div className="mt-2">
                  <HeartButton entityType="microblog" entityId={post.id} initialCount={heartCount} initialHearted={heartedMap[`microblog-${post.id}`]} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
