import { VenueMarker } from "@/components/publications/VenueMarker";
import { VENUE_TYPE_LABELS, type Venue, venueTitle } from "@/lib/publications";

export function VenueBadge({ venue }: { venue: Venue }) {
  const pending = venue.status === "under_review";
  const name = venueTitle(venue);
  const label = pending ? (name ? `Under review · ${name}` : "Under review") : name;
  const extras = [venue.track, venue.note, venue.status === "accepted" ? "to appear" : ""].filter(
    Boolean,
  );

  // Under review gets a dashed outline and dimmer text: visible, but clearly
  // not claiming the same weight as an accepted paper.
  const cls = `inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] leading-tight ${
    pending ? "border-dashed border-fg/25 text-muted" : "border-hairline bg-fg/[0.04] text-fg/85"
  } ${venue.url ? "transition-colors hover:border-fg/40 hover:text-fg" : ""}`;

  const inner = (
    <>
      <VenueMarker type={venue.type} />
      <span className="sr-only">{VENUE_TYPE_LABELS[venue.type]}:</span>
      <span className="min-w-0">
        <span className="font-medium">{label}</span>
        {extras.length > 0 && <span className="text-muted"> · {extras.join(" · ")}</span>}
      </span>
    </>
  );

  return venue.url ? (
    <a href={venue.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
