/**
 * The faint pencil marks behind an explore tile — a handful of lines ruled edge
 * to edge, crossing each other at angles.
 *
 * The placement looks random but isn't: every tile seeds a small PRNG from its
 * key, so a tile draws the same lines on the server and on the client, and on
 * every reload — but no two tiles draw the same set. Strokes are `currentColor`,
 * so the sketch inverts with the theme for free, and a turbulence displacement
 * gives the otherwise-perfect beziers the wobble of a hand holding a pencil.
 */

type Stroke = { d: string; w: number; o: number };

/** FNV-1a — turns a tile key into the PRNG seed. */
function hashSeed(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — tiny deterministic PRNG, plenty for scattering marks. */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Path data is written into markup, so trim it to one decimal. */
const f = (n: number) => Math.round(n * 10) / 10;

/** How many strokes land on a tile. Enough to read as a sketch, few enough to stay quiet. */
const LINE_COUNT = 7;

/**
 * Builds one tile's strokes in a 0–100 square: straight lines of varying length
 * dropped at random angles and positions. Each is bowed a hair off-straight
 * before the filter touches it — a truly straight line still reads as
 * machine-drawn no matter how much noise you displace it with.
 */
function buildSketch(key: string): Stroke[] {
  const rnd = mulberry32(hashSeed(key));
  const r = (a: number, b: number) => a + rnd() * (b - a);

  return Array.from({ length: LINE_COUNT }, () => {
    const angle = r(0, Math.PI);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    // Centres range past the edges so some strokes are caught half off the
    // tile, the way a scribble doesn't stop politely at the margin.
    const cx = r(-10, 110);
    const cy = r(-10, 110);
    const half = r(12, 40);

    const x1 = cx - ux * half;
    const y1 = cy - uy * half;
    const x2 = cx + ux * half;
    const y2 = cy + uy * half;
    const bow = r(-2.5, 2.5);
    // Control point pushed along the normal, so the bow is perpendicular to the
    // stroke whatever its angle.
    const bx = cx + -uy * bow;
    const by = cy + ux * bow;

    return {
      d: `M${f(x1)} ${f(y1)}Q${f(bx)} ${f(by)} ${f(x2)} ${f(y2)}`,
      w: r(0.5, 1),
      o: r(0.3, 0.8),
    };
  });
}

export function TileSketch({ seed }: { seed: string }) {
  const strokes = buildSketch(seed);
  const filterId = `tile-sketch-${seed}`;

  return (
    // `slice` crops rather than squashes, so the marks keep their proportions
    // whatever shape the tile ends up. The radial mask thins the sketch out
    // under the middle of the tile, where the stack and the label sit.
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full text-fg opacity-[0.13] transition-opacity duration-500 [mask-image:radial-gradient(ellipse_at_center,transparent_25%,black_80%)] group-hover/tile:opacity-[0.22]"
    >
      <title>Pencil sketch</title>
      <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.07"
          numOctaves="2"
          seed={hashSeed(seed) % 1000}
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="1.6"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <g filter={`url(#${filterId})`} fill="none" stroke="currentColor" strokeLinecap="round">
        {strokes.map((s) => (
          <path key={s.d} d={s.d} strokeWidth={f(s.w)} strokeOpacity={f(s.o * 100) / 100} />
        ))}
      </g>
    </svg>
  );
}
