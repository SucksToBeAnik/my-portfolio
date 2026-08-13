"use client";

import { FilePdf } from "@phosphor-icons/react";
import { LinkPreview } from "@/components/LinkPreview";

export function CvLink({ url, title }: { url: string; title: string }) {
  const previewUrl = `${url.split("#")[0]}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;

  return (
    <LinkPreview
      url={url}
      position="bottom"
      persistPreview
      previewClassName="w-64"
      previewContent={
        <div>
          <div className="mx-3 mt-3 h-36 overflow-hidden rounded-[16px] bg-white">
            <iframe
              src={previewUrl}
              title={`Preview of ${title}`}
              loading="lazy"
              scrolling="no"
              className="h-96 w-[calc(100%+18px)] max-w-none border-0 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5">
            <FilePdf weight="light" className="h-4 w-4 shrink-0 text-fg/45" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{title}</p>
              <p className="text-[10px] uppercase tracking-wider text-fg/40">PDF document</p>
            </div>
          </div>
        </div>
      }
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-5 h-5 text-[9px] font-heading font-bold border-[1.5px] border-current rounded hover:text-fg transition-colors"
        aria-label={`View ${title}`}
      >
        CV
      </a>
    </LinkPreview>
  );
}
