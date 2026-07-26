/**
 * Shape and sizing for the homepage explore tiles (Life, Books, Watch).
 * Lives outside `src/actions/explore.ts` because a "use server" module can only
 * export async functions.
 */

/** How many covers each tile's stack can hold — the fan layout has this many slots. */
export const EXPLORE_STACK_SIZE = 3;

export interface ExploreSection {
  total: number;
  images: string[];
}

export type ExploreSectionKey = "life" | "books" | "media";
