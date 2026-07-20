import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { ProjectEditor } from "@/components/project-editor/ProjectEditor";
import { parseDraft, projectDraftSchema } from "@/lib/drafts";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(Number(id));
  if (!project) notFound();

  // A buffered draft only applies to a published project; ignore it otherwise.
  const draft = project.published ? parseDraft(projectDraftSchema, project.draft) : null;

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
        draft: draft
          ? {
              title: draft.title,
              content: draft.content ?? "",
              microview: draft.microview ?? "",
              tags: draft.tags ?? "",
              featured: draft.featured ?? false,
              imageUrl: draft.imageUrl ?? "",
              url: draft.url ?? "",
              githubUrl: draft.githubUrl ?? "",
              workedOn: draft.workedOn ?? "",
            }
          : null,
      }}
    />
  );
}
