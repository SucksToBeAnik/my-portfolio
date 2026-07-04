"use client";

import { DownloadSimple, Eye, PencilSimple, Plus, Star, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createCv, deleteCv, getCvs, setShowcasedCv, unshowcaseCv, updateCv } from "@/actions/cvs";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Drawer } from "@/components/Drawer";
import { ImageUpload } from "@/components/ImageUpload";
import { Spinner } from "@/components/Spinner";
import { cloudinaryDownloadUrl, uploadToCloudinary } from "@/lib/cloudinary";

interface Item {
  id: number;
  title: string;
  fileUrl: string;
  showcased: boolean | null;
}

const empty = { title: "", fileUrl: "" };

export default function CvsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Item>>(empty);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ["cvs"], queryFn: getCvs });

  const createMut = useMutation({
    mutationFn: (data: Partial<Item>) => createCv(data as any),
    onSuccess: () => {
      toast.success("Created");
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to create"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["cvs"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) => updateCv(id, data as any),
    onSuccess: () => {
      toast.success("Updated");
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to update"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["cvs"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCv(id),
    onSuccess: () => toast.success("Deleted"),
    onError: () => toast.error("Failed to delete"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["cvs"] }),
  });

  const showcaseMut = useMutation({
    mutationFn: (id: number) => setShowcasedCv(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["cvs"] });
      const prev = qc.getQueryData<Item[]>(["cvs"]);
      qc.setQueryData<Item[]>(["cvs"], (old) =>
        old?.map((item) => ({ ...item, showcased: item.id === id })),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cvs"], ctx.prev);
      toast.error("Failed to set showcase");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["cvs"] }),
  });

  const unshowcaseMut = useMutation({
    mutationFn: (id: number) => unshowcaseCv(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["cvs"] });
      const prev = qc.getQueryData<Item[]>(["cvs"]);
      qc.setQueryData<Item[]>(["cvs"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, showcased: false } : item)),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cvs"], ctx.prev);
      toast.error("Failed to unshowcase");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["cvs"] }),
  });

  const isPending = createMut.isPending || updateMut.isPending;
  const f = (k: string) => (form as any)?.[k] ?? "";
  const s = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md flex items-center justify-between">
        <h1 className="text-lg font-heading">CVs</h1>
        <button
          onClick={() => {
            setForm(empty);
            setEditId(null);
            setPendingFile(null);
            setDrawerOpen(true);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"
        >
          <Plus weight="bold" className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center px-4 py-3 border border-hairline rounded-xl hover:bg-hover-bg transition-colors"
          >
            <button
              onClick={() =>
                item.showcased ? unshowcaseMut.mutate(item.id) : showcaseMut.mutate(item.id)
              }
              className={`mr-3 p-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer shrink-0 ${item.showcased ? "bg-fg text-bg" : "bg-hover-bg text-fg/50 hover:text-fg"}`}
            >
              <Star weight={item.showcased ? "fill" : "thin"} className="w-3 h-3" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.title}</p>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-3">
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                aria-label="View"
              >
                <Eye weight="thin" className="w-4 h-4" />
              </a>
              <a
                href={cloudinaryDownloadUrl(item.fileUrl)}
                className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                aria-label="Download"
              >
                <DownloadSimple weight="thin" className="w-4 h-4" />
              </a>
              <button
                onClick={() => {
                  setForm(item);
                  setEditId(item.id);
                  setPendingFile(null);
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
        ))}
      </div>

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No CVs yet.</p>}

      {confirmId === null && (
        <Drawer
          open={drawerOpen}
          onClose={() => {
            setForm(empty);
            setEditId(null);
            setPendingFile(null);
            setDrawerOpen(false);
          }}
          title={editId ? "Edit CV" : "Add CV"}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setEditId(null);
                  setPendingFile(null);
                  setDrawerOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cv-form"
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
                  setPendingFile(null);
                  setDrawerOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cv-form"
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {editId ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form
            id="cv-form"
            onSubmit={async (e) => {
              e.preventDefault();
              let fileUrl = form.fileUrl;
              if (pendingFile) {
                try {
                  fileUrl = await uploadToCloudinary(pendingFile, "raw");
                } catch {
                  toast.error("Upload failed");
                  return;
                }
              }
              if (!fileUrl) {
                toast.error("Please upload a PDF");
                return;
              }
              if (editId) updateMut.mutate({ id: editId, data: { ...form, fileUrl } as any });
              else createMut.mutate({ ...form, fileUrl } as any);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">Title</label>
              <input
                value={f("title")}
                onChange={(e) => s("title", e.target.value)}
                placeholder="e.g. Frontend Engineer CV"
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-fg/50">PDF</label>
              <ImageUpload
                key={drawerOpen ? (editId ?? "new") : "closed"}
                value={f("fileUrl")}
                onChange={(url) => s("fileUrl", url)}
                onFilePending={setPendingFile}
                onRemove={() => s("fileUrl", "")}
                accept="application/pdf"
                resourceType="raw"
              />
            </div>
          </form>
        </Drawer>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete CV"
        message="Are you sure you want to delete this CV?"
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
