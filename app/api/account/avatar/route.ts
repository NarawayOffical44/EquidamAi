import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  PROFILE_IMAGE_MAX_BYTES,
  sanitizeCloudinaryPublicId,
  uploadCloudinaryImage,
  validateImageFile,
} from "@/lib/cloudinary";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/team/access";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > PROFILE_IMAGE_MAX_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Profile photo is required" }, { status: 400 });
    }

    const validationError = validateImageFile(file, PROFILE_IMAGE_MAX_BYTES);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const uploaded = await uploadCloudinaryImage({
      buffer: Buffer.from(await file.arrayBuffer()),
      folder: "evaldam/profile-photos",
      publicId: `user-${sanitizeCloudinaryPublicId(user.id)}`,
      width: 400,
      height: 400,
      crop: "fill",
      gravity: "auto",
    });

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("users")
      .update({ avatar_url: uploaded.secureUrl })
      .eq("id", user.id)
      .select("avatar_url")
      .single();

    if (error) {
      logger.error("Failed to save profile photo", {
        userId: user.id,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: "Profile photo uploaded but could not be saved" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: data.avatar_url,
    });
  } catch (error) {
    logger.error("Profile photo upload failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Could not upload profile photo" }, { status: 500 });
  }
}
