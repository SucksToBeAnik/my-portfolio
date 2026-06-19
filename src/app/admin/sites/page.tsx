"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Trash, PencilSimple } from "@phosphor-icons/react";
import { getSites, createSiteFromUrl, deleteSite, updateSite } from "@/actions/sites";
import { Spinner } from "@/components/Spinner";
import { Drawer } from "@/components/Drawer";

interface Site {
  id: number;
  url: string;
  tags: string | null;
  createdAt: Date;
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function SiteRow({ site, onDelete, onEdit }: { site: Site; onDelete: (id: number) => void; onEdit: (site: Site) => void }) {
  const domain = getDomain(site.url);
  const [meta, setMeta] = useState<{ title: string | null; logo: string | null } | null>(null);
  const fetchedUrl = useRef("");

  useEffect(() => {
    if (fetchedUrl.current === site.url) return;
    fetchedUrl.current = site.url;
    setMeta(null);
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(site.url)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "success") {
          setMeta({
            title: json.data.title || null,
            logo: json.data.logo?.url || null,
          });
        }
      })
      .catch(() => {});
  }, [site.url]);

  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const displayFavicon = meta?.logo || fallbackFavicon;
  const displayTitle = meta?.title || domain;

  return (
    <div className="flex items-center px-4 py-3 border border-hairline rounded-xl hover:bg-hover-bg transition-colors">
      <img
        src={displayFavicon}
        alt=""
        className="w-5 h-5 rounded shrink-0 mr-3"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{displayTitle}</p>
        <p className="text-[11px] text-fg/40 truncate">{site.url}</p>
        {site.tags && (
          <div className="flex flex-wrap gap-1 mt-1">
            {site.tags.split(",").map((tag) => (
              <span key={tag.trim()} className="px-1.5 py-0.5 text-[10px] bg-hover-bg rounded text-fg/50">{tag.trim()}</span>
            ))}
          </div>
        )}
        <p className="text-[11px] text-fg/30 mt-0.5">{formatDistanceToNow(new Date(site.createdAt), { addSuffix: true })}</p>
      </div>
      <div className="flex gap-1.5 shrink-0 ml-3">
        <button onClick={() => onEdit(site)} className="p-2 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"><PencilSimple weight="thin" className="w-4 h-4" /></button>
        <button onClick={() => onDelete(site.id)} className="p-2 text-red-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash weight="thin" className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export default function SitesPage() {
  const qc = useQueryClient();
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTags, setEditTags] = useState("");

  const { data: items = [], isLoading } = useQuery({ queryKey: ["sites"], queryFn: getSites });

  const createMut = useMutation({
    mutationFn: (url: string) => createSiteFromUrl(url),
    onSuccess: () => toast.success("Site added"),
    onError: (err: any) => toast.error(err?.message?.includes("Invalid") ? "Invalid URL" : "Failed to add site"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteSite(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["sites"] });
      const prev = qc.getQueryData<Site[]>(["sites"]);
      qc.setQueryData<Site[]>(["sites"], (old) => old?.filter((s) => s.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => { if (ctx?.prev) qc.setQueryData(["sites"], ctx.prev); toast.error("Failed to delete"); },
    onSuccess: () => toast.success("Site deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, url, tags }: { id: number; url: string; tags: string }) => {
      return updateSite(id, { url, tags: tags || undefined });
    },
    onSuccess: () => { toast.success("Site updated"); setEditSite(null); },
    onError: () => toast.error("Failed to update"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text");
      if (!text) return;
      try {
        new URL(text);
        createMut.mutate(text);
      } catch {}
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading">Sites</h1>
        <p className="text-[11px] text-fg/40">Paste a URL anywhere to add</p>
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 border border-dashed border-hairline rounded-xl">
          <p className="text-xs text-fg/50 mb-1">No sites yet</p>
          <p className="text-[11px] text-fg/30">Cmd+V a URL anywhere on this page</p>
        </div>
      )}

      <div className="space-y-1">
        {items.map((site) => (
          <SiteRow key={site.id} site={site} onDelete={(id) => deleteMut.mutate(id)} onEdit={(s) => { setEditSite(s); setEditUrl(s.url); setEditTags(s.tags ?? ""); }} />
        ))}
      </div>

      <Drawer open={!!editSite} onClose={() => setEditSite(null)} title="Edit Site">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">URL</label>
            <input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors"
              placeholder="https://"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-fg/50">Tags (comma-separated)</label>
            <textarea
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors resize-none h-20"
              placeholder="design, frontend, reference"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => editSite && updateMut.mutate({ id: editSite.id, url: editUrl, tags: editTags })}
              disabled={updateMut.isPending}
              className="px-4 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Save
            </button>
            <button onClick={() => setEditSite(null)} className="px-4 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all">Cancel</button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
