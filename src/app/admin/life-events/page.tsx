"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PencilSimple, Trash, DotsSixVertical, Plus, Briefcase, GraduationCap, Star, MapPin, PushPin, X } from "@phosphor-icons/react";
import { getLifeEvents, createLifeEvent, updateLifeEvent, deleteLifeEvent, reorderLifeEvents } from "@/actions/life-events";
import { ContentEditor } from "@/components/ContentEditor";
import { Spinner } from "@/components/Spinner";
import { Drawer } from "@/components/Drawer";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ImageUpload } from "@/components/ImageUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface Item {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string;
  imageUrl: string | null;
  url: string | null;
  type: string;
  current: boolean | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  sortOrder: number | null;
  updatedAt: Date | null;
}

const empty = { title: "", startDate: "", endDate: "", description: "", imageUrl: "", url: "", type: "education", current: false, location: "", latitude: null, longitude: null };

const types = ["education", "work", "travel", "milestone"];

const typeIcons: Record<string, React.ReactNode> = {
  education: <GraduationCap weight="fill" className="w-4 h-4" />,
  work: <Briefcase weight="fill" className="w-4 h-4" />,
  travel: <MapPin weight="fill" className="w-4 h-4" />,
  milestone: <Star weight="fill" className="w-4 h-4" />,
};

export default function LifeEventsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Item>>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ["life-events"], queryFn: getLifeEvents });

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
    mutationFn: (data: Partial<Item>) => createLifeEvent(data as any),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["life-events"] });
      const prev = qc.getQueryData<Item[]>(["life-events"]);
      qc.setQueryData<Item[]>(["life-events"], (old) => [...(old || []), { ...data, id: -Date.now() } as Item]);
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["life-events"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) { setErrors(fe); return; }
      toast.error("Failed to create");
    },
    onSuccess: () => { setErrors({}); toast.success("Event created"); setDrawerOpen(false); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["life-events"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) => updateLifeEvent(id, data as any),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["life-events"] });
      const prev = qc.getQueryData<Item[]>(["life-events"]);
      qc.setQueryData<Item[]>(["life-events"], (old) => old?.map((item) => (item.id === id ? { ...item, ...data } : item)));
      return { prev };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["life-events"], ctx.prev);
      const fe = parseErrors(err);
      if (fe) { setErrors(fe); return; }
      toast.error("Failed to update");
    },
    onSuccess: () => { setErrors({}); toast.success("Event updated"); setDrawerOpen(false); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["life-events"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteLifeEvent(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["life-events"] });
      const prev = qc.getQueryData<Item[]>(["life-events"]);
      qc.setQueryData<Item[]>(["life-events"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => { if (ctx?.prev) qc.setQueryData(["life-events"], ctx.prev); toast.error("Failed to delete"); },
    onSuccess: () => toast.success("Event deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["life-events"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderLifeEvents(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["life-events"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["life-events"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  const isPending = createMut.isPending || updateMut.isPending;
  const f = (k: string) => (form as any)?.[k] ?? "";
  const s = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls = "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";
  const selectCls = `${inputCls} appearance-none h-[34px]`;
  const errCls = (k: string) => errors[k] ? "text-xs text-red-400 mt-1" : "hidden";

  function dateDisplay(item: Item) {
    if (item.endDate) return `${item.startDate} - ${item.endDate}`;
    if (item.current && !item.endDate) return `${item.startDate} - Present`;
    return item.startDate;
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading">Life Events</h1>
        <button onClick={() => { setForm(empty); setEditId(null); setErrors({}); setDrawerOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"><Plus weight="bold" className="w-4 h-4" /></button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="life-events">
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
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-fg/50">{dateDisplay(item)}</p>
                        {item.location && <p className="text-[11px] text-fg/40 mt-0.5"><PushPin weight="fill" className="w-3 h-3 inline-block mr-0.5 align-text-top" />{item.location}</p>}
                        {item.updatedAt && <p className="text-[11px] text-fg/40 mt-0.5">edited {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <span className="text-fg/30">{typeIcons[item.type] || null}</span>
                        <button onClick={() => { setForm(item); setEditId(item.id); setErrors({}); setDrawerOpen(true); }} className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"><PencilSimple weight="thin" className="w-4 h-4" /></button>
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

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No life events yet.</p>}

      {confirmId === null && (<Drawer
        open={drawerOpen}
         onClose={() => { setForm(empty); setEditId(null); setDrawerOpen(false); setErrors({}); }}
        title={editId ? "Edit Event" : "Add Event"}
        headerActions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setForm(empty); setEditId(null); setDrawerOpen(false); setErrors({}); }} className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all">Cancel</button>
            <button type="submit" form="life-event-form" disabled={isPending} className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">{editId ? "Update" : "Create"}</button>
          </div>
        }
        footer={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setForm(empty); setEditId(null); setDrawerOpen(false); setErrors({}); }} className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all">Cancel</button>
            <button type="submit" form="life-event-form" disabled={isPending} className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">{editId ? "Update" : "Create"}</button>
          </div>
        }
      >
        <form id="life-event-form" onSubmit={async (e) => { e.preventDefault(); setErrors({}); let imageUrl = form.imageUrl; if (pendingFile) { try { imageUrl = await uploadToCloudinary(pendingFile); s("imageUrl", imageUrl); } catch { toast.error("Upload failed"); return; } } const data = { ...form, endDate: form.endDate || null, imageUrl: imageUrl || null, url: form.url || null, location: form.location || null, latitude: form.latitude ?? null, longitude: form.longitude ?? null, current: form.current ?? false }; if (editId) updateMut.mutate({ id: editId, data: data as any }); else createMut.mutate(data as any); }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs text-fg/50">Title</label>
              <input value={f("title")} onChange={(e) => s("title", e.target.value)} className={inputCls} required />
              <p className={errCls("title")}>{errors.title}</p>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs text-fg/50">Type</label>
              <div className="flex gap-2">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => s("type", t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      f("type") === t ? "bg-fg text-bg" : "bg-hover-bg text-fg/50 hover:text-fg"
                    }`}
                  >
                    {typeIcons[t]}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={`space-y-1.5 ${form.current ? "sm:col-span-2" : ""}`}>
              <label className="text-xs text-fg/50">Start Date</label>
              <div className="relative">
                <input type="date" value={f("startDate")} onChange={(e) => s("startDate", e.target.value)} className={`${inputCls} pr-8 dark:[color-scheme:dark]`} required />
                {f("startDate") && (
                  <button type="button" onClick={() => s("startDate", "")} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-fg/40 hover:text-fg transition-colors cursor-pointer">
                    <X weight="thin" className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className={errCls("startDate")}>{errors.startDate}</p>
            </div>
            {!form.current && (
              <div className="space-y-1.5">
                <label className="text-xs text-fg/50">End Date</label>
                <div className="relative">
                  <input type="date" value={f("endDate")} onChange={(e) => s("endDate", e.target.value)} className={`${inputCls} pr-8 dark:[color-scheme:dark]`} />
                  {f("endDate") && (
                    <button type="button" onClick={() => s("endDate", "")} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-fg/40 hover:text-fg transition-colors cursor-pointer">
                      <X weight="thin" className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="sm:col-span-2 flex items-center py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.current ?? false}
                  onChange={(e) => {
                    if (e.target.checked) s("endDate", "");
                    s("current", e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-hairline bg-hover-bg text-fg focus:ring-0"
                />
                <span className="text-xs text-fg/50">Currently active (no end date)</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">Image</label>
            <ImageUpload key={drawerOpen ? editId ?? "new" : "closed"} value={f("imageUrl")} onChange={(url) => s("imageUrl", url)} onRemove={() => s("imageUrl", "")} onFilePending={setPendingFile} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">URL</label>
            <input value={f("url")} onChange={(e) => s("url", e.target.value)} placeholder="https://..." className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">Location</label>
            <LocationPicker
              location={f("location")}
              latitude={form.latitude ?? null}
              longitude={form.longitude ?? null}
              onSelect={(loc, lat, lng) => { s("location", loc); s("latitude", lat); s("longitude", lng); }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">Description</label>
            <ContentEditor key={drawerOpen ? editId ?? "new" : "closed"} content={f("description")} onChange={(html) => s("description", html)} generateContext={{ title: f("title"), type: "lifeEvent" }} />
            <p className={errCls("description")}>{errors.description}</p>
          </div>
        </form>
      </Drawer>)}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete life event"
        message="Are you sure you want to delete this life event?"
        confirmLabel="Delete"
        onConfirm={() => { if (confirmId !== null) deleteMut.mutate(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
