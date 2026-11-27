"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  type AwardInput,
  createAward,
  deleteAward,
  getAwards,
  reorderAwards,
  updateAward,
} from "@/actions/awards";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { Spinner } from "@/components/Spinner";

type Award = Awaited<ReturnType<typeof getAwards>>[number];
type Form = { title: string; detail: string; year: string; url: string };

const KEY = ["awards"];
const empty: Form = { title: "", detail: "", year: "", url: "" };

const toForm = (a: Award): Form => ({
  title: a.title,
  detail: a.detail ?? "",
  year: a.year ?? "",
  url: a.url ?? "",
});

const inputCls =
  "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";

export default function AwardsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: KEY, queryFn: getAwards });

  const close = () => {
    setForm(empty);
    setEditId(null);
    setDrawerOpen(false);
  };

  const saveMut = useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: AwardInput }) =>
      id ? updateAward(id, data) : createAward(data),
    onError: () => toast.error("Failed to save"),
    onSuccess: (_r, { id }) => {
      toast.success(id ? "Updated" : "Created");
      close();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAward(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Award[]>(KEY);
      qc.setQueryData<Award[]>(KEY, (old) => old?.filter((a) => a.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const reorderMut = useMutation({
    mutationFn: reorderAwards,
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Award[]>(KEY, reordered);
    reorderMut.mutate(reordered.map((a, i) => ({ id: a.id, sortOrder: i })));
  }

  const set = (k: keyof Form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  if (isLoading) return <Spinner />;

  const actions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={close}
        className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="award-form"
        disabled={saveMut.isPending}
        className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {editId ? "Update" : "Create"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md flex items-center justify-between">
        <h1 className="text-lg font-heading">Honors & Awards</h1>
        <button
          type="button"
          aria-label="Add award"
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
        <Droppable droppableId="awards">
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
                        <p className="text-xs text-fg/50 truncate">
                          {[item.detail, item.year].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => {
                            setForm(toForm(item));
                            setEditId(item.id);
                            setDrawerOpen(true);
                          }}
                          className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                        >
                          <PencilSimple weight="thin" className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
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

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No awards yet.</p>}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={close}
          title={editId ? "Edit award" : "Add award"}
          headerActions={actions}
          footer={actions}
        >
          <form
            id="award-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveMut.mutate({ id: editId, data: form });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label htmlFor="award-title" className="text-xs text-fg/50">
                Title
              </label>
              <input
                id="award-title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Best Demo Award ($1,000)"
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="award-detail" className="text-xs text-fg/50">
                Detail
              </label>
              <input
                id="award-detail"
                value={form.detail}
                onChange={(e) => set("detail", e.target.value)}
                placeholder="Who gave it, and for what"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="award-year" className="text-xs text-fg/50">
                Year
              </label>
              <input
                id="award-year"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                placeholder="2026, or 2022–2024"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="award-url" className="text-xs text-fg/50">
                Link
              </label>
              <input
                id="award-url"
                type="url"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://…"
                className={inputCls}
              />
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete award"
        message="Are you sure you want to delete this award?"
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
