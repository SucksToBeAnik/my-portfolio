/**
 * The illustration inside an explore tile: two or three covers stacked into a
 * small pile that fans open when the tile is hovered. CSS only — the parent tile
 * carries `group/tile`, and every layer reads its rest and hover transform from
 * that one hover state, so nothing here needs client JS.
 *
 * Layers are ordered back-to-front. Each holds a `rot`/`x`/`y` pair for rest and
 * for the opened state; opening means straightening toward 0deg while sliding
 * outward, which is what makes the pile read as a hand of cards being spread.
 */

import { EXPLORE_STACK_SIZE } from "@/lib/explore";

type Layer = {
  rot: number;
  x: number;
  y: number;
  openRot: number;
  openX: number;
  openY: number;
};

/** Photo prints — square-ish, wide tilt, the loosest pile of the three. */
const PRINTS: Layer[] = [
  { rot: -14, x: -12, y: 3, openRot: -22, openX: -26, openY: 0 },
  { rot: 7, x: 8, y: -2, openRot: 16, openX: 22, openY: -3 },
  { rot: -2, x: 0, y: 1, openRot: 0, openX: 0, openY: -6 },
];

/** Book covers — near-upright, fanning sideways like a shelf being pulled out. */
const COVERS: Layer[] = [
  { rot: -8, x: -10, y: 2, openRot: -15, openX: -24, openY: 1 },
  { rot: 5, x: 9, y: 1, openRot: 11, openX: 21, openY: 0 },
  { rot: -1, x: -1, y: 0, openRot: 0, openX: -1, openY: -7 },
];

/** Posters — a tight deck; opening staggers it into a diagonal cascade. */
const POSTERS: Layer[] = [
  { rot: -10, x: -8, y: 4, openRot: -14, openX: -22, openY: 4 },
  { rot: 6, x: 7, y: 2, openRot: 10, openX: 20, openY: 2 },
  { rot: 0, x: 0, y: 0, openRot: 0, openX: 0, openY: -7 },
];

const VARIANTS = {
  prints: { layers: PRINTS, aspect: "1 / 1", width: 62, rounded: "rounded-[3px]" },
  covers: { layers: COVERS, aspect: "2 / 3", width: 48, rounded: "rounded-[2px]" },
  posters: { layers: POSTERS, aspect: "2 / 3", width: 46, rounded: "rounded-[3px]" },
} as const;

export type ExploreStackVariant = keyof typeof VARIANTS;

export function ExploreStack({
  variant,
  images,
}: {
  variant: ExploreStackVariant;
  images: string[];
}) {
  const { layers, aspect, width, rounded } = VARIANTS[variant];

  // Fewer images than slots: drop the back layers first so whatever is left
  // still sits centred and on top, rather than off to one side.
  const shown = images.slice(0, EXPLORE_STACK_SIZE);
  const slots = layers.slice(layers.length - Math.max(shown.length, 1));

  return (
    // Tall enough that the tallest tilted layer plus its hover lift stays clear
    // of the label below — the stack isn't clipped, so this is just headroom.
    <div className="relative flex h-[92px] w-full items-center justify-center">
      {slots.map((layer, i) => {
        const src = shown[i];
        const front = i === slots.length - 1;
        return (
          <div
            key={src ?? i}
            className={`absolute ${rounded} overflow-hidden bg-hover-bg ring-1 ring-hairline transition-transform duration-500 ease-out [transform:translate(var(--x),var(--y))_rotate(var(--rot))] group-hover/tile:[transform:translate(var(--ox),var(--oy))_rotate(var(--orot))] ${
              front ? "shadow-lg shadow-black/40" : "shadow-md shadow-black/25"
            }`}
            style={
              {
                width,
                aspectRatio: aspect,
                zIndex: i + 1,
                "--x": `${layer.x}px`,
                "--y": `${layer.y}px`,
                "--rot": `${layer.rot}deg`,
                "--ox": `${layer.openX}px`,
                "--oy": `${layer.openY}px`,
                "--orot": `${layer.openRot}deg`,
              } as React.CSSProperties
            }
          >
            {src ? (
              <img
                src={src}
                alt=""
                loading="lazy"
                // Back layers sit dimmer so the pile reads as having depth.
                className={`h-full w-full object-cover ${front ? "" : "brightness-[0.72]"}`}
              />
            ) : (
              // Nothing to show yet — a blank ruled card keeps the tile from
              // collapsing to text.
              <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent_0_9px,var(--hairline)_9px_10px)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
