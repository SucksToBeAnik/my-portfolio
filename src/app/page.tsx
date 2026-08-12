import { GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { getShowcasedCv } from "@/actions/cvs";
import { getExploreSections } from "@/actions/explore";
import { getFeaturedGallery } from "@/actions/gallery";
import { CareerTrack } from "@/components/CareerTrack";
import { CvLink } from "@/components/CvLink";
import { ExploreTiles } from "@/components/ExploreTiles";
import { FeaturedPhotos } from "@/components/FeaturedPhotos";
import { HomeFooter } from "@/components/HomeFooter";
import { HomePublications } from "@/components/HomePublications";
import { LinkPreview } from "@/components/LinkPreview";
import { RecentPosts } from "@/components/RecentPosts";
import { SearchBar } from "@/components/SearchBar";
import { SelectedProjects } from "@/components/SelectedProjects";
import { db } from "@/db";
import { lifeEvents, microblogs, projects, publications, siteConfig } from "@/db/schema";
import { fetchCachedSiteMeta, type SiteMeta } from "@/lib/microlink";

const SOCIAL_URLS = {
  github: "https://github.com/SucksToBeAnik",
  linkedin: "https://www.linkedin.com/in/al-jami-islam-anik-485758285",
  x: "https://x.com/suckstobeanik",
} as const;

const SOCIAL_FALLBACKS: Record<keyof typeof SOCIAL_URLS, SiteMeta> = {
  github: {
    title: "SucksToBeAnik on GitHub",
    description: "Projects and open-source work by Anik.",
    image: null,
    logo: null,
  },
  linkedin: {
    title: "Al Jami Islam Anik on LinkedIn",
    description: "Anik's professional profile and experience.",
    image: null,
    logo: null,
  },
  x: {
    title: "@suckstobeanik on X",
    description: "Posts and updates from Anik.",
    image: null,
    logo: null,
  },
};

// Cached until an admin write calls revalidatePath("/"), or until the weekly
// social-preview metadata refresh. Every database source feeding this page
// revalidates it after a write: featured projects, posts, publications, work
// history (CareerTrack), featured photos, the showcased CV, the "working on"
// config, and the Life/Books/Watch counts behind the explore tiles.
// Nothing here reads the clock at render time — CareerTrack and FeaturedPhotos
// derive their years from stored dates, and SelectedProjects formats its
// relative dates client-side.
export const revalidate = false;

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
    featuredPhotos,
    exploreSections,
    socialMetadata,
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
      .limit(4),
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
    getFeaturedGallery(6),
    getExploreSections(),
    Promise.all(Object.values(SOCIAL_URLS).map(fetchCachedSiteMeta)),
  ]);

  const workingOn = workingOnRow[0]?.value ?? null;
  const workingOnUrl = workingOnUrlRow[0]?.value || null;
  const [githubMeta, linkedinMeta, xMeta] = socialMetadata;

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
              alt="Anik"
              width={56}
              height={56}
              className="rounded-2xl object-cover w-14 h-14"
            />
            {/* Ask used to sit beside search here; it lives in the nav pill now
                so it's reachable from every page. */}
            <SearchBar />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-heading">@anik</h1>
            <p className="text-base leading-relaxed text-fg/80 max-w-lg">
              Hey, I am Anik. I&apos;m a software engineer who loves building simple solutions.
              Welcome to my corner of the Internet!
            </p>
            {workingOn && (
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                <span className="text-fg/55">Currently working on </span>
                {workingOnUrl ? (
                  <Link
                    href={workingOnUrl}
                    target="_blank"
                    className="font-medium text-fg/80 underline decoration-fg/30 underline-offset-4 transition-colors hover:text-fg hover:decoration-fg"
                  >
                    {workingOn}
                  </Link>
                ) : (
                  <span className="font-medium text-fg/80">{workingOn}</span>
                )}
              </p>
            )}
          </div>

          {/* `light` weight, not `thin`: hairline strokes disappear against the
              near-white light background. Kept at a low opacity so the row stays
              secondary to the intro above it. */}
          <div className="flex items-center gap-3 text-fg/45">
            <LinkPreview
              url={SOCIAL_URLS.github}
              position="bottom"
              preload={githubMeta ?? SOCIAL_FALLBACKS.github}
              persistPreview
            >
              <Link
                href={SOCIAL_URLS.github}
                target="_blank"
                className="flex items-center gap-1.5 hover:text-fg transition-colors"
                aria-label="GitHub"
              >
                <GithubLogo weight="light" className="w-5 h-5" />
              </Link>
            </LinkPreview>
            <LinkPreview
              url="https://www.linkedin.com/in/al-jami-islam-anik-485758285"
              position="bottom"
              preload={linkedinMeta ?? SOCIAL_FALLBACKS.linkedin}
              persistPreview
            >
              <Link
                href={SOCIAL_URLS.linkedin}
                target="_blank"
                className="flex items-center gap-1.5 hover:text-fg transition-colors"
                aria-label="LinkedIn"
              >
                <LinkedinLogo weight="light" className="w-5 h-5" />
              </Link>
            </LinkPreview>
            <LinkPreview
              url={SOCIAL_URLS.x}
              position="bottom"
              preload={xMeta ?? SOCIAL_FALLBACKS.x}
              persistPreview
            >
              <Link
                href={SOCIAL_URLS.x}
                target="_blank"
                className="flex items-center gap-1.5 hover:text-fg transition-colors"
                aria-label="X / Twitter"
              >
                <XLogo weight="light" className="w-5 h-5" />
              </Link>
            </LinkPreview>
            {showcasedCv && <CvLink url={showcasedCv.fileUrl} title={showcasedCv.title} />}
          </div>
        </section>

        <SelectedProjects projects={featuredProjects} />
        <RecentPosts posts={recentPosts} />
        <HomePublications publications={allPublications} />
        <CareerTrack items={workEvents} />
        <FeaturedPhotos photos={featuredPhotos} />
        <ExploreTiles sections={exploreSections} />
        <HomeFooter />
      </div>
    </>
  );
}
