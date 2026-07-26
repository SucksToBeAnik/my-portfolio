/**
 * How many photos the homepage pile can hold. The scatter layout has exactly
 * this many hand-tuned slots, so featuring more would have nowhere to go.
 * Lives outside `src/actions/gallery.ts` because a "use server" module can only
 * export async functions.
 */
export const MAX_FEATURED_PHOTOS = 6;
