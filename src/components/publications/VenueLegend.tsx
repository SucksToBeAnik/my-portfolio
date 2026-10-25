import { VenueMarker } from "@/components/publications/VenueMarker";
import { VENUE_TYPE_LABELS, VENUE_TYPES, type VenueType } from "@/lib/publications";

/** Key for the venue markers — lists only the types actually on the page. Sits
    quietly beside the section title; the markers in the entries do the work. */
export function VenueLegend({ types }: { types: Set<VenueType> }) {
  const shown = VENUE_TYPES.filter((t) => types.has(t));
  return (
    <ul className="flex flex-wrap justify-end gap-x-3 gap-y-1 font-mono text-[10px] lowercase text-muted">
      {shown.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <VenueMarker type={t} />
          {VENUE_TYPE_LABELS[t]}
        </li>
      ))}
    </ul>
  );
}
