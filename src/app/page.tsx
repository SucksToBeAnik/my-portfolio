import Link from "next/link";
import Image from "next/image";
import { GithubLogo, LinkedinLogo, XLogo, FolderOpen } from "@phosphor-icons/react/dist/ssr";
import { LinkPreview } from "@/components/LinkPreview";
import { AskPrompt } from "@/components/AskPrompt";
import { db } from "@/db";
import { microblogs, projects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const revalidate = 3600;

export const metadata = {
  title: "Suckstobeanik",
  description: "Software engineer who loves building simple solutions. Projects, books, microblog, and more.",
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default async function Home() {
  const [recentPosts, featuredProjects] = await Promise.all([
    db
      .select({ id: microblogs.id, title: microblogs.title })
      .from(microblogs)
      .where(eq(microblogs.published, true))
      .orderBy(desc(microblogs.publishedAt))
      .limit(3),
    db
      .select({ id: projects.id, title: projects.title, description: projects.description })
      .from(projects)
      .where(eq(projects.featured, true))
      .orderBy(desc(projects.sortOrder)),
  ]);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="space-y-5">
        <Image
          src="/profile.jpeg"
          alt="Suckstobeanik"
          width={56}
          height={56}
          className="rounded-full object-cover w-14 h-14"
        />

        <div className="space-y-3">
          <h1 className="text-4xl font-heading">@suckstobeanik</h1>
            <p className="text-base leading-relaxed text-fg/80 max-w-lg">
              I&apos;m a software engineer who loves building simple solutions.
              Here, I share a little bit of everything that interests me.
              <span className="block"><AskPrompt /></span>
            </p>
        </div>

        <div className="flex items-center gap-2 text-fg/60">
          <LinkPreview url="https://github.com/SucksToBeAnik" position="bottom">
            <Link
              href="https://github.com/SucksToBeAnik"
              target="_blank"
              className="flex items-center gap-1.5 hover:text-fg transition-colors"
              aria-label="GitHub"
            >
              <GithubLogo weight="thin" className="w-5 h-5" />
            </Link>
          </LinkPreview>
          <LinkPreview url="https://www.linkedin.com/in/al-jami-islam-anik-485758285" position="bottom">
            <Link
              href="https://www.linkedin.com/in/al-jami-islam-anik-485758285"
              target="_blank"
              className="flex items-center gap-1.5 hover:text-fg transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedinLogo weight="thin" className="w-5 h-5" />
            </Link>
          </LinkPreview>
          <LinkPreview url="https://x.com/suckstobeanik" position="bottom">
            <Link
              href="https://x.com/suckstobeanik"
              target="_blank"
              className="flex items-center gap-1.5 hover:text-fg transition-colors"
              aria-label="X / Twitter"
            >
              <XLogo weight="thin" className="w-5 h-5" />
            </Link>
          </LinkPreview>
        </div>
      </section>

      {/* Blogs & Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Blogs */}
        {recentPosts.length > 0 && (
          <section className="space-y-4">
            <Link
              href="/microblog"
              className="group inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors"
            >
              <span>Blogs</span>
              <span className="group-hover:translate-x-0.5 transition-transform">
                &rarr;
              </span>
            </Link>

            <div className="space-y-0">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/microblog/${post.id}`}
                  className="block py-2.5 text-sm text-fg hover:text-muted transition-colors"
                >
                  {post.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {featuredProjects.length > 0 && (
          <section className="space-y-4">
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors"
            >
              <span>Projects</span>
              <span className="group-hover:translate-x-0.5 transition-transform">
                &rarr;
              </span>
            </Link>

            <div className="space-y-3">
              {featuredProjects.map((project) => (
                <Link
                  key={project.id}
                  href="/projects"
                  className="flex items-start gap-3 py-1.5 text-fg hover:text-muted transition-colors"
                >
                  <FolderOpen weight="thin" className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm">{project.title}</p>
                    {project.description && (
                      <p className="text-xs text-muted line-clamp-1">{stripHtml(project.description)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
