import { MoonStars } from "@phosphor-icons/react/dist/ssr";

/**
 * The homepage's chapter break: work above (research, papers, jobs, projects,
 * posts), the person below (photos, books, films, how to reach me).
 *
 * Built like a scene break in a book rather than a section header — hairlines
 * that fade in from the edges toward a single glyph, then a handwritten line.
 * The handwriting is the same voice as the footer's sign-off, so the break
 * reads as the page changing register, not as one more list starting.
 */
export function OffTheClock() {
  return (
    // Decorative: the sections after it announce themselves, so screen readers skip it.
    <div aria-hidden className="flex flex-col items-center gap-4 text-center">
      <div className="flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-fg/20" />
        {/* `light`, not `thin`: hairline strokes vanish on the light theme. */}
        <MoonStars weight="light" className="h-5 w-5 shrink-0 text-fg/45" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-fg/20" />
      </div>
      <p className="font-hand text-3xl leading-none text-fg/85">off the clock</p>
    </div>
  );
}
