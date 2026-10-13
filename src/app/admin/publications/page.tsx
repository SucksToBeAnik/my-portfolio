"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  createPublication,
  deletePublication,
  getPublications,
  reorderPublications,
  updatePublication,
} from "@/actions/publications";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { AuthorList } from "@/components/publications/AuthorList";
import { LinksEditor } from "@/components/publications/LinksEditor";
import { VenuesEditor } from "@/components/publications/VenuesEditor";
import { Spinner } from "@/components/Spinner";
import {
  type PublicationLink,
  parseAuthors,
  SELF_AUTHOR_NAMES,
  type Venue,
  venueTitle,
} from "@/lib/publications";

type Item = Awaited<ReturnType<typeof getPublications>>[number];

interface Form {
  title: string;
  authors: string;
  venues: Venue[];
  links: PublicationLink[];
  url: string;
  bibtex: string;
  description: string;
  publishedOn: string;
}

const empty: Form = {
  title: "",
  authors: SELF_AUTHOR_NAMES[0],
  venues: [],
  links: [],
  url: "",
  bibtex: "",
  description: "",
  publishedOn: "",
};

function toForm(item: Item): Form {
  return {
    title: item.title,
    authors: item.authors ?? "",
    venues: item.venues ?? [],
    links: item.links ?? [],
    url: item.url ?? "",
    bibtex: item.bibtex ?? "",
    description: item.description ?? "",
    publishedOn: item.publishedOn ?? "",
  };
}

function venueSummary(venues: Venue[] | null): string {
  return (venues ?? [])
    .map((v) =>
      v.status === "under_review"
        ? `Under review${v.name ? ` · ${venueTitle(v)}` : ""}`
        : venueTitle(v),
    )
    .filter(Boolean)
    .join(" · ");
}

export default function PublicationsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["publications"],
    queryFn: getPublications,
  });

  const createMut = useMutation({
    mutationFn: (data: Form) => createPublication(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["publications"] });
      const prev = qc.getQueryData<Item[]>(["publications"]);
      qc.setQueryData<Item[]>(["publications"], (old) => [
        ...(old || []),
        {
          ...data,
          id: -Date.now(),
          venue: null,
          sortOrder: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["publications"], ctx.prev);
      toast.error("Failed to create");
    },
    onSuccess: () => {
      toast.success("Created");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["publications"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Form }) => updatePublication(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["publications"] });
      const prev = qc.getQueryData<Item[]>(["publications"]);
      qc.setQueryData<Item[]>(["publications"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["publications"], ctx.prev);
      toast.error("Failed to update");
    },
    onSuccess: () => {
      toast.success("Updated");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["publications"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deletePublication(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["publications"] });
      const prev = qc.getQueryData<Item[]>(["publications"]);
      qc.setQueryData<Item[]>(["publications"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["publications"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["publications"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderPublications(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["publications"] }),
  });

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["publications"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  const isPending = createMut.isPending || updateMut.isPending;
  const s = <K extends keyof Form>(k: K, v: Form[K]) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md flex items-center justify-between">
        <h1 className="text-lg font-heading">Publications</h1>
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
        <Droppable droppableId="publications">
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
                        {venueSummary(item.venues) && (
                          <p className="text-xs text-fg/50 truncate">{venueSummary(item.venues)}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button
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
        <p className="text-xs text-fg/50 text-center py-8">No publications yet.</p>
      )}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={() => {
            setForm(empty);
            setEditId(null);
            setDrawerOpen(false);
          }}
          title={editId ? "Edit Publication" : "Add Publication"}
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
                form="publication-form"
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
                form="publication-form"
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form
            id="publication-form"
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
                value={form.title}
                onChange={(e) => s("title", e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Authors</label>
              <textarea
                value={form.authors}
                onChange={(e) => s("authors", e.target.value)}
                placeholder="Jane Doe*, Al Jami Islam Anik*, ..., John Roe†"
                className={`${inputCls} resize-none h-16`}
              />
              <p className="text-[11px] text-fg/40">
                Comma-separated, in byline order. Add <code>*</code> for equal contribution,{" "}
                <code>†</code> for corresponding author, <code>...</code> to elide. Your name is
                bolded automatically.
              </p>
              {form.authors.trim() && (
                <div className="rounded-lg bg-hover-bg px-3 py-2">
                  <AuthorList authors={parseAuthors(form.authors)} />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Venues</label>
              <p className="text-[11px] text-fg/40">
                One entry per appearance: main track, workshop, journal extension, arXiv, or a
                submission under review.
              </p>
              <VenuesEditor
                venues={form.venues}
                onChange={(v) => s("venues", v)}
                inputCls={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">
                Date (sets the year shown beside the paper)
              </label>
              <input
                type="date"
                value={form.publishedOn}
                onChange={(e) => s("publishedOn", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">
                Paper link (title links here; shown as “pdf”)
              </label>
              <input
                value={form.url}
                onChange={(e) => s("url", e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">More links</label>
              <LinksEditor links={form.links} onChange={(l) => s("links", l)} inputCls={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Abstract</label>
              <textarea
                value={form.description}
                onChange={(e) => s("description", e.target.value)}
                className={`${inputCls} resize-none h-32`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">BibTeX (enables the “cite” button)</label>
              <textarea
                value={form.bibtex}
                onChange={(e) => s("bibtex", e.target.value)}
                placeholder="@inproceedings{...}"
                className={`${inputCls} resize-none h-28 font-mono`}
              />
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete Publication"
        message="Are you sure you want to delete this publication?"
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
