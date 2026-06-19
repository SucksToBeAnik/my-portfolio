"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createTil, deleteTil, getTils, reorderTils, updateTil } from "@/actions/tils";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { Spinner } from "@/components/Spinner";

interface Item {
  id: number;
  title: string;
  content: string;
}

const empty = { title: "", content: "" };

export default function TilsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Item>>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ["tils"], queryFn: getTils });

  const createMut = useMutation({
    mutationFn: (data: Partial<Item>) => createTil(data as any),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["tils"] });
      const prev = qc.getQueryData<Item[]>(["tils"]);
      qc.setQueryData<Item[]>(["tils"], (old) => [
        ...(old || []),
        { ...data, id: -Date.now() } as Item,
      ]);
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tils"], ctx.prev);
      toast.error("Failed to create");
    },
    onSuccess: () => {
      toast.success("Created");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tils"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) => updateTil(id, data as any),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tils"] });
      const prev = qc.getQueryData<Item[]>(["tils"]);
      qc.setQueryData<Item[]>(["tils"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tils"], ctx.prev);
      toast.error("Failed to update");
    },
    onSuccess: () => {
      toast.success("Updated");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tils"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTil(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tils"] });
      const prev = qc.getQueryData<Item[]>(["tils"]);
      qc.setQueryData<Item[]>(["tils"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tils"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tils"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderTils(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tils"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["tils"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  const isPending = createMut.isPending || updateMut.isPending;
  const f = (k: string) => (form as any)?.[k] ?? "";
  const s = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading">TIL</h1>
        <button
          onClick={() => {
            setForm(empty);
            setEditId(null);
            setDrawerOpen(true);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"
        >
          <Plus weight="bold" className="w-4 h-4" />
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tils">
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
                        <p className="text-sm font-medium truncate">{item.title}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button
                          onClick={() => {
                            setForm(item);
                            setEditId(item.id);
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

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No TILs yet.</p>}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={() => {
            setForm(empty);
            setEditId(null);
            setDrawerOpen(false);
          }}
          title={editId ? "Edit TIL" : "Add TIL"}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setEditId(null);
                  setDrawerOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="til-form"
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
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="til-form"
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form
            id="til-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (editId) updateMut.mutate({ id: editId, data: form });
              else createMut.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Title</label>
              <input
                value={f("title")}
                onChange={(e) => s("title", e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Content</label>
              <textarea
                value={f("content")}
                onChange={(e) => s("content", e.target.value)}
                className={`${inputCls} resize-none h-32`}
                required
              />
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete TIL"
        message="Are you sure you want to delete this TIL?"
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
