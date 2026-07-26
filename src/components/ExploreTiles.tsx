import Link from "next/link";
import { ExploreStack, type ExploreStackVariant } from "@/components/ExploreStack";
import { TileSketch } from "@/components/TileSketch";
import type { ExploreSection, ExploreSectionKey } from "@/lib/explore";

/**
 * The homepage's way into Life, Books and Watch — the three sections that no
 * longer have a nav entry. Three cells divided by hairlines, each a stacked
 * illustration that fans open on hover, its label, and how much is in there.
 */

const TILES: {
  key: ExploreSectionKey;
  href: string;
  label: string;
  /** Singular/plural noun for the count line. */
  noun: [string, string];
  variant: ExploreStackVariant;
}[] = [
  // Labels are all present participles — "Reading", "Watching" — so Life becomes
  // "Living" to keep the three reading as one set of ongoing things.
  {
    key: "life",
    href: "/life",
    label: "Living",
    noun: ["milestone", "milestones"],
    variant: "prints",
  },
  { key: "books", href: "/books", label: "Reading", noun: ["book", "books"], variant: "covers" },
  {
    key: "media",
    href: "/media",
    label: "Watching",
    noun: ["title", "titles"],
    variant: "posters",
  },
];

export function ExploreTiles({
  sections,
}: {
  sections: Record<ExploreSectionKey, ExploreSection>;
}) {
  return (
    <section>
      {/* `divide-x` puts hairlines between the cells only, so the row reads as
          one ruled band rather than three boxes. */}
      <div className="grid grid-cols-3 divide-x divide-hairline border-y border-hairline">
        {TILES.map((tile) => {
          const { total, images } = sections[tile.key];
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="group/tile relative flex flex-col items-center gap-3 px-2 py-7 transition-colors hover:bg-hover-bg/40 sm:px-4 sm:py-8"
            >
              {/* Sits behind everything; the label needs `relative` of its own
                  to out-paint an absolutely positioned sibling. */}
              <TileSketch seed={tile.key} />
              <ExploreStack variant={tile.variant} images={images} />
              <div className="relative space-y-1 text-center">
                <p className="font-heading text-sm text-fg">{tile.label}</p>
                <p className="text-xs text-muted">
                  {total} {total === 1 ? tile.noun[0] : tile.noun[1]}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
