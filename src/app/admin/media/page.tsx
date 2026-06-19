"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Star, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  createMedia,
  deleteMedia,
  getMedia,
  lookupIMDb,
  reorderMedia,
  searchIMDb,
  updateMedia,
} from "@/actions/media";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { Spinner } from "@/components/Spinner";
import { StarRating } from "@/components/StarRating";

interface Item {
  id: number;
  imdbId: string | null;
  title: string;
  year: string | null;
  type: "movie" | "series";
  posterUrl: string | null;
  imdbUrl: string | null;
  plot: string | null;
  review: string | null;
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
  imdbUrl: "",
  plot: "",
  review: "",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchIMDb>>>([]);
  const [searching, setSearching] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchIMDb(q);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }

  async function handleSelect(imdbId: string) {
    setSearchResults([]);
    setSearchQuery("");
    setLookingUp(true);
    const result = await lookupIMDb(imdbId);
    setLookingUp(false);
    if (!result) { toast.error("Could not fetch details"); return; }
    setForm((p) => ({
      ...p,
      title: result.title,
      year: result.year,
      type: result.type,
      posterUrl: result.posterUrl ?? "",
      imdbUrl: result.imdbUrl ?? "",
      plot: result.plot ?? "",
      seasons: result.seasons,
      imdbId: result.imdbId,
    }));
    toast.success(`Loaded: ${result.title}`);
  }

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

            setSearchQuery(""); setSearchResults([]);
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
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <button
                          onClick={() => {
                            setForm(item);
                            setEditId(item.id);

                            setSearchQuery(""); setSearchResults([]);
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

            setSearchQuery(""); setSearchResults([]);
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

                  setSearchQuery(""); setSearchResults([]);
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

                  setSearchQuery(""); setSearchResults([]);
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
                review: form.review || undefined,
                posterUrl: form.posterUrl || undefined,
                imdbUrl: form.imdbUrl || undefined,
                imdbId: form.imdbId || undefined,
              };
              if (editId) updateMut.mutate({ id: editId, data });
              else createMut.mutate(data);
            }}
            className="space-y-4"
          >
            {!editId && (
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">Search</label>
                <div className="relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className={inputCls}
                    placeholder={lookingUp ? "Loading details…" : "Search for a movie or series…"}
                    disabled={lookingUp}
                    autoComplete="off"
                  />
                  {(searching || lookingUp) && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-fg/40">
                      {lookingUp ? "loading…" : "searching…"}
                    </span>
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-bg border border-hairline rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={r.imdbId}
                          type="button"
                          onClick={() => handleSelect(r.imdbId)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-hover-bg transition-colors text-left cursor-pointer"
                        >
                          {r.posterUrl ? (
                            <img src={r.posterUrl} alt="" className="w-8 h-11 object-cover rounded shrink-0" />
                          ) : (
                            <div className="w-8 h-11 rounded bg-hover-bg shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{r.title}</p>
                            <p className="text-[10px] text-fg/40">{r.year} · {r.type === "series" ? "Series" : "Movie"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                <label className="text-xs text-fg/50">Rating</label>
                <StarRating value={form.rating ?? null} onChange={(v) => s("rating", v)} />
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
              <label className="text-xs text-fg/50">IMDb URL</label>
              <input
                value={f("imdbUrl")}
                onChange={(e) => s("imdbUrl", e.target.value)}
                className={inputCls}
                placeholder="Auto-filled from IMDb lookup"
              />
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-fg/50">My Review</label>
                <span className={`text-[10px] tabular-nums ${(f("review") as string).length > 500 ? "text-red-400" : "text-fg/30"}`}>
                  {(f("review") as string).length}/500
                </span>
              </div>
              <textarea
                value={f("review")}
                onChange={(e) => s("review", e.target.value)}
                maxLength={500}
                className={`${inputCls} resize-none h-24`}
                placeholder="Your personal take…"
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
