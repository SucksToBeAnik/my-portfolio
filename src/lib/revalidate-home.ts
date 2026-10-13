import { revalidatePath } from "next/cache";

// Kept apart from @/lib/mode, which the proxy and client components also import.

/** Revalidates every rendered variant of the home page (see src/app/home/[mode]). */
export function revalidateHome() {
  revalidatePath("/home/[mode]", "page");
}
