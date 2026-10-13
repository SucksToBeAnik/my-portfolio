import { VenueMarker } from "@/components/publications/VenueMarker";
import { VENUE_TYPE_LABELS, VENUE_TYPES, type VenueType } from "@/lib/publications";

/** Key for the venue markers — lists only the types actually on the page. */
export function VenueLegend({ types }: { types: Set<VenueType> }) {
  const shown = VENUE_TYPES.filter((t) => types.has(t));
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-[11px] text-muted">
      {shown.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <VenueMarker type={t} />
          {VENUE_TYPE_LABELS[t]}
        </li>
      ))}
    </ul>
  );
}
