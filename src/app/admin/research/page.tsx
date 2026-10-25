"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Star, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  createResearchInterest,
  deleteResearchInterest,
  getRelatableContent,
  getResearchInterests,
  reorderResearchInterests,
  toggleResearchFeatured,
  updateResearchInterest,
} from "@/actions/research";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { RelatedPicker } from "@/components/research/RelatedPicker";
import { Spinner } from "@/components/Spinner";
import { MAX_FEATURED_INTERESTS, type RelatedRef } from "@/lib/research";

type Item = Awaited<ReturnType<typeof getResearchInterests>>[number];

interface Form {
  title: string;
  question: string;
  // Comma-separated while editing; split into a list on save.
  keywords: string;
  summary: string;
  related: RelatedRef[];
}

const empty: Form = { title: "", question: "", keywords: "", summary: "", related: [] };

const toInput = (f: Form) => ({
  ...f,
  keywords: f.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean),
});

export default function ResearchPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["research"],
    queryFn: getResearchInterests,
  });
  const { data: relatable } = useQuery({
    queryKey: ["research-relatable"],
    queryFn: getRelatableContent,
  });

  const settle = () => qc.invalidateQueries({ queryKey: ["research"] });
  const close = () => {
    setForm(empty);
    setEditId(null);
    setDrawerOpen(false);
  };

  const saveMut = useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: Form }) =>
      id ? updateResearchInterest(id, toInput(data)) : createResearchInterest(toInput(data)),
    onSuccess: (_r, { id }) => {
      toast.success(id ? "Updated" : "Created");
      close();
    },
    onError: () => toast.error("Failed to save"),
    onSettled: settle,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteResearchInterest(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["research"] });
      const prev = qc.getQueryData<Item[]>(["research"]);
      qc.setQueryData<Item[]>(["research"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["research"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: settle,
  });

  const featureMut = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      toggleResearchFeatured(id, featured),
    onMutate: async ({ id, featured }) => {
      await qc.cancelQueries({ queryKey: ["research"] });
      const prev = qc.getQueryData<Item[]>(["research"]);
      qc.setQueryData<Item[]>(["research"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, featured } : item)),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["research"], ctx.prev);
      toast.error("Failed to update");
    },
    onSettled: settle,
  });

  const featuredCount = items.filter((item) => item.featured).length;

  function toggleFeatured(item: Item) {
    // Checked here as well as server-side so the admin gets a real explanation
    // instead of a generic action failure.
    if (!item.featured && featuredCount >= MAX_FEATURED_INTERESTS) {
      toast.error(`Only ${MAX_FEATURED_INTERESTS} interests can be featured at once`);
      return;
    }
    featureMut.mutate({ id: item.id, featured: !item.featured });
  }

  const reorderMut = useMutation({
    mutationFn: (updates: { id: number; sortOrder: number }[]) => reorderResearchInterests(updates),
    onError: () => toast.error("Failed to reorder"),
    onSettled: settle,
  });

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["research"], reordered);
    reorderMut.mutate(reordered.map((item, i) => ({ id: item.id, sortOrder: i })));
  }

  const s = <K extends keyof Form>(k: K, v: Form[K]) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";

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
        form="research-form"
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
        <div>
          <h1 className="text-lg font-heading">Research Interests</h1>
          <p className="text-[11px] text-fg/40">
            Shown on the academia home page. Star up to {MAX_FEATURED_INTERESTS} to lead; the rest
            fold under “more”.
          </p>
        </div>
        <button
          type="button"
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
        <Droppable droppableId="research">
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
                        {item.question && (
                          <p className="text-xs text-fg/60 truncate">{item.question}</p>
                        )}
                        <p className="text-xs text-fg/50 truncate">
                          {(item.related ?? []).length} related
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={() => toggleFeatured(item)}
                          title={item.featured ? "Stop leading with this" : "Lead with this"}
                          className={`p-2.5 rounded-lg transition-all hover:bg-hover-bg ${item.featured ? "text-fg" : "text-fg/30 hover:text-fg/60"}`}
                        >
                          <Star weight={item.featured ? "fill" : "thin"} className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForm({
                              title: item.title,
                              question: item.question,
                              keywords: (item.keywords ?? []).join(", "),
                              summary: item.summary,
                              related: item.related ?? [],
                            });
                            setEditId(item.id);
                            setDrawerOpen(true);
                          }}
                          className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                        >
                          <PencilSimple weight="thin" className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
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

      {items.length === 0 && (
        <p className="text-xs text-fg/50 text-center py-8">No research interests yet.</p>
      )}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={close}
          title={editId ? "Edit Research Interest" : "Add Research Interest"}
          headerActions={actions}
          footer={actions}
        >
          <form
            id="research-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveMut.mutate({ id: editId, data: form });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Title</label>
              <input
                value={form.title}
                onChange={(e) => s("title", e.target.value)}
                placeholder="LLM Evaluation"
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Question</label>
              <input
                value={form.question}
                onChange={(e) => s("question", e.target.value)}
                placeholder="Why do good agents make bad collaborators?"
                className={inputCls}
              />
              <p className="text-[11px] text-fg/40">
                The open question you're chasing — the homepage headline. Empty shows the title.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Keywords</label>
              <input
                value={form.keywords}
                onChange={(e) => s("keywords", e.target.value)}
                placeholder="multi-agent systems, coordination, reliability"
                className={inputCls}
              />
              <p className="text-[11px] text-fg/40">Comma-separated, up to 6.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Write-up</label>
              <textarea
                value={form.summary}
                onChange={(e) => s("summary", e.target.value)}
                placeholder="What draws you to it, what you've done, what you want to find out. Shown under “Why this matters”."
                className={`${inputCls} resize-none h-32`}
              />
              <p className="text-[11px] text-fg/40">
                A few sentences; blank line between paragraphs. Markdown: <code>[text](url)</code>,{" "}
                <code>**bold**</code>.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Related work</label>
              {relatable ? (
                <RelatedPicker
                  options={relatable}
                  value={form.related}
                  onChange={(v) => s("related", v)}
                />
              ) : (
                <Spinner />
              )}
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete Research Interest"
        message="Are you sure you want to delete this research interest?"
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
