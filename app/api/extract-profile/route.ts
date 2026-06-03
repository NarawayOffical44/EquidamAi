import { NextRequest, NextResponse } from "next/server";
import { extractProfileFromPitchDeck } from "@/lib/claude/extractProfile";
import { createClient } from "@/lib/supabase/server";
import { requirePaidUser } from "@/lib/auth/paid-access";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set(["application/pdf", "text/plain", "application/octet-stream"]);

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const isFormRequest =
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded");

    if (!isFormRequest) {
      return NextResponse.json(
        { error: "Expected multipart/form-data with a file or websiteUrl" },
        { status: 400 }
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES + 512_000) {
      return NextResponse.json({ error: "Upload is too large. Use a file under 10 MB." }, { status: 413 });
    }

    const formData = await request.formData();
    const submittedFile = formData.get("file");
    const file = submittedFile instanceof File && submittedFile.size > 0 ? submittedFile : null;
    const websiteUrl = String(formData.get("websiteUrl") || "").trim();

    if (!file && !websiteUrl) {
      return NextResponse.json({ error: "File or website URL required" }, { status: 400 });
    }

    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;

    let pdfText = "";

    if (file) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Upload is too large. Use a file under 10 MB." }, { status: 413 });
      }

      if (!isAllowedProfileFile(file)) {
        return NextResponse.json({ error: "Upload a PDF or text file." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const parsed = await pdf(buffer);
        pdfText = parsed.text || "";
      } catch {
        // Fallback: try raw text (for non-binary uploads)
        pdfText = buffer.toString("utf-8").slice(0, 8000);
      }
    }

    const extractedData = await extractProfileFromPitchDeck(pdfText, websiteUrl);

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error) {
    console.error("Profile extraction error:", error);
    return NextResponse.json({ error: "Failed to extract profile", details: String(error) }, { status: 500 });
  }
}

function isAllowedProfileFile(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return ALLOWED_FILE_TYPES.has(type) || name.endsWith(".pdf") || name.endsWith(".txt");
}
