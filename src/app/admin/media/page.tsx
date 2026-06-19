"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Star, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  createMedia,
  deleteMedia,
  extractImdbId,
  getMedia,
  lookupIMDb,
  reorderMedia,
  updateMedia,
} from "@/actions/media";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { Spinner } from "@/components/Spinner";

interface Item {
  id: number;
  imdbId: string | null;
  title: string;
  year: string | null;
  type: "movie" | "series";
  posterUrl: string | null;
  plot: string | null;
  rating: number | null;
  status: "watching" | "watched" | "planned" | "dropped";
  seasons: number | null;
  sortOrder: number | null;
}

const empty = {
  imdbId: "",
  title: "",
  year: "",
  type: "movie" as const,
  posterUrl: "",
  plot: "",
  rating: null,
  status: "planned" as const,
  seasons: null,
};

const statusLabels: Record<string, string> = {
  watching: "Watching",
  watched: "Watched",
  planned: "Plan to Watch",
  dropped: "Dropped",
};

const statusIcons: Record<string, string> = {
  watching: "▶",
  watched: "✓",
  planned: "○",
  dropped: "✕",
};

export default function MediaPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Item>>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [imdbLookup, setImdbLookup] = useState(false);
  const [lookupInput, setLookupInput] = useState("");

  const { data: items = [], isLoading } = useQuery({ queryKey: ["media"], queryFn: getMedia });

  const createMut = useMutation({
    mutationFn: (data: Partial<Item>) => createMedia(data as any),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["media"] });
      const prev = qc.getQueryData<Item[]>(["media"]);
      qc.setQueryData<Item[]>(["media"], (old) => [
        ...(old || []),
        { ...data, id: -Date.now() } as Item,
      ]);
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["media"], ctx.prev);

      toast.error("Failed to create");
    },
    onSuccess: () => {
      toast.success("Added");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) => updateMedia(id, data as any),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["media"] });
      const prev = qc.getQueryData<Item[]>(["media"]);
      qc.setQueryData<Item[]>(["media"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["media"], ctx.prev);

      toast.error("Failed to update");
    },
    onSuccess: () => {
      toast.success("Updated");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMedia(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["media"] });
      const prev = qc.getQueryData<Item[]>(["media"]);
      qc.setQueryData<Item[]>(["media"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["media"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderMedia(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["media"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  async function handleLookup() {
    const imdbId = await extractImdbId(lookupInput);
    if (!imdbId) {
      toast.error("Could not extract IMDb ID from input");
      return;
    }
    setImdbLookup(true);
    const result = await lookupIMDb(imdbId);
    setImdbLookup(false);
    if (!result) {
      toast.error("Could not find on IMDb");
      return;
    }
    setForm((p) => ({
      ...p,
      title: result.title,
      year: result.year,
      type: result.type,
      posterUrl: result.posterUrl ?? "",
      plot: result.plot ?? "",
      seasons: result.seasons,
      imdbId: result.imdbId,
    }));
    toast.success(`Found: ${result.title}`);
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
        <h1 className="text-lg font-heading">Movies & Series</h1>
        <button
          onClick={() => {
            setForm(empty);
            setEditId(null);

            setLookupInput("");
            setDrawerOpen(true);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"
        >
          <Plus weight="bold" className="w-4 h-4" />
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="media">
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
                      {item.posterUrl && (
                        <img
                          src={item.posterUrl}
                          alt=""
                          className="w-10 h-14 rounded object-cover shrink-0 mr-3"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {item.title}
                          {item.year && (
                            <span className="text-fg/50 font-normal"> ({item.year})</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1 py-0.5 rounded bg-hover-bg text-fg/50">
                            {statusIcons[item.status]} {statusLabels[item.status]}
                          </span>
                          {item.rating ? (
                            <span className="inline-flex gap-0.5 shrink-0">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  weight="fill"
                                  className={`w-3 h-3 ${(item.rating ?? 0) >= n ? "text-fg" : "text-fg/30"}`}
                                />
                              ))}
                            </span>
                          ) : null}
                          {item.type === "series" && item.seasons && (
                            <span className="text-xs text-fg/30">{item.seasons} seasons</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button
                          onClick={() => {
                            setForm(item);
                            setEditId(item.id);

                            setLookupInput("");
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

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No entries yet.</p>}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={() => {
            setForm(empty);
            setEditId(null);
            setDrawerOpen(false);

            setLookupInput("");
          }}
          title={editId ? "Edit Entry" : "Add Movie / Series"}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setEditId(null);
                  setDrawerOpen(false);

                  setLookupInput("");
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="media-form"
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

                  setLookupInput("");
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="media-form"
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form
            id="media-form"
            onSubmit={async (e) => {
              e.preventDefault();

              const data = {
                ...form,
                rating: form.rating ?? null,
                seasons: form.seasons ?? null,
                year: form.year || undefined,
                plot: form.plot || undefined,
                posterUrl: form.posterUrl || undefined,
                imdbId: form.imdbId || undefined,
              };
              if (editId) updateMut.mutate({ id: editId, data });
              else createMut.mutate(data);
            }}
            className="space-y-4"
          >
            {!editId && (
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">IMDb ID or URL</label>
                <div className="flex gap-2">
                  <input
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLookup();
                      }
                    }}
                    className={inputCls}
                    placeholder="tt0111161 or https://imdb.com/title/tt0111161/"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={imdbLookup}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {imdbLookup ? "..." : "Lookup"}
                  </button>
                </div>
                <p className="text-[10px] text-fg/30">Paste an IMDb link or ID to auto-fill</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="text-xs text-fg/50">Year</label>
                <input
                  value={f("year")}
                  onChange={(e) => s("year", e.target.value)}
                  className={inputCls}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">Type</label>
                <select
                  value={f("type")}
                  onChange={(e) => s("type", e.target.value)}
                  className={inputCls}
                >
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">Status</label>
                <select
                  value={f("status")}
                  onChange={(e) => s("status", e.target.value)}
                  className={inputCls}
                >
                  <option value="planned">Plan to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="watched">Watched</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">Rating (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={f("rating") ?? ""}
                  onChange={(e) => s("rating", e.target.value ? Number(e.target.value) : null)}
                  className={inputCls}
                />
              </div>
              {form.type === "series" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-fg/50">Seasons</label>
                  <input
                    type="number"
                    min={1}
                    value={f("seasons") ?? ""}
                    onChange={(e) => s("seasons", e.target.value ? Number(e.target.value) : null)}
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Poster URL</label>
              <input
                value={f("posterUrl")}
                onChange={(e) => s("posterUrl", e.target.value)}
                className={inputCls}
                placeholder="Auto-filled from IMDb lookup"
              />
              {form.posterUrl && (
                <img
                  src={f("posterUrl")}
                  alt=""
                  className="w-16 h-24 object-cover rounded mt-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Plot</label>
              <textarea
                value={f("plot")}
                onChange={(e) => s("plot", e.target.value)}
                className={`${inputCls} resize-none h-20`}
                placeholder="Auto-filled from IMDb lookup"
              />
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete"
        message="Are you sure you want to delete this entry?"
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
