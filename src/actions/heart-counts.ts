import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { hearts } from "@/db/schema";

export async function getHeartsCounts(
  entityType: string,
  entityIds: number[],
): Promise<Record<number, number>> {
  if (entityIds.length === 0) return {};
  const rows = await db
    .select({
      entityId: hearts.entityId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(hearts)
    .where(and(eq(hearts.entityType, entityType), inArray(hearts.entityId, entityIds)))
    .groupBy(hearts.entityId);
  const map: Record<number, number> = {};
  for (const row of rows) {
    map[row.entityId] = row.count;
  }
  return map;
}
