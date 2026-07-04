import { GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getHeartsCounts } from "@/actions/heart-counts";
import { AskButton } from "@/components/AskButton";
import { ContentTabs } from "@/components/ContentTabs";
import { ScrollDown } from "@/components/ScrollDown";
import { SearchBar } from "@/components/SearchBar";
import { SeeWorkLink } from "@/components/SeeWorkLink";
import { ShowcaseScroll } from "@/components/ShowcaseScroll";
import { LinkPreview } from "@/components/LinkPreview";
import { db } from "@/db";
import { books, microblogs, projects, siteConfig } from "@/db/schema";

export const revalidate = 3600;

export const metadata = {
  title: "Suckstobeanik",
  description:
    "Software engineer who loves building simple solutions. Projects, books, microblog, and more.",
  openGraph: {
    title: "Suckstobeanik",
    description:
      "Software engineer who loves building simple solutions. Projects, books, microblog, and more.",
    url: "/",
  },
  twitter: {
    title: "Suckstobeanik",
    description:
      "Software engineer who loves building simple solutions. Projects, books, microblog, and more.",
  },
};

export default async function Home() {
  const [allProjects, allPosts, readingBooks, workingOnRow] = await Promise.all([
    db.select().from(projects).orderBy(projects.sortOrder),
    db
      .select()
      .from(microblogs)
      .where(eq(microblogs.published, true))
      .orderBy(desc(microblogs.publishedAt)),
    db
      .select({ title: books.title, author: books.author })
      .from(books)
      .where(eq(books.status, "reading"))
      .limit(1),
    db.select().from(siteConfig).where(eq(siteConfig.key, "working_on")).limit(1),
  ]);

  const reading = readingBooks[0] ?? null;
  const workingOn = workingOnRow[0]?.value ?? null;

  const [projectHearts, postHearts] = await Promise.all([
    getHeartsCounts(
      "project",
      allProjects.map((p) => p.id),
    ),
    getHeartsCounts(
      "microblog",
      allPosts.map((p) => p.id),
    ),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Suckstobeanik",
            url: "https://suckstobeanik.vercel.app",
            image: "/profile.jpeg",
            sameAs: [
              "https://github.com/SucksToBeAnik",
              "https://www.linkedin.com/in/al-jami-islam-anik-485758285",
              "https://x.com/suckstobeanik",
            ],
          }),
        }}
      />
      {/* Negative margins cancel <main>'s pt-16 px-6 pb-32 so this div starts at the */}
      {/* true viewport top. h-screen + overflow-y-scroll makes it the scroll container. */}
      {/* snap-y mandatory gives true PDF-page behavior: each panel locks to the viewport. */}
      <div id="snap-container" className="-mx-6 -mt-16 -mb-32 h-screen overflow-y-scroll snap-y snap-mandatory overscroll-none no-scrollbar">
      <Suspense><ShowcaseScroll /></Suspense>

      {/* Page 1: Hero — exactly one viewport tall */}
      <div className="h-screen snap-start flex flex-col px-6 pt-16 pb-24">
        <div className="flex flex-col gap-16">
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

            <div className="space-y-3">
              <h1 className="text-4xl font-heading">@suckstobeanik</h1>
              <p className="text-base leading-relaxed text-fg/80 max-w-lg">
                I&apos;m a software engineer who loves building simple solutions. Here, I share a little
                bit of everything that interests me.
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
            </div>
          </section>

          {/* Now */}
          {(workingOn || reading) && (
            <section className="space-y-2">
              <p className="text-xs font-heading uppercase tracking-wider text-muted">Now</p>
              <div className="space-y-1 text-xs">
                {workingOn && (
                  <p className="text-fg/80">
                    Working on <span className="font-medium text-fg">{workingOn}</span>
                  </p>
                )}
                {reading && (
                  <p className="text-fg/80">
                    Reading <span className="font-medium text-fg">{reading.title}</span> by{" "}
                    {reading.author}
                  </p>
                )}
              </div>
            </section>
          )}

          <div className="w-fit"><SeeWorkLink /></div>
        </div>

        <div className="flex-1" />
        <ScrollDown />
      </div>

      {/* Page 2: Projects / Posts — snaps to top of viewport */}
      <div className="min-h-screen snap-start px-6 pb-32">
        <Suspense>
          <ContentTabs
            projects={allProjects}
            posts={allPosts}
            projectHearts={projectHearts}
            postHearts={postHearts}
          />
        </Suspense>
      </div>
    </div>
    </>
  );
}
