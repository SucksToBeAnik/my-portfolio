import type { VenueType } from "@/lib/publications";

// No accent colours on this site, so venue types are told apart by shape:
// filled square, hollow square, hollow circle, hollow diamond.
const SHAPES: Record<VenueType, string> = {
  journal: "rounded-[1.5px] bg-current",
  conference: "rounded-[1.5px] border border-current",
  workshop: "rounded-full border border-current",
  preprint: "rotate-45 scale-[0.8] border border-current",
};

export function VenueMarker({ type }: { type: VenueType }) {
  return <span aria-hidden className={`inline-block size-[8px] shrink-0 ${SHAPES[type]}`} />;
}
