export function CvLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-5 h-5 text-[9px] font-heading font-bold border border-current rounded hover:text-fg transition-colors"
      aria-label="View CV"
    >
      CV
    </a>
  );
}
