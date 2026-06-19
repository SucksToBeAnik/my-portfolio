"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PencilSimple, Trash, DotsSixVertical, Plus } from "@phosphor-icons/react";
import { getProjects, createProject, updateProject, deleteProject, reorderProjects } from "@/actions/projects";
import { ContentEditor } from "@/components/ContentEditor";
import { Spinner } from "@/components/Spinner";
import { ImageUpload } from "@/components/ImageUpload";
import { Drawer } from "@/components/Drawer";
import { ConfirmModal } from "@/components/ConfirmModal";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  url: string | null;
  githubUrl: string | null;
  workedOn: string | null;
  featured: boolean | null;
  sortOrder: number | null;
  updatedAt: Date | null;
}

const empty = {
  title: "", description: "", imageUrl: "", videoUrl: "",
  url: "", githubUrl: "", workedOn: "", featured: false,
};

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Project>>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const parseErrors = useCallback((err: unknown) => {
    if (err && typeof err === "object" && "issues" in err) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of (err as any).issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      return fieldErrors;
    }
    return null;
  }, []);

  const createMut = useMutation({
    mutationFn: (data: Partial<Project>) => createProject(data as any),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData<Project[]>(["projects"]);
      qc.setQueryData<Project[]>(["projects"], (old) => [
        ...(old || []), { ...data, id: -Date.now() } as Project,
      ]);
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) { setErrors(fe); return; }
      toast.error("Failed to create");
    },
    onSuccess: () => { setErrors({}); toast.success("Project created"); setDrawerOpen(false); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      updateProject(id, data as any),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData<Project[]>(["projects"]);
      qc.setQueryData<Project[]>(["projects"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) { setErrors(fe); return; }
      toast.error("Failed to update");
    },
    onSuccess: () => { setErrors({}); toast.success("Project updated"); setDrawerOpen(false); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData<Project[]>(["projects"]);
      qc.setQueryData<Project[]>(["projects"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => { if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev); toast.error("Failed to delete"); },
    onSuccess: () => toast.success("Project deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderProjects(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Project[]>(["projects"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  const isPending = createMut.isPending || updateMut.isPending;
  function openAdd() { setForm(empty); setEditId(null); setErrors({}); setDrawerOpen(true); }
  function openEdit(item: Project) { setForm(item); setEditId(item.id); setErrors({}); setDrawerOpen(true); }
  const f = (key: string) => (form as any)[key] ?? "";
  const s = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));
  const inputCls = "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";
  const errCls = (k: string) => errors[k] ? "text-xs text-red-400 mt-1" : "hidden";

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading">Projects</h1>
        <button onClick={openAdd} className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"><Plus weight="bold" className="w-4 h-4" /></button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="projects">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center px-4 py-3 border rounded-xl transition-colors ${
                        snapshot.isDragging ? "border-hairline bg-hover-bg shadow-lg" : "border-hairline hover:bg-hover-bg"
                      }`}
                    >
                      <div {...provided.dragHandleProps} className="mr-3 flex items-center shrink-0 p-2 -ml-2 rounded-lg hover:bg-hover-bg transition-colors cursor-grab active:cursor-grabbing">
                        <DotsSixVertical weight="thin" className="w-4 h-4 text-fg/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.featured ? <p className="text-xs text-fg/50">★ Featured</p> : null}
                        {item.updatedAt && (
                          <p className="text-[11px] text-fg/40 mt-0.5">
                            edited {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button onClick={() => openEdit(item)} className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"><PencilSimple weight="thin" className="w-4 h-4" /></button>
                        <button onClick={() => { setDrawerOpen(false); setConfirmId(item.id); }} className="p-2.5 text-red-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash weight="thin" className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No projects yet.</p>}

      {confirmId === null && (<Drawer
        open={drawerOpen}
         onClose={() => { setForm(empty); setEditId(null); setDrawerOpen(false); setErrors({}); }}
        title={editId ? "Edit Project" : "Add Project"}
        headerActions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setForm(empty); setEditId(null); setDrawerOpen(false); setErrors({}); }} className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all">Cancel</button>
            <button type="submit" form="project-form" disabled={isPending} className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">{editId ? "Update" : "Create"}</button>
          </div>
        }
        footer={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setForm(empty); setEditId(null); setDrawerOpen(false); setErrors({}); }} className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all">Cancel</button>
            <button type="submit" form="project-form" disabled={isPending} className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">{editId ? "Update" : "Create"}</button>
          </div>
        }
      >
        <form id="project-form" onSubmit={async (e) => { e.preventDefault(); setErrors({}); let imgUrl = form.imageUrl; let vidUrl = form.videoUrl; try { if (pendingImage) imgUrl = await uploadToCloudinary(pendingImage); if (pendingVideo) vidUrl = await uploadToCloudinary(pendingVideo, "video"); } catch { toast.error("Upload failed"); return; } if (editId) updateMut.mutate({ id: editId, data: { ...form, imageUrl: imgUrl, videoUrl: vidUrl } }); else createMut.mutate({ ...form, imageUrl: imgUrl, videoUrl: vidUrl }); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Title</label>
              <input value={f("title")} onChange={(e) => s("title", e.target.value)} className={inputCls} required />
              <p className={errCls("title")}>{errors.title}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Worked On</label>
              <div className="flex items-center gap-2">
                <input type="date" value={f("workedOn")} onChange={(e) => s("workedOn", e.target.value)} className={`${inputCls} dark:[color-scheme:dark]`} />
                <button type="button" onClick={() => s("featured", !(form.featured ?? false))} className={`shrink-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${form.featured ? "bg-fg text-bg" : "bg-hover-bg text-fg/50 hover:text-fg"}`}>
                  {form.featured ? "★" : "☆"}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Screenshot</label>
              <ImageUpload key={drawerOpen ? editId ?? "new" : "closed"} value={f("imageUrl")} onChange={(url) => s("imageUrl", url)} onRemove={() => s("imageUrl", "")} onFilePending={setPendingImage} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Demo Video</label>
              <ImageUpload key={drawerOpen ? editId ?? "new" : "closed"} value={f("videoUrl")} onChange={(url) => s("videoUrl", url)} onRemove={() => s("videoUrl", "")} accept="video/*" resourceType="video" onFilePending={setPendingVideo} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Project URL</label>
              <input value={f("url")} onChange={(e) => s("url", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">GitHub URL</label>
              <input value={f("githubUrl")} onChange={(e) => s("githubUrl", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">Description</label>
            <ContentEditor key={drawerOpen ? editId ?? "new" : "closed"} content={f("description")} onChange={(html) => s("description", html)} generateContext={{ title: f("title"), type: "project" }} />
            <p className={errCls("description")}>{errors.description}</p>
          </div>
        </form>
      </Drawer>)}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete project"
        message="Are you sure you want to delete this project?"
        confirmLabel="Delete"
        onConfirm={() => { if (confirmId !== null) deleteMut.mutate(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
