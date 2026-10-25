import { VenueMarker } from "@/components/publications/VenueMarker";
import { VENUE_TYPE_LABELS, type Venue, venueTitle } from "@/lib/publications";

// One line per venue: the marker shape says what kind, the name says which one.
// No border — the name carries the weight, everything after it stays muted.
export function VenueBadge({ venue }: { venue: Venue }) {
  const pending = venue.status === "under_review";
  const name = venueTitle(venue) || "Under review";
  const extras = [venue.track, venue.note].filter(Boolean);
  const tag =
    pending && venueTitle(venue) ? "under review" : venue.status === "accepted" ? "to appear" : "";

  return (
    <p className="flex min-w-0 items-baseline gap-2 text-[13px] leading-snug">
      <span className="flex h-[1lh] items-center text-fg">
        <VenueMarker type={venue.type} />
      </span>
      <span className="min-w-0">
        <span className="sr-only">{VENUE_TYPE_LABELS[venue.type]}:</span>
        {venue.url ? (
          <a
            href={venue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fg decoration-fg/30 underline-offset-[3px] hover:underline"
          >
            {name}
          </a>
        ) : (
          <span className="font-medium text-fg">{name}</span>
        )}
        {extras.length > 0 && <span className="text-xs text-muted"> · {extras.join(" · ")}</span>}
        {tag && (
          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            {tag}
          </span>
        )}
      </span>
    </p>
  );
}
