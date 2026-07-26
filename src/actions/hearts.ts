"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { hearts } from "@/db/schema";

export async function toggleHeart(entityType: string, entityId: number) {
  const visitorId = (await cookies()).get("visitor_id")?.value;
  if (!visitorId) throw new Error("No visitor ID");

  const existing = await db
    .select()
    .from(hearts)
    .where(
      and(
        eq(hearts.entityType, entityType),
        eq(hearts.entityId, entityId),
        eq(hearts.visitorId, visitorId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(hearts).where(eq(hearts.id, existing[0].id));
  } else {
    await db.insert(hearts).values({ entityType, entityId, visitorId });
  }

  // No revalidatePath: HeartButton loads its own live count on mount, so the
  // count baked into a cached page is never what the visitor ends up seeing.
  // Busting the page cache on every click would only throw away good HTML.
}

export async function getHeartCount(
  entityType: string,
  entityId: number,
  visitorId: string | null,
) {
  const result = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
      userHearted:
        sql<number>`sum(case when visitor_id = ${visitorId ?? ""} then 1 else 0 end)`.mapWith(
          Number,
        ),
    })
    .from(hearts)
    .where(and(eq(hearts.entityType, entityType), eq(hearts.entityId, entityId)));

  return {
    count: result[0]?.count ?? 0,
    hearted: (result[0]?.userHearted ?? 0) > 0,
  };
}

export async function getHeartsForEntities(entityType: string, entityIds: number[]) {
  if (entityIds.length === 0) return {};
  const visitorId = (await cookies()).get("visitor_id")?.value;

  const rows = await db
    .select({
      entityId: hearts.entityId,
      count: sql<number>`count(*)`.mapWith(Number),
      userHearted:
        sql<number>`sum(case when visitor_id = ${visitorId ?? ""} then 1 else 0 end)`.mapWith(
          Number,
        ),
    })
    .from(hearts)
    .where(and(eq(hearts.entityType, entityType), inArray(hearts.entityId, entityIds)))
    .groupBy(hearts.entityId);

  const map: Record<number, { count: number; hearted: boolean }> = {};
  for (const row of rows) {
    map[row.entityId] = { count: row.count, hearted: row.userHearted > 0 };
  }
  return map;
}
