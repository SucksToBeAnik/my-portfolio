import Link from "next/link";
import { GithubActivityPreview } from "@/components/GithubActivityPreview";
import { LinkPreview } from "@/components/LinkPreview";

/** The built-in intro, used when no custom intro is set for the current mode. */
export function DefaultIntro() {
  return (
    <p className="text-base leading-relaxed text-fg/80">
      Hey, I am Anik from{" "}
      <LinkPreview
        url="https://www.google.com/maps/place/Dhaka,+Bangladesh"
        position="bottom"
        previewClassName="w-72"
        previewContent={
          <div className="px-3 py-3">
            <div className="flex items-center gap-3">
              <svg
                viewBox="0 0 100 128"
                className="h-[72px] w-14 shrink-0 text-[#006a4e]"
                aria-label="Map of Bangladesh"
                role="img"
              >
                <path
                  fill="currentColor"
                  d="M42 5l13 5 5 9 12 3 5 9-3 10 8 8-5 10 5 10-8 10 1 12-9 8-1 14-11 4-3 13-10-1-5-11-11-5-1-12-9-7 3-11-5-10 7-10-3-11 8-8-1-11 11-5 2-10z"
                />
                <circle cx="48" cy="57" r="13" fill="#f42a41" />
                <path d="M25 104l-4 7 5 7 3-10-4-4zm29 12l5 2-1 7-4-2v-5z" fill="currentColor" />
              </svg>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-fg">Bangladesh</p>
                <p className="text-xs leading-relaxed text-fg/55">
                  A river-laced South Asian country known for its Bengali culture, warmth, and
                  resilience.
                </p>
              </div>
            </div>
          </div>
        }
      >
        <Link
          href="https://www.google.com/maps/place/Dhaka,+Bangladesh"
          target="_blank"
          className="cursor-pointer font-semibold text-fg transition-opacity hover:opacity-70"
          aria-label="Open Dhaka, Bangladesh in Google Maps"
        >
          Bangladesh
        </Link>
      </LinkPreview>
      . I am a <GithubActivityPreview /> learning and building simple softwares. Welcome to my
      corner of the Internet!
    </p>
  );
}
