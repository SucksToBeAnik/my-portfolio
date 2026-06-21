import { eq } from "drizzle-orm";
import Link from "next/link";
import { getHeartsCounts } from "@/actions/heart-counts";
import { getTilsPublic } from "@/actions/tils";
import { Breadcrumb } from "@/components/Breadcrumb";
import { HeartButton } from "@/components/HeartButton";
import { db } from "@/db";
import { tils } from "@/db/schema";

export const metadata = {
  title: "TIL — Suckstobeanik",
  description: "Things I've learned — short notes and discoveries.",
};

export const revalidate = 3600;

export default async function TilPage() {
  const items = await getTilsPublic();
  const tilIds = items.map((t) => t.id);
  const heartsMap = await getHeartsCounts("til", tilIds);

  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "TIL" }]} />
      </div>

      {items.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      {items.map((item) => {
        const heartCount = heartsMap[item.id] ?? 0;
        return (
          <div key={item.id} className="flex gap-6">
            <div className="w-24 shrink-0 text-right space-y-2">
              <p className="text-xs text-fg/40 leading-tight whitespace-nowrap">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <div className="flex justify-end">
                <HeartButton entityType="til" entityId={item.id} initialCount={heartCount} />
              </div>
            </div>
            <Link
              href={`/til/${item.id}`}
              className="min-w-0 flex-1 pt-0.5 block group"
            >
              <p className="text-sm font-heading mb-2 group-hover:text-fg/60 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-fg/70 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {item.content}
              </p>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
