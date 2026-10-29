import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { clock, placeName } from "@/lib/visitor-format";
import { getVisitorLog, TIME_ZONE } from "@/lib/visitors";

/** Dashboard teaser for /admin/visitors: who came by last. */
export async function LatestVisitor() {
  const [latest] = await getVisitorLog(1);

  return (
    <Link
      href="/admin/visitors"
      className="flex items-center justify-between gap-3 border-t border-hairline -mx-4 -mb-4 px-4 py-3 text-xs hover:bg-hover-bg transition-colors rounded-b-xl"
    >
      <span className="truncate text-fg/60">
        {latest?.lastSeenAt ? (
          <>
            Latest: <span className="text-fg">{placeName(latest)}</span> ·{" "}
            {clock(latest.lastSeenAt, TIME_ZONE)}
            {latest.referrer && ` · from ${latest.referrer}`}
          </>
        ) : (
          "No visitor details yet"
        )}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        See all <ArrowRight weight="thin" className="w-3 h-3" />
      </span>
    </Link>
  );
}
