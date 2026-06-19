"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PencilSimple, Trash, DotsSixVertical, Plus } from "@phosphor-icons/react";
import { getStacks, createStack, updateStack, deleteStack, reorderStacks } from "@/actions/stacks";
import { ContentEditor } from "@/components/ContentEditor";
import { Spinner } from "@/components/Spinner";
import { ImageUpload } from "@/components/ImageUpload";
import { Drawer } from "@/components/Drawer";

interface Item {
  id: number;
  name: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  platform: string | null;
  sortOrder: number | null;
}

const empty = { name: "", url: "", description: "", imageUrl: "", platform: "" };

export default function StacksPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Item>>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      qc.setQueryData<Item[]>(["stacks"], (old) => [...(old || []), { ...data, id: -Date.now() } as Item]);
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["stacks"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) { setErrors(fe); return; }
      toast.error("Failed to create");
    },
    onSuccess: () => { setErrors({}); toast.success("Stack created"); setDrawerOpen(false); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["stacks"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) => updateStack(id, data as any),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["stacks"] });
      const prev = qc.getQueryData<Item[]>(["stacks"]);
      qc.setQueryData<Item[]>(["stacks"], (old) => old?.map((item) => (item.id === id ? { ...item, ...data } : item)));
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["stacks"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) { setErrors(fe); return; }
      toast.error("Failed to update");
    },
    onSuccess: () => { setErrors({}); toast.success("Stack updated"); setDrawerOpen(false); },
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
    onError: (_err, _id, ctx) => { if (ctx?.prev) qc.setQueryData(["stacks"], ctx.prev); toast.error("Failed to delete"); },
    onSuccess: () => toast.success("Stack deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["stacks"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderStacks(items.map(i => i.id)),
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
  const inputCls = "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";
  const errCls = (k: string) => errors[k] ? "text-xs text-red-400 mt-1" : "hidden";

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading">Stacks</h1>
        <button onClick={() => { setForm(empty); setEditId(null); setErrors({}); setDrawerOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"><Plus weight="bold" className="w-4 h-4" /></button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stacks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}
                      className={`flex items-center px-4 py-3 border rounded-xl transition-colors ${snapshot.isDragging ? "border-hairline bg-hover-bg shadow-lg" : "border-hairline hover:bg-hover-bg"}`}>
                      <div {...provided.dragHandleProps} className="mr-3 flex items-center shrink-0 p-2 -ml-2 rounded-lg hover:bg-hover-bg transition-colors cursor-grab active:cursor-grabbing">
                        <DotsSixVertical weight="thin" className="w-4 h-4 text-fg/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.platform && <p className="text-xs text-fg/50">{item.platform}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button onClick={() => { setForm(item); setEditId(item.id); setErrors({}); setDrawerOpen(true); }} className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"><PencilSimple weight="thin" className="w-4 h-4" /></button>
                        <button onClick={() => deleteMut.mutate(item.id)} className="p-2.5 text-red-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash weight="thin" className="w-4 h-4" /></button>
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

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setErrors({}); }}
        title={editId ? "Edit Stack" : "Add Stack"}
        headerActions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setDrawerOpen(false); setErrors({}); }} className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all">Cancel</button>
            <button type="submit" form="stack-form" disabled={isPending} className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">{editId ? "Update" : "Create"}</button>
          </div>
        }
      >
        <form id="stack-form" onSubmit={(e) => { e.preventDefault(); setErrors({}); if (editId) updateMut.mutate({ id: editId, data: form }); else createMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Name</label>
              <input value={f("name")} onChange={(e) => s("name", e.target.value)} className={inputCls} required />
              <p className={errCls("name")}>{errors.name}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">URL</label>
              <input value={f("url")} onChange={(e) => s("url", e.target.value)} className={inputCls} required placeholder="https://" />
              <p className={errCls("url")}>{errors.url}</p>
            </div>
            <ImageUpload currentUrl={f("imageUrl")} onUpload={(url) => s("imageUrl", url)} onRemove={() => s("imageUrl", "")} />
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Platform</label>
              <input value={f("platform")} onChange={(e) => s("platform", e.target.value)} className={inputCls} placeholder="e.g. Web, macOS, iOS" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">Description (tech stack)</label>
            <textarea value={f("description")} onChange={(e) => s("description", e.target.value)} className={`${inputCls} resize-none h-20`} placeholder="React, Adobe Illustrator, etc." />
            <p className={errCls("description")}>{errors.description}</p>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
