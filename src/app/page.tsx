import { GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { getShowcasedCv } from "@/actions/cvs";
import { AskButton } from "@/components/AskButton";
import { CareerTrack } from "@/components/CareerTrack";
import { CvLink } from "@/components/CvLink";
import { HomePublications } from "@/components/HomePublications";
import { LinkPreview } from "@/components/LinkPreview";
import { RecentPosts } from "@/components/RecentPosts";
import { SearchBar } from "@/components/SearchBar";
import { SelectedProjects } from "@/components/SelectedProjects";
import { db } from "@/db";
import { lifeEvents, microblogs, projects, publications, siteConfig } from "@/db/schema";

export const revalidate = 3600;

export const metadata = {
  title: "Suckstobeanik",
  description:
    "Suckstobeanik — a software engineer from Dhaka, Bangladesh who loves building simple solutions. Projects, books, microblog, and more.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Suckstobeanik",
    description:
      "Suckstobeanik — a software engineer from Dhaka, Bangladesh who loves building simple solutions. Projects, books, microblog, and more.",
    url: "/",
  },
  twitter: {
    title: "Suckstobeanik",
    description:
      "Suckstobeanik — a software engineer from Dhaka, Bangladesh who loves building simple solutions.",
  },
};

export default async function Home() {
  const [
    featuredProjects,
    allPublications,
    workEvents,
    recentPosts,
    workingOnRow,
    workingOnUrlRow,
    showcasedCv,
  ] = await Promise.all([
    db
      .select({
        id: projects.id,
        title: projects.title,
        imageUrl: projects.imageUrl,
        url: projects.url,
        workedOn: projects.workedOn,
        published: projects.published,
      })
      .from(projects)
      .where(eq(projects.featured, true))
      .orderBy(projects.sortOrder)
      .limit(6),
    db
      .select({
        id: publications.id,
        title: publications.title,
        url: publications.url,
        publishedOn: publications.publishedOn,
      })
      .from(publications)
      .orderBy(publications.sortOrder),
    db
      .select({
        id: lifeEvents.id,
        title: lifeEvents.title,
        description: lifeEvents.description,
        role: lifeEvents.role,
        startDate: lifeEvents.startDate,
        endDate: lifeEvents.endDate,
        current: lifeEvents.current,
      })
      .from(lifeEvents)
      .where(eq(lifeEvents.type, "work")),
    db
      .select({
        id: microblogs.id,
        title: microblogs.title,
        publishedAt: microblogs.publishedAt,
      })
      .from(microblogs)
      .where(eq(microblogs.published, true))
      .orderBy(desc(microblogs.publishedAt))
      .limit(4),
    db.select().from(siteConfig).where(eq(siteConfig.key, "working_on")).limit(1),
    db.select().from(siteConfig).where(eq(siteConfig.key, "working_on_url")).limit(1),
    getShowcasedCv(),
  ]);

  const workingOn = workingOnRow[0]?.value ?? null;
  const workingOnUrl = workingOnUrlRow[0]?.value || null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Al Jami Islam Anik",
            alternateName: "Suckstobeanik",
            url: "https://suckstobeanik.vercel.app",
            image: "https://suckstobeanik.vercel.app/profile.jpeg",
            jobTitle: "Software Engineer",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Dhaka",
              addressCountry: "Bangladesh",
            },
            alumniOf: "BRAC University",
            sameAs: [
              "https://github.com/SucksToBeAnik",
              "https://www.linkedin.com/in/al-jami-islam-anik-485758285",
              "https://x.com/suckstobeanik",
            ],
          }),
        }}
      />

      <div className="flex flex-col gap-16 md:gap-20">
        {/* Hero */}
        <section className="space-y-5">
          <div className="flex items-start justify-between">
            <Image
              src="/profile.jpeg"
              alt="Suckstobeanik"
              width={56}
              height={56}
              className="rounded-full object-cover w-14 h-14"
            />
            <div className="flex items-center gap-2">
              <AskButton />
              <SearchBar />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-heading">@suckstobeanik</h1>
            <p className="text-base leading-relaxed text-fg/80 max-w-lg">
              I&apos;m a software engineer who loves building simple solutions. Here, I share a
              little bit of everything that interests me.
            </p>
            {workingOn && (
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                <span className="text-fg/30">Currently working on </span>
                {workingOnUrl ? (
                  <Link
                    href={workingOnUrl}
                    target="_blank"
                    className="font-medium text-fg/80 transition-colors hover:text-fg"
                  >
                    {workingOn}
                  </Link>
                ) : (
                  <span className="font-medium text-fg/80">{workingOn}</span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-fg/60">
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
            <LinkPreview
              url="https://www.linkedin.com/in/al-jami-islam-anik-485758285"
              position="bottom"
            >
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
            {showcasedCv && <CvLink url={showcasedCv.fileUrl} />}
          </div>
        </section>

        <SelectedProjects projects={featuredProjects} />
        <RecentPosts posts={recentPosts} />
        <HomePublications publications={allPublications} />
        <CareerTrack items={workEvents} />
      </div>
    </>
  );
}
