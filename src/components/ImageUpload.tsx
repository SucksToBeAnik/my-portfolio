"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Link as LinkIcon } from "@phosphor-icons/react";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  accept?: string;
}

export function ImageUpload({ onUpload, accept = "image/*" }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);
      try {
        const url = await uploadToCloudinary(file);
        onUpload(url);
      } catch {
        // fallback
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
        setPreview(null);
      }
    },
    [onUpload]
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
      if (urlInput) onUpload(urlInput);
    },
    [urlInput, onUpload]
  );

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
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            dragOver
              ? "border-fg bg-fg/5"
              : "border-nav-border hover:border-nav-text"
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-24 rounded object-contain"
            />
          ) : (
            <Upload weight="thin" className="w-6 h-6 text-nav-text" />
          )}
          <p className="text-xs text-nav-text text-center">
            {uploading
              ? "Uploading..."
              : "Drop an image here or click to browse"}
          </p>
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
  );
}
