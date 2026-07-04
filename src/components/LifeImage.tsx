import { ClickableImage } from "@/components/ClickableImage";

export function LifeImage({ src, alt }: { src: string; alt: string }) {
  return (
    <ClickableImage
      src={src}
      alt={alt}
      className="w-20 h-20 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
    />
  );
}
