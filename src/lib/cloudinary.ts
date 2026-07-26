const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "jamiverse";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "portfolio";

export async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<string> {
  const cloudName = CLOUD_NAME;
  const uploadPreset = UPLOAD_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

export function cloudinaryDownloadUrl(url: string): string {
  return url.replace("/upload/", "/upload/fl_attachment/");
}

export function isCloudinary(url: string | null | undefined): boolean {
  return Boolean(url?.includes("res.cloudinary.com"));
}

/**
 * Copy a third-party image onto our own Cloudinary. Cloudinary fetches the
 * remote URL itself, so no bytes pass through us.
 *
 * Site logos, stack icons and book covers otherwise live on ~30 different
 * hosts — a DNS + TLS handshake each, at whatever size the origin happens to
 * serve (a 15 KB .ico for a 20px slot). Mirroring collapses them onto one
 * origin, immutable and transformable, and survives the source going away.
 *
 * Returns null when the lookup fails, so callers keep the original URL and the
 * next `refreshMetadata()` run retries it.
 */
export async function mirrorToCloudinary(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (isCloudinary(url)) return url;

  try {
    const formData = new FormData();
    formData.append("file", url);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.secure_url === "string" ? data.secure_url : null;
  } catch {
    return null;
  }
}

/**
 * Width-capped, auto-format delivery URL. `c_fit` never upscales, so a 16px
 * favicon stays 16px rather than being blown up. Non-Cloudinary URLs pass
 * through untouched — mirroring is best-effort, and the raw URL still works.
 */
export function cdnImage(url: string, width: number): string {
  if (!isCloudinary(url) || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fit,w_${width},f_auto,q_auto/`);
}
