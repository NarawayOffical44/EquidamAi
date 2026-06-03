import { NextRequest, NextResponse } from "next/server";
import {
  readTrainingRecords,
  TrainingDriveConfigError,
  type JsonlRecord,
} from "@/lib/training/google-drive-jsonl";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

type ExportFormat = "json" | "csv";

function getAdminExportCode() {
  return process.env.TRAINING_ADMIN_EXPORT_CODE || process.env.TRAINING_ADMIN_CODE || "";
}

function isAuthorized(request: NextRequest) {
  const configuredCode = getAdminExportCode();
  const providedCode = request.headers.get("x-training-admin-code") || "";

  return Boolean(configuredCode && providedCode && providedCode === configuredCode);
}

function safeString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function nestedValue(record: JsonlRecord, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return "";
    return (current as Record<string, unknown>)[key];
  }, record);
}

function csvCell(value: unknown) {
  return `"${safeString(value).replace(/"/g, '""')}"`;
}

function toCsv(records: JsonlRecord[]) {
  const columns = [
    ["recordType", "recordType"],
    ["status", "status"],
    ["submissionId", "submissionId"],
    ["participantId", "participantId"],
    ["scenarioId", "scenarioId"],
    ["scenarioTitle", "scenarioTitle"],
    ["scenarioCategory", "scenarioCategory"],
    ["questionType", "questionType"],
    ["question", "question"],
    ["participantName", "participant.name"],
    ["participantEmail", "participant.email"],
    ["participantRole", "participant.role"],
    ["participantInstitution", "participant.institution"],
    ["participantCity", "participant.city"],
    ["participantExperience", "participant.experience"],
    ["questionSubmittedAt", "questionSubmittedAt"],
    ["expertName", "expert.name"],
    ["expertEmail", "expert.email"],
    ["thoughtProcess", "thoughtProcess"],
    ["reasonIndianContext", "reasonIndianContext"],
    ["answer", "answer"],
    ["answeredAt", "answeredAt"],
    ["answerId", "answerId"],
  ] as const;

  return [
    columns.map(([header]) => csvCell(header)).join(","),
    ...records.map((record) => columns.map(([, path]) => csvCell(nestedValue(record, path))).join(",")),
  ].join("\n");
}

function attachmentResponse(body: string, contentType: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    if (!getAdminExportCode()) {
      return NextResponse.json({ error: "Admin export code is not configured" }, { status: 503 });
    }

    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Invalid admin code" }, { status: 401 });
    }

    const requestedFormat = request.nextUrl.searchParams.get("format") || "json";
    const format: ExportFormat = requestedFormat === "csv" ? "csv" : "json";
    const records = await readTrainingRecords();
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      return attachmentResponse(
        toCsv(records),
        "text/csv; charset=utf-8",
        `evaldam-question-game-${stamp}.csv`
      );
    }

    return attachmentResponse(
      JSON.stringify(records, null, 2),
      "application/json; charset=utf-8",
      `evaldam-question-game-${stamp}.json`
    );
  } catch (error) {
    logger.error("Question Quest export failed", error);

    if (error instanceof TrainingDriveConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Could not export saved rounds" }, { status: 500 });
  }
}
