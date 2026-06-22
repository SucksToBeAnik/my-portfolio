"use client";

export function SeeWorkLink() {
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById("content")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="text-xs font-heading px-3 py-1.5 rounded-full border border-hairline text-muted hover:text-fg hover:border-fg/30 transition-colors cursor-pointer"
    >
      See my work →
    </button>
  );
}
