export function normalizeCloudinaryImageUrl(value?: string | null) {
  if (!value) return "";
  if (!value.includes("res.cloudinary.com") || !value.includes("/image/upload/")) {
    return value;
  }

  // Older startup photo URLs used c_pad with g_auto, which Cloudinary rejects.
  return value.replace(/([/,])c_pad(?=[,/])/g, "$1c_fill_pad");
}
