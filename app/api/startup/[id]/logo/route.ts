import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeCloudinaryPublicId,
  STARTUP_IMAGE_MAX_BYTES,
  uploadCloudinaryImage,
  validateImageFile,
} from "@/lib/cloudinary";
import { getAuthenticatedUser, getStartupWorkspaceAccess, unauthorizedResponse } from "@/lib/team/access";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const adminClient = createAdminClient();
    const startupAccess = await getStartupWorkspaceAccess(adminClient, user.id, id);
    if (!startupAccess) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > STARTUP_IMAGE_MAX_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Startup photo is required" }, { status: 400 });
    }

    const validationError = validateImageFile(file, STARTUP_IMAGE_MAX_BYTES);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const uploaded = await uploadCloudinaryImage({
      buffer: Buffer.from(await file.arrayBuffer()),
      folder: "evaldam/startup-photos",
      publicId: `startup-${sanitizeCloudinaryPublicId(id)}`,
      width: 600,
      height: 600,
      crop: "pad",
      gravity: "auto",
      background: "white",
    });

    const { data, error } = await adminClient
      .from("startups")
      .update({ logo_url: uploaded.secureUrl })
      .eq("id", id)
      .select("logo_url")
      .single();

    if (error) {
      logger.error("Failed to save startup photo", {
        userId: user.id,
        startupId: id,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: "Startup photo uploaded but could not be saved" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logoUrl: data.logo_url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cloudinaryError = error as { name?: string; http_code?: number; statusCode?: number };

    logger.error("Startup photo upload failed", {
      message,
      name: cloudinaryError?.name,
      httpCode: cloudinaryError?.http_code || cloudinaryError?.statusCode,
    });

    if (message === "Cloudinary is not configured") {
      return NextResponse.json(
        { error: "Image uploads are not configured on this server. Restart the server after adding Cloudinary credentials." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Could not upload startup photo" }, { status: 500 });
  }
}
