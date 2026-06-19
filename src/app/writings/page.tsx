"use client";

import { House } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getMicroblogs } from "@/actions/microblogs";
import { getTilsPublic } from "@/actions/tils";
import { HeartButton } from "@/components/HeartButton";
import { Spinner } from "@/components/Spinner";

type Tab = "microblog" | "til";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WritingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const tab: Tab = raw === "til" || raw === "microblog" ? raw : "microblog";

  function switchTab(t: Tab) {
    router.replace(`/writings?tab=${t}`, { scroll: false });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8 md:mb-16">
        <div className="flex items-center gap-1.5 text-xs font-heading text-muted">
          <Link href="/" className="hover:text-fg transition-colors">
            <House weight="thin" className="w-3.5 h-3.5" />
          </Link>
          <span className="text-fg/20">/</span>
          <span className="text-fg/60">writings</span>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => switchTab("microblog")}
            className={`pb-1 text-xs transition-all cursor-pointer border-b-2 ${
              tab === "microblog"
                ? "border-fg text-fg"
                : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Microblog
          </button>
          <button
            onClick={() => switchTab("til")}
            className={`pb-1 text-xs transition-all cursor-pointer border-b-2 ${
              tab === "til" ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            TIL
          </button>
        </div>
      </div>

      {tab === "microblog" && <MicroblogContent />}
      {tab === "til" && <TilContent />}
    </>
  );
}

function MicroblogContent() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["microblogs-published"],
    queryFn: () => getMicroblogs(),
  });

  const published = posts.filter((p) => p.published);

  if (isLoading) return <Spinner />;

  if (published.length === 0) {
    return <p className="text-sm text-muted text-center py-8">Nothing here yet.</p>;
  }

  return (
    <div>
      {published.map((post) => (
        <article key={post.id} className="pb-8">
          {post.publishedAt && (
            <p className="text-xs text-muted mb-3">{formatDate(new Date(post.publishedAt))}</p>
          )}
          <Link href={`/microblog/${post.id}`} className="block space-y-3 group">
            <h2 className="text-base font-heading leading-snug">{post.title}</h2>
            <p className="text-xs text-fg/60 line-clamp-3">{stripHtml(post.content)}</p>
            {post.imageUrl && (
              <div className="overflow-hidden rounded-lg max-h-60 -mx-1 bg-hover-bg">
                <img
                  src={post.imageUrl}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </Link>
          <div className="mt-3">
            <HeartButton entityType="microblog" entityId={post.id} initialCount={0} />
          </div>
        </article>
      ))}
    </div>
  );
}

function TilContent() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["tils-public"],
    queryFn: getTilsPublic,
  });

  if (isLoading) return <Spinner />;

  if (items.length === 0) {
    return <p className="text-sm text-muted text-center py-8">Nothing here yet.</p>;
  }

  return (
    <div className="space-y-8">
      {items.map((item) => (
        <div key={item.id} className="flex gap-6">
          <div className="w-24 shrink-0 text-right space-y-2">
            <p className="text-xs text-fg/40 leading-tight whitespace-nowrap">
              {formatDate(new Date(item.createdAt))}
            </p>
            <div className="flex justify-end">
              <HeartButton entityType="til" entityId={item.id} initialCount={0} />
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-sm font-heading mb-2">{item.title}</h3>
            <p className="text-xs text-fg/70 leading-relaxed whitespace-pre-wrap">{item.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
