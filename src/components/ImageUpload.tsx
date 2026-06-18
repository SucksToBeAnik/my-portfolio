"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Link as LinkIcon, Image as ImageIcon, Video, Trash } from "@phosphor-icons/react";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/ogg"];

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onRemove?: () => void;
  currentUrl?: string;
  accept?: string;
  resourceType?: "image" | "video";
}

export function ImageUpload({
  onUpload,
  onRemove,
  currentUrl,
  accept = "image/*",
  resourceType = "image",
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    (file: File): string | null => {
      const allowed = resourceType === "video" ? ALLOWED_VIDEO : ALLOWED_IMAGE;
      if (!allowed.includes(file.type)) {
        return resourceType === "video"
          ? "Only MP4, WebM, and OGG videos are allowed."
          : "Only JPEG, PNG, GIF, WebP, and AVIF images are allowed.";
      }
      if (file.size > MAX_SIZE) {
        return "File exceeds 10MB limit.";
      }
      return null;
    },
    [resourceType]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);
      try {
        const url = await uploadToCloudinary(file, resourceType);
        onUpload(url);
        setError(null);
      } catch {
        setError("Upload failed. Try again.");
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
        setPreview(null);
      }
    },
    [onUpload, validate, resourceType]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (urlInput) {
        setError(null);
        onUpload(urlInput);
      }
    },
    [urlInput, onUpload]
  );

  const hasMedia = currentUrl || preview;

  return (
    <div className="space-y-2">
      {!showUrlInput ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !hasMedia && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl transition-colors overflow-hidden ${
            hasMedia ? "p-0" : "p-6 cursor-pointer"
          } ${
            dragOver
              ? "border-fg bg-fg/5"
              : "border-nav-border hover:border-nav-text"
          }`}
        >
          {uploading && preview ? (
            <div className="relative w-full">
              {resourceType === "video" ? (
                <video src={preview} className="w-full max-h-32 object-contain rounded-lg" />
              ) : (
                <img src={preview} alt="" className="w-full max-h-32 object-contain rounded-lg" />
              )}
              <div className="absolute inset-0 bg-bg/60 flex items-center justify-center rounded-lg">
                <p className="text-xs text-fg">Uploading...</p>
              </div>
            </div>
          ) : currentUrl ? (
            <div className="relative group w-full">
              {resourceType === "video" ? (
                <video src={currentUrl} className="w-full max-h-32 object-contain rounded-lg" />
              ) : (
                <img src={currentUrl} alt="" className="w-full max-h-32 object-contain rounded-lg" />
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
                      onRemove();
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
      ) : (
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="url"
            placeholder="Paste image URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-nav-hover-bg border border-nav-border rounded-lg text-fg placeholder-nav-text/50 focus:outline-none focus:border-nav-text transition-colors"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium bg-nav-active-bg text-nav-active-text rounded-lg hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {(hasMedia || !showUrlInput) && (
        <div className="flex items-center gap-3">
          {hasMedia && (
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                inputRef.current?.click();
              }}
              className="flex items-center gap-1.5 text-[11px] text-nav-text hover:text-nav-text-hover transition-colors"
            >
              <Upload weight="thin" className="w-3 h-3" />
              Upload from device
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(!showUrlInput);
              setUrlInput("");
            }}
            className="flex items-center gap-1.5 text-[11px] text-nav-text hover:text-nav-text-hover transition-colors"
          >
            <LinkIcon weight="thin" className="w-3 h-3" />
            {showUrlInput ? "Upload from device instead" : "Or paste a URL instead"}
          </button>
        </div>
      )}
    </div>
  );
}
