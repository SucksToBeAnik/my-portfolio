"use client";

import { File as FileIcon, Image as ImageIcon, Trash, Video } from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/ogg"];
const ALLOWED_RAW = ["application/pdf"];

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  onFilePending?: (file: File | null) => void;
  accept?: string;
  resourceType?: "image" | "video" | "raw";
}

type Tab = "upload" | "url";

export function ImageUpload({
  value = "",
  onChange,
  onRemove,
  onFilePending,
  accept = "image/*",
  resourceType = "image",
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upload");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    (file: File): string | null => {
      const allowed =
        resourceType === "video" ? ALLOWED_VIDEO : resourceType === "raw" ? ALLOWED_RAW : ALLOWED_IMAGE;
      if (!allowed.includes(file.type)) {
        return resourceType === "video"
          ? "Only MP4, WebM, and OGG videos are allowed."
          : resourceType === "raw"
            ? "Only PDF files are allowed."
            : "Only JPEG, PNG, GIF, WebP, and AVIF images are allowed.";
      }
      return null;
    },
    [resourceType],
  );

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setPendingFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onFilePending?.(file);
    },
    [validate, onFilePending],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPendingFile(null);
    setPreview(null);
    onFilePending?.(null);
    onRemove?.();
  }, [preview, onFilePending, onRemove]);

  const handleUrlCommit = useCallback(() => {
    if (!urlInput.trim() || !onChange) return;
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPendingFile(null);
    setPreview(null);
    onFilePending?.(null);
    onChange(urlInput.trim());
    setUrlInput("");
  }, [urlInput, onChange, preview, onFilePending]);

  const hasPending = pendingFile && preview;
  const hasMedia = value && !hasPending;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setTab("upload");
            setError(null);
          }}
          className={`text-xs transition-colors cursor-pointer pb-0.5 border-b ${
            tab === "upload"
              ? "text-fg font-medium border-fg"
              : "text-fg/40 hover:text-fg/60 border-transparent"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("url");
            setError(null);
            setUrlInput(value);
          }}
          className={`text-xs transition-colors cursor-pointer pb-0.5 border-b ${
            tab === "url"
              ? "text-fg font-medium border-fg"
              : "text-fg/40 hover:text-fg/60 border-transparent"
          }`}
        >
          URL
        </button>
      </div>

      {tab === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!hasMedia && !hasPending) inputRef.current?.click();
          }}
          className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl transition-colors overflow-hidden cursor-pointer ${
            hasMedia || hasPending ? "p-0" : "p-6"
          } ${dragOver ? "border-fg bg-fg/5" : "border-nav-border hover:border-nav-text"}`}
        >
          {hasPending ? (
            <div className="relative w-full">
              {resourceType === "video" ? (
                <video src={preview} className="w-full max-h-32 object-contain rounded-lg" />
              ) : resourceType === "raw" ? (
                <div className="flex items-center gap-2 p-4">
                  <FileIcon weight="thin" className="w-6 h-6 text-nav-text shrink-0" />
                  <span className="text-xs text-fg truncate">{pendingFile?.name}</span>
                </div>
              ) : (
                <img src={preview} alt="" className="w-full max-h-32 object-contain rounded-lg" />
              )}
              <div className="absolute inset-0 bg-bg/60 flex items-center justify-center rounded-lg">
                <p className="text-xs text-fg">Pending — save to upload</p>
              </div>
            </div>
          ) : hasMedia ? (
            <div className="relative group w-full">
              {resourceType === "video" ? (
                <video src={value} className="w-full max-h-32 object-contain rounded-lg" />
              ) : resourceType === "raw" ? (
                <div className="flex items-center gap-2 p-4">
                  <FileIcon weight="thin" className="w-6 h-6 text-nav-text shrink-0" />
                  <span className="text-xs text-fg truncate">{value.split("/").pop()}</span>
                </div>
              ) : (
                <img src={value} alt="" className="w-full max-h-32 object-contain rounded-lg" />
              )}
              <div className="absolute inset-0 bg-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 transition-all"
                >
                  Replace
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-all"
                  >
                    <Trash weight="thin" className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {resourceType === "video" ? (
                <Video weight="thin" className="w-6 h-6 text-nav-text" />
              ) : resourceType === "raw" ? (
                <FileIcon weight="thin" className="w-6 h-6 text-nav-text" />
              ) : (
                <ImageIcon weight="thin" className="w-6 h-6 text-nav-text" />
              )}
              <p className="text-xs text-nav-text text-center">
                Drop a file here or click to browse
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : hasMedia ? (
        <div className="flex items-center justify-between px-3 py-2 bg-hover-bg rounded-lg">
          <span className="text-[11px] text-fg/60 truncate flex-1 mr-2 break-all">{value}</span>
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors shrink-0 ml-2"
            >
              <Trash weight="thin" className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>
      ) : (
        <div className="flex">
          <input
            type="text"
            placeholder={resourceType === "video" ? "Paste video URL" : "Paste image URL"}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlCommit();
              }
            }}
            onBlur={handleUrlCommit}
            className="flex-1 px-3 py-1.5 text-xs bg-nav-hover-bg border border-nav-border rounded-lg text-fg placeholder-nav-text/50 focus:outline-none focus:border-nav-text transition-colors"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
