// A CSS-only 3D Blu-ray/DVD case: poster front + glossy plastic spine + a thin
// case seam on the opening edge, tilted in perspective and easing toward the
// viewer on hover. The physical analog to BookCover3D, but thinner and glossier.
const W = 200;
const H = 300;
const DEPTH = 14;

export function MediaCase3D({ posterUrl, title }: { posterUrl: string | null; title: string }) {
  return (
    <div className="relative [perspective:1600px]" style={{ width: W, height: H }}>
      {/* grounding shadow */}
      <div className="absolute -bottom-3 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/40 blur-2xl" />

      <div
        className="relative h-full w-full transition-transform duration-700 ease-out [transform:rotateX(6deg)_rotateY(-28deg)] [transform-style:preserve-3d] hover:[transform:rotateX(3deg)_rotateY(-12deg)]"
        style={{ width: W, height: H }}
      >
        {/* front — poster under a glossy plastic overwrap */}
        <div
          className="absolute inset-0 overflow-hidden rounded-l-[2px] rounded-r-md shadow-2xl"
          style={{ transform: `translateZ(${DEPTH / 2}px)` }}
        >
          {posterUrl ? (
            <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900 p-6 text-center font-heading text-sm text-white/80">
              {title}
            </div>
          )}
          {/* hinge line near the spine + soft corner shading */}
          <div className="pointer-events-none absolute inset-y-0 left-2.5 w-px bg-white/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />
        </div>

        {/* back cover */}
        <div
          className="absolute inset-0 rounded-l-[2px] rounded-r-md bg-neutral-900"
          style={{ transform: `rotateY(180deg) translateZ(${DEPTH / 2}px)` }}
        />

        {/* opening edge (right) — thin glossy plastic seam */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: DEPTH,
            height: H - 4,
            transform: `translate(-50%,-50%) rotateY(90deg) translateZ(${W / 2}px)`,
            background:
              "linear-gradient(90deg, #2a2a2a 0, #4a4a4a 45%, #d8d8d8 50%, #4a4a4a 55%, #1a1a1a 100%)",
            borderRadius: 1,
          }}
        />

        {/* spine (left) — glossy black case spine with a specular highlight */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: DEPTH,
            height: H,
            transform: `translate(-50%,-50%) rotateY(-90deg) translateZ(${W / 2}px)`,
            background:
              "linear-gradient(90deg, #050505 0, #1c1c1c 30%, #3d3d3d 50%, #141414 70%, #000 100%)",
          }}
        />
      </div>
    </div>
  );
}
