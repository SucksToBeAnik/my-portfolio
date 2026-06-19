"use client";

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function LiteYouTube({ id, title }: { id: string; title: string }) {
  return (
    <div
      className="relative aspect-video overflow-hidden rounded-lg bg-black cursor-pointer group max-h-[400px]"
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
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const ytId = getYouTubeId(url);

  if (ytId) {
    return <LiteYouTube id={ytId} title={title} />;
  }

  return (
    <video src={url} controls className="w-full max-h-[400px] rounded-lg object-contain bg-black">
      <a href={url} className="text-xs underline">
        Watch video
      </a>
    </video>
  );
}
