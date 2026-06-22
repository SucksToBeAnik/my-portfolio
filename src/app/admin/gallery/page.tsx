"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  createGalleryItem,
  deleteGalleryItem,
  getGallery,
  reorderGallery,
  updateGalleryItem,
} from "@/actions/gallery";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { ImageUpload } from "@/components/ImageUpload";
import { Spinner } from "@/components/Spinner";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface Item {
  id: number;
  title: string;
  imageUrl: string;
  width: number | null;
  height: number | null;
  takenAt: string | null;
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

const empty = { title: "", imageUrl: "", width: null, height: null, takenAt: null as string | null };

export default function GalleryAdminPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Item>>(empty);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ["gallery"], queryFn: getGallery });

  const createMut = useMutation({
    mutationFn: (data: Partial<Item>) => createGalleryItem(data as any),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["gallery"] });
      const prev = qc.getQueryData<Item[]>(["gallery"]);
      qc.setQueryData<Item[]>(["gallery"], (old) => [
        ...(old || []),
        { ...data, id: -Date.now() } as Item,
      ]);
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["gallery"], ctx.prev);
      toast.error("Failed to create");
    },
    onSuccess: () => {
      toast.success("Created");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) =>
      updateGalleryItem(id, data as any),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["gallery"] });
      const prev = qc.getQueryData<Item[]>(["gallery"]);
      qc.setQueryData<Item[]>(["gallery"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(["gallery"], ctx.prev);
      toast.error("Failed to update");
    },
    onSuccess: () => {
      toast.success("Updated");
      setDrawerOpen(false);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteGalleryItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["gallery"] });
      const prev = qc.getQueryData<Item[]>(["gallery"]);
      qc.setQueryData<Item[]>(["gallery"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["gallery"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderGallery(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["gallery"], reordered);
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
        <h1 className="text-lg font-heading">Gallery</h1>
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
        <Droppable droppableId="gallery">
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
                      {item.imageUrl && (
                        <div className="w-10 h-10 shrink-0 overflow-hidden mr-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.takenAt && (
                          <p className="text-[11px] text-fg/40 mt-0.5">
                            {new Date(item.takenAt).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
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

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No images yet.</p>}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={() => {
            setForm(empty);
            setEditId(null);
            setDrawerOpen(false);
          }}
          title={editId ? "Edit Image" : "Add Image"}
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
                form="gallery-form"
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
                form="gallery-form"
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form
            id="gallery-form"
            onSubmit={async (e) => {
              e.preventDefault();
              let imgUrl = form.imageUrl;
              try {
                if (pendingImage) imgUrl = await uploadToCloudinary(pendingImage);
              } catch {
                toast.error("Upload failed");
                return;
              }
              let dimensions = { width: form.width, height: form.height };
              if (pendingImage && imgUrl) {
                try {
                  dimensions = await getImageDimensions(imgUrl);
                } catch {}
              }
              if (editId) updateMut.mutate({ id: editId, data: { ...form, imageUrl: imgUrl, ...dimensions } });
              else createMut.mutate({ ...form, imageUrl: imgUrl, ...dimensions });
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
              <label className="text-xs text-fg/50">Image</label>
              <ImageUpload
                key={drawerOpen ? (editId ?? "new") : "closed"}
                value={f("imageUrl")}
                onChange={(url) => {
                  s("imageUrl", url);
                  setPendingImage(null);
                }}
                onRemove={() => {
                  s("imageUrl", "");
                  s("takenAt", null);
                }}
                onFilePending={async (file) => {
                  setPendingImage(file);
                  if (file) {
                    try {
                      const { default: exifr } = await import("exifr");
                      const exif = await exifr.parse(file, ["DateTimeOriginal"]);
                      if (exif?.DateTimeOriginal) {
                        s("takenAt", new Date(exif.DateTimeOriginal).toISOString());
                      }
                    } catch {}
                  }
                }}
              />
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete image"
        message="Are you sure you want to delete this image?"
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
