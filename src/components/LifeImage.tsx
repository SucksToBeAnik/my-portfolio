import { ClickableImage } from "@/components/ClickableImage";

export function LifeImage({
  src,
  alt,
  className = "w-28 h-28",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <ClickableImage
      src={src}
      alt={alt}
      className={`${className} shrink-0 overflow-hidden cursor-pointer grayscale-[0.15] hover:grayscale-0 hover:opacity-90 transition-all duration-300`}
    />
  );
}
