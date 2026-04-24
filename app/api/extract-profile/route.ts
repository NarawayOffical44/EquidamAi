import { NextRequest, NextResponse } from "next/server";
import { extractProfileFromPitchDeck } from "@/lib/claude/extractProfile";
import * as pdf from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const websiteUrl = formData.get("websiteUrl") as string;

    if (!file && !websiteUrl) {
      return NextResponse.json({ error: "File or website URL required" }, { status: 400 });
    }

    let pdfText = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const parsed = await pdf.default(buffer);
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
