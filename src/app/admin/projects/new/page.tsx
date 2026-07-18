import { ProjectEditor } from "@/components/project-editor/ProjectEditor";

export default function NewProjectPage() {
  return (
    <ProjectEditor
      initial={{
        title: "",
        content: "",
        microview: "",
        tags: "",
        published: false,
        featured: false,
        imageUrl: "",
        videoUrl: "",
        url: "",
        githubUrl: "",
        workedOn: "",
      }}
    />
  );
}
