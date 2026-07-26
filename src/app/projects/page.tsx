import { eq } from "drizzle-orm";
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

// Cached until an admin write calls revalidatePath("/projects") — nothing here
// is time- or visitor-dependent, so there's nothing for a timer to refresh.
export const revalidate = false;

export default async function ProjectsPage() {
  const allProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.published, true))
    .orderBy(projects.sortOrder);

  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-12">
        <Breadcrumb crumbs={[{ label: "Projects" }]} />
      </div>

      {allProjects.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {allProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
