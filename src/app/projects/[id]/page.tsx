import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHeartsCounts } from "@/actions/heart-counts";
import { BackButton } from "@/components/BackButton";
import { HeartButton } from "@/components/HeartButton";
import { PostToc } from "@/components/PostToc";
import { ProjectLink } from "@/components/ProjectLink";
import { PostPreview } from "@/components/post-editor/PostPreview";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { firstImage, stripMarkdown, truncate } from "@/lib/seo";
import { extractHeadings } from "@/lib/toc";

export const revalidate = 3600;

export async function generateStaticParams() {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.published, true));
  return rows.map((r) => ({ id: String(r.id) }));
}

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
  const headings = project.content ? extractHeadings(project.content) : [];

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
      <PostToc headings={headings} />
      <div className="space-y-6 md:space-y-8">
        <BackButton label="Projects" fallbackHref="/projects" />

        <article>
          <div className="flex items-start justify-between gap-4">
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
            {(project.url || project.githubUrl) && (
              <div className="flex shrink-0 items-center gap-2 text-xs">
                {project.url && <ProjectLink url={project.url} label="Live Site" />}
                {project.githubUrl && <ProjectLink url={project.githubUrl} label="GitHub" />}
              </div>
            )}
          </div>

          {project.content && (
            <PostPreview content={project.content} className="mt-12 text-fg/80" />
          )}
        </article>
      </div>

      <footer className="mt-16 rounded-3xl bg-fg/[0.03] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="font-heading text-xs uppercase tracking-[0.15em] text-muted">
            Thanks for reading
          </p>
          <HeartButton entityType="project" entityId={project.id} initialCount={heartCount} />
        </div>

        {(prev || next) && (
          <nav className="mt-10 grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                href={`/projects/${prev.id}`}
                className="group flex flex-col gap-1 rounded-xl bg-fg/[0.04] p-3 hover:bg-fg/[0.08] transition-colors"
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
                className="group flex flex-col gap-1 rounded-xl bg-fg/[0.04] p-3 text-right hover:bg-fg/[0.08] transition-colors"
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
          </nav>
        )}
      </footer>
    </>
  );
}
