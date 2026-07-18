"use client";

/**
 * Click-to-play YouTube embed: shows the thumbnail until clicked, then swaps in
 * the real iframe. Keeps the page light (no YouTube JS until the user opts in).
 */
export function LiteYouTube({
  id,
  title,
  dataWidth,
}: {
  id: string;
  title: string;
  dataWidth?: string;
}) {
  return (
    <div
      data-width={dataWidth}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black cursor-pointer group"
      onClick={(e) => {
        const target = e.currentTarget;
        const iframe = document.createElement("iframe");
        iframe.className = "absolute inset-0 w-full h-full";
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        target.innerHTML = "";
        target.appendChild(iframe);
      }}
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-fg/90 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-bg ml-0.5" fill="currentColor">
            <title>Play</title>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
