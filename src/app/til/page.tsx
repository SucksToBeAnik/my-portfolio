import { Quotes } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getHeartsCounts } from "@/actions/heart-counts";
import { getTilsPublic } from "@/actions/tils";
import { Breadcrumb } from "@/components/Breadcrumb";
import { HeartButton } from "@/components/HeartButton";

export const metadata = {
  title: "TIL",
  description: "Things I've learned \u2014 short notes and discoveries.",
  openGraph: {
    title: "TIL",
    description: "Things I've learned \u2014 short notes and discoveries.",
    url: "/til",
  },
  twitter: {
    title: "TIL",
    description: "Things I've learned \u2014 short notes and discoveries.",
  },
};

export const revalidate = 3600;

export default async function TilPage() {
  const items = await getTilsPublic();
  const tilIds = items.map((t) => t.id);
  const heartsMap = await getHeartsCounts("til", tilIds);

  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-12">
        <Breadcrumb
          crumbs={[
            { icon: <Quotes weight="thin" className="w-3.5 h-3.5" />, href: "/posts" },
            { label: "Today I Learned" },
          ]}
        />
      </div>

      {items.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      {items.map((item, index) => {
        const heartCount = heartsMap[item.id] ?? 0;
        return (
          <div key={item.id} className="flex gap-4 md:gap-5">
            <span className="shrink-0 pt-0.5 font-heading text-sm tabular-nums text-fg/25">
              {(index + 1).toString().padStart(3, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/til/${item.id}`} className="block group">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-heading group-hover:text-fg/60 transition-colors">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[11px] tabular-nums text-fg/40 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-fg/70 leading-relaxed whitespace-pre-wrap line-clamp-2">
                  {item.content}
                </p>
              </Link>
              <div className="mt-2 flex justify-end">
                <HeartButton entityType="til" entityId={item.id} initialCount={heartCount} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
