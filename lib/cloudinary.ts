import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

type ImageCrop = "fill" | "fit" | "pad" | "limit";

type UploadImageOptions = {
  buffer: Buffer;
  folder: string;
  publicId: string;
  width: number;
  height?: number;
  crop?: ImageCrop;
  gravity?: string;
  background?: string;
};

export const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const STARTUP_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

let configured = false;

function ensureCloudinaryConfigured() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

export function sanitizeCloudinaryPublicId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 120);
}

export function validateImageFile(file: File, maxBytes: number) {
  if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) {
    return "Upload a JPG, PNG, WEBP, or AVIF image.";
  }

  if (file.size > maxBytes) {
    return `Image must be ${Math.floor(maxBytes / 1024 / 1024)}MB or smaller.`;
  }

  return null;
}

export async function uploadCloudinaryImage({
  buffer,
  folder,
  publicId,
  width,
  height,
  crop = "fill",
  gravity = "auto",
  background,
}: UploadImageOptions) {
  ensureCloudinaryConfigured();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
        unique_filename: false,
        use_filename: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve(uploadResult);
      }
    );

    upload.end(buffer);
  });

  const secureUrl = cloudinary.url(result.public_id, {
    secure: true,
    fetch_format: "auto",
    quality: "auto",
    width,
    height,
    crop,
    gravity,
    background,
  });

  return {
    publicId: result.public_id,
    secureUrl,
  };
}
