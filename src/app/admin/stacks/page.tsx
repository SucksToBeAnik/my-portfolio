"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { createStack, deleteStack, getStacks, reorderStacks, updateStack } from "@/actions/stacks";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { ImageUpload } from "@/components/ImageUpload";
import { Spinner } from "@/components/Spinner";
import { TagPicker } from "@/components/TagPicker";
import { uploadToCloudinary } from "@/lib/cloudinary";

const CATEGORIES = [
  "Editor / IDE",
  "Language / Runtime",
  "Framework",
  "Database",
  "Design",
  "DevOps / Infrastructure",
  "AI / ML",
  "Terminal / CLI",
  "Productivity",
  "Hardware",
];

const platformTags = [
  "Frontend", "Backend", "Framework", "Design", "DevOps", "Database",
  "AI/ML", "Testing", "Analytics", "Security", "Infrastructure", "Productivity",
  "Web", "macOS", "iOS", "Android", "Windows", "Linux",
  "CLI", "API", "Desktop", "Mobile", "Browser", "Cross-platform",
];

interface Item {
  id: number;
  name: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  platform: string | null;
  category: string | null;
  sortOrder: number | null;
}

const empty = { name: "", url: "", description: "", imageUrl: "", platform: "", category: "" };

export default function StacksPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Item>>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [metaFetching, setMetaFetching] = useState(false);
  const metaTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: items = [], isLoading } = useQuery({ queryKey: ["stacks"], queryFn: getStacks });

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
    mutationFn: (data: Partial<Item>) => createStack(data as any),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["stacks"] });
      const prev = qc.getQueryData<Item[]>(["stacks"]);
      qc.setQueryData<Item[]>(["stacks"], (old) => [
        ...(old || []),
        { ...data, id: -Date.now() } as Item,
      ]);
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["stacks"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) {
        setErrors(fe);
        return;
      }
      toast.error("Failed to create");
    },
    onSuccess: () => {
      setErrors({});
      toast.success("Stack created");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["stacks"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) => updateStack(id, data as any),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["stacks"] });
      const prev = qc.getQueryData<Item[]>(["stacks"]);
      qc.setQueryData<Item[]>(["stacks"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["stacks"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) {
        setErrors(fe);
        return;
      }
      toast.error("Failed to update");
    },
    onSuccess: () => {
      setErrors({});
      toast.success("Stack updated");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["stacks"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteStack(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["stacks"] });
      const prev = qc.getQueryData<Item[]>(["stacks"]);
      qc.setQueryData<Item[]>(["stacks"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["stacks"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Stack deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["stacks"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) =>
      reorderStacks(items.map((i) => i.id)),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["stacks"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["stacks"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  const isPending = createMut.isPending || updateMut.isPending;
  const f = (k: string) => (form as any)?.[k] ?? "";
  const s = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";
  const errCls = (k: string) => (errors[k] ? "text-xs text-red-400 mt-1" : "hidden");

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md flex items-center justify-between">
        <h1 className="text-lg font-heading">Stacks</h1>
        <button
          onClick={() => {
            setForm(empty);
            setEditId(null);
            setErrors({});
            setDrawerOpen(true);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"
        >
          <Plus weight="bold" className="w-4 h-4" />
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stacks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center px-4 py-3 border rounded-xl transition-colors ${snapshot.isDragging ? "border-hairline bg-hover-bg shadow-lg" : "border-hairline hover:bg-hover-bg"}`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="mr-3 flex items-center shrink-0 p-2 -ml-2 rounded-lg hover:bg-hover-bg transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <DotsSixVertical weight="thin" className="w-4 h-4 text-fg/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.category && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-fg/10 rounded text-fg/60">{item.category}</span>
                          )}
                          {item.platform && item.platform.split(",").map((p) => p.trim()).filter(Boolean).map((p) => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 bg-hover-bg rounded text-fg/50">{p}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button
                          onClick={() => {
                            setForm(item);
                            setEditId(item.id);
                            setErrors({});
                            setDrawerOpen(true);
                          }}
                          className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                        >
                          <PencilSimple weight="thin" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDrawerOpen(false);
                            setConfirmId(item.id);
                          }}
                          className="p-2.5 text-red-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash weight="thin" className="w-4 h-4" />
                        </button>
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

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No stacks yet.</p>}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={() => {
            setForm(empty);
            setEditId(null);
            setDrawerOpen(false);
            setErrors({});
          }}
          title={editId ? "Edit Stack" : "Add Stack"}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setEditId(null);
                  setDrawerOpen(false);
                  setErrors({});
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="stack-form"
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          }
          footer={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setEditId(null);
                  setDrawerOpen(false);
                  setErrors({});
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="stack-form"
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form
            id="stack-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setErrors({});
              let imageUrl = form.imageUrl;
              if (pendingFile) {
                try {
                  imageUrl = await uploadToCloudinary(pendingFile);
                  s("imageUrl", imageUrl);
                } catch {
                  toast.error("Upload failed");
                  return;
                }
              }
              if (editId) updateMut.mutate({ id: editId, data: { ...form, imageUrl } });
              else createMut.mutate({ ...form, imageUrl });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">Name</label>
                <input
                  value={f("name")}
                  onChange={(e) => s("name", e.target.value)}
                  className={inputCls}
                  required
                />
                <p className={errCls("name")}>{errors.name}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">URL</label>
                <div className="relative">
                  <input
                    value={f("url")}
                    onChange={(e) => {
                      const url = e.target.value;
                      s("url", url);
                      if (editId) return;
                      clearTimeout(metaTimer.current);
                      if (!url.trim()) return;
                      const normalized = url.startsWith("http") ? url : `https://${url}`;
                      metaTimer.current = setTimeout(async () => {
                        setMetaFetching(true);
                        try {
                          const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(normalized)}`);
                          const json = await res.json();
                          if (json.status === "success") {
                            if (json.data.title && !f("name")) s("name", json.data.title);
                            if (json.data.logo?.url && !f("imageUrl")) s("imageUrl", json.data.logo.url);
                          }
                        } catch {}
                        setMetaFetching(false);
                      }, 600);
                    }}
                    className={inputCls}
                    required
                    placeholder="https://"
                  />
                  {metaFetching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-fg/40 pointer-events-none">
                      fetching...
                    </span>
                  )}
                </div>
                <p className={errCls("url")}>{errors.url}</p>
              </div>
              <ImageUpload
                key={drawerOpen ? (editId ?? "new") : "closed"}
                value={f("imageUrl")}
                onChange={(url) => s("imageUrl", url)}
                onRemove={() => s("imageUrl", "")}
                onFilePending={setPendingFile}
              />
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">Category</label>
                <select
                  value={f("category") as string}
                  onChange={(e) => s("category", e.target.value)}
                  className={inputCls}
                >
                  <option value="">None</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">Platform tags</label>
                <TagPicker
                  value={f("platform") as string}
                  onChange={(v) => s("platform", v)}
                  tags={platformTags}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Description (tech stack)</label>
              <textarea
                value={f("description")}
                onChange={(e) => s("description", e.target.value)}
                className={`${inputCls} resize-none h-20`}
                placeholder="React, Adobe Illustrator, etc."
              />
              <p className={errCls("description")}>{errors.description}</p>
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete stack"
        message="Are you sure you want to delete this stack?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmId !== null) deleteMut.mutate(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
