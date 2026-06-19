import Link from "next/link";
import Image from "next/image";
import { GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import { LinkPreview } from "@/components/LinkPreview";

const articles = [
  { title: "Building a minimalist portfolio in 2025", slug: "minimal-portfolio" },
  { title: "Why I switched to Turso for side projects", slug: "turso-side-projects" },
  { title: "The art of intentional constraint", slug: "intentional-constraint" },
  { title: "Lessons from 5 years of freelancing", slug: "freelance-lessons" },
  { title: "Designing for the 680px column", slug: "680px-column" },
];

const featuredProjects = [
  { name: "HN", description: "A minimal Hacker News reader" },
  { name: "Rippled", description: "Ambient soundscapes for focus" },
  { name: "Ping", description: "Uptime monitoring for small teams" },
];

export default function Home() {
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
          <h1 className="text-4xl font-heading">Suckstobeanik</h1>
          <p className="text-base leading-relaxed text-fg/80 max-w-lg">
            I&apos;m a software engineer building things for the web. Currently
            working on tools that make developers&apos; lives easier.
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

      {/* Writing */}
      <section className="space-y-4">
        <Link
          href="/microblog"
          className="group flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors"
        >
          <span>Writing</span>
          <span className="group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </Link>

        <div className="space-y-0">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href="/microblog"
              className="block py-2.5 text-base text-fg hover:text-muted transition-colors"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="space-y-4">
        <Link
          href="/projects"
          className="group flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors"
        >
          <span>Projects</span>
          <span className="group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </Link>

        <div className="space-y-4">
          {featuredProjects.map((project) => (
            <div key={project.name} className="space-y-0.5">
              <h3 className="text-base font-medium">{project.name}</h3>
              <p className="text-sm text-muted">{project.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
