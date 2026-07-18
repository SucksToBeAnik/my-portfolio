import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { ProjectEditor } from "@/components/project-editor/ProjectEditor";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(Number(id));
  if (!project) notFound();

  return (
    <ProjectEditor
      projectId={project.id}
      initial={{
        title: project.title,
        content: project.content ?? "",
        microview: project.microview ?? "",
        tags: project.tags ?? "",
        published: project.published ?? false,
        featured: project.featured ?? false,
        imageUrl: project.imageUrl ?? "",
        url: project.url ?? "",
        githubUrl: project.githubUrl ?? "",
        workedOn: project.workedOn ?? "",
      }}
    />
  );
}
