export async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "video" = "image"
): Promise<string> {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "jamiverse"
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "portfolio"

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message || "Upload failed")
  }

  const data = await res.json()
  return data.secure_url
}
