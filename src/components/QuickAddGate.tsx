"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

const QuickAdd = dynamic(() => import("@/components/QuickAdd").then((m) => m.QuickAdd), {
  ssr: false,
});

/**
 * QuickAdd is admin-only but lives in the root layout so it works on every
 * page. This gate keeps its module graph (forms, book search, tag picker,
 * server-action refs) out of visitors' bundles: the chunk is only fetched
 * once a session exists.
 */
export function QuickAddGate() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return <QuickAdd />;
}
