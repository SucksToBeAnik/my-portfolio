import { getHeartsCounts } from "@/actions/heart-counts";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProjectCard } from "@/components/ProjectCard";
import { db } from "@/db";
import { projects } from "@/db/schema";

export const metadata = {
  title: "Projects",
  description: "Things I've built — projects, experiments, and side work.",
  openGraph: {
    title: "Projects",
    description: "Things I've built — projects, experiments, and side work.",
    url: "/projects",
  },
  twitter: {
    title: "Projects",
    description: "Things I've built — projects, experiments, and side work.",
  },
};

export const revalidate = 3600;

export default async function ProjectsPage() {
  const allProjects = await db.select().from(projects).orderBy(projects.sortOrder);
  const heartCounts = await getHeartsCounts(
    "project",
    allProjects.map((p) => p.id),
  );

  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-12">
        <Breadcrumb crumbs={[{ label: "Projects" }]} />
      </div>

      {allProjects.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {allProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            heartCount={heartCounts[project.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
