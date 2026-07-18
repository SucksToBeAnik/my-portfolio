import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHeartsCounts } from "@/actions/heart-counts";
import { ClickableImage } from "@/components/ClickableImage";
import { HeartButton } from "@/components/HeartButton";
import { ProjectLink } from "@/components/ProjectLink";
import { PostPreview } from "@/components/post-editor/PostPreview";
import { VideoEmbed } from "@/components/VideoEmbed";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { firstImage, stripMarkdown, truncate } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db
    .select({
      title: projects.title,
      microview: projects.microview,
      content: projects.content,
      imageUrl: projects.imageUrl,
      published: projects.published,
    })
    .from(projects)
    .where(eq(projects.id, Number(id)))
    .limit(1)
    .then((r) => r[0]);
  if (!project || !project.published) return { title: "Projects" };
  const desc = project.microview?.trim() || truncate(stripMarkdown(project.content ?? ""));
  const ogImage = project.imageUrl ?? firstImage(project.content);
  return {
    title: `${project.title} | Projects`,
    description: desc,
    openGraph: {
      title: `${project.title} | Projects`,
      description: desc,
      url: `/projects/${id}`,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      title: `${project.title} | Projects`,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readTime(content: string) {
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  const min = Math.max(1, Math.ceil(words / 200));
  return `${min} min read`;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = (
    await db
      .select()
      .from(projects)
      .where(eq(projects.id, Number(id)))
      .limit(1)
  )[0];
  if (!project || !project.published) notFound();

  const heartCounts = await getHeartsCounts("project", [project.id]);
  const heartCount = heartCounts[project.id] ?? 0;

  const prev =
    (
      await db
        .select({ id: projects.id, title: projects.title })
        .from(projects)
        .where(and(eq(projects.published, true), lt(projects.sortOrder, project.sortOrder ?? 0)))
        .orderBy(desc(projects.sortOrder))
        .limit(1)
    )[0] ?? null;

  const next =
    (
      await db
        .select({ id: projects.id, title: projects.title })
        .from(projects)
        .where(and(eq(projects.published, true), gt(projects.sortOrder, project.sortOrder ?? 0)))
        .orderBy(asc(projects.sortOrder))
        .limit(1)
    )[0] ?? null;

  const dateLabel = project.workedOn ? formatDate(project.workedOn) : null;
  const time = project.content ? readTime(project.content) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.microview,
            author: { "@type": "Person", name: "Suckstobeanik" },
            ...(project.url ? { url: project.url } : {}),
            ...(project.imageUrl ? { image: project.imageUrl } : {}),
          }),
        }}
      />
      <div className="space-y-6 md:space-y-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
        >
          <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
          Projects
        </Link>

        <article className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-heading">{project.title}</h1>
            {(dateLabel || time) && (
              <p className="text-xs text-muted">
                {dateLabel}
                {dateLabel && time && <span className="text-fg/20 mx-2">·</span>}
                {time}
              </p>
            )}
          </div>

          {project.videoUrl ? (
            <VideoEmbed url={project.videoUrl} title={project.title} />
          ) : project.imageUrl ? (
            <ClickableImage
              src={project.imageUrl}
              alt={project.title}
              className="w-full overflow-hidden rounded-xl bg-hover-bg cursor-pointer hover:opacity-90 transition-opacity"
            />
          ) : null}

          {project.content && <PostPreview content={project.content} className="text-fg/80" />}

          {(project.url || project.githubUrl) && (
            <div className="flex items-center gap-2 text-xs">
              {project.url && <ProjectLink url={project.url} label="Website" />}
              {project.githubUrl && <ProjectLink url={project.githubUrl} label="GitHub" />}
            </div>
          )}

          <HeartButton entityType="project" entityId={project.id} initialCount={heartCount} />
        </article>

        <div className="grid grid-cols-2 gap-3">
          {prev ? (
            <Link
              href={`/projects/${prev.id}`}
              className="group flex flex-col gap-1 rounded-xl bg-fg/5 p-3 hover:bg-fg/10 transition-colors"
            >
              <span className="flex items-center gap-1 text-[10px] font-heading uppercase tracking-wider text-muted">
                <ArrowLeft
                  weight="thin"
                  className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform"
                />
                Previous
              </span>
              <span className="text-xs text-fg truncate">{prev.title}</span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/projects/${next.id}`}
              className="group flex flex-col gap-1 rounded-xl bg-fg/5 p-3 text-right hover:bg-fg/10 transition-colors"
            >
              <span className="flex items-center justify-end gap-1 text-[10px] font-heading uppercase tracking-wider text-muted">
                Next
                <ArrowRight
                  weight="thin"
                  className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                />
              </span>
              <span className="text-xs text-fg truncate">{next.title}</span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </>
  );
}
