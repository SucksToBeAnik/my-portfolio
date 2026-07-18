// A CSS-only 3D book: front cover + right page-block + spine, tilted in
// perspective and easing toward the viewer on hover. No client JS needed.
const W = 200;
const H = 300;
const DEPTH = 28;

export function BookCover3D({ coverUrl, title }: { coverUrl: string | null; title: string }) {
  return (
    <div className="relative [perspective:1600px]" style={{ width: W, height: H }}>
      {/* grounding shadow */}
      <div className="absolute -bottom-3 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/40 blur-2xl" />

      <div
        className="relative h-full w-full transition-transform duration-700 ease-out [transform:rotateX(6deg)_rotateY(-28deg)] [transform-style:preserve-3d] hover:[transform:rotateX(3deg)_rotateY(-12deg)]"
        style={{ width: W, height: H }}
      >
        {/* front cover */}
        <div
          className="absolute inset-0 overflow-hidden rounded-l-[3px] rounded-r-md shadow-2xl"
          style={{ transform: `translateZ(${DEPTH / 2}px)` }}
        >
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900 p-6 text-center font-heading text-sm text-white/80">
              {title}
            </div>
          )}
          {/* light sheen + inner spine shading */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/30 to-transparent" />
        </div>

        {/* back cover */}
        <div
          className="absolute inset-0 rounded-l-[3px] rounded-r-md bg-neutral-800"
          style={{ transform: `rotateY(180deg) translateZ(${DEPTH / 2}px)` }}
        />

        {/* page block (right edge) */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: DEPTH,
            height: H - 6,
            transform: `translate(-50%,-50%) rotateY(90deg) translateZ(${W / 2}px)`,
            background:
              "repeating-linear-gradient(90deg, #ded7c8 0, #f7f3ea 1.2px, #d7cfbd 2px, #f7f3ea 3px)",
            borderRadius: 1,
          }}
        />

        {/* spine (left edge) */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: DEPTH,
            height: H,
            transform: `translate(-50%,-50%) rotateY(-90deg) translateZ(${W / 2}px)`,
            background: "linear-gradient(90deg, rgba(0,0,0,0.65), rgba(0,0,0,0.3))",
          }}
        />
      </div>
    </div>
  );
}
