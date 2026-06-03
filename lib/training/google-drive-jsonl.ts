import { createPrivateKey, sign } from "crypto";
import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";

export type JsonlRecord = Record<string, unknown>;

const DEFAULT_TRAINING_DRIVE_JSONL_FILE_ID = "16fT6_XCN5fBph5M8xMrQfOx8pPxwCNl_";

export class TrainingDriveConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrainingDriveConfigError";
  }
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getServiceAccountConfig() {
  const clientEmail =
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = (
    process.env.GOOGLE_DRIVE_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
  )?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new TrainingDriveConfigError("Google Drive service account env vars are missing");
  }

  return { clientEmail, privateKey };
}

export function getTrainingDriveJsonlFileId() {
  const rawFileId =
    process.env.TRAINING_DRIVE_JSONL_FILE_ID ||
    process.env.TRAINING_DRIVE_JSONL_FILE_URL ||
    DEFAULT_TRAINING_DRIVE_JSONL_FILE_ID;

  return extractDriveFileId(rawFileId);
}

export function extractDriveFileId(value: string) {
  const trimmed = value.trim();
  const directFileMatch = trimmed.match(/\/d\/([^/?#]+)/);
  const queryIdMatch = trimmed.match(/[?&]id=([^&#]+)/);

  return decodeURIComponent(directFileMatch?.[1] || queryIdMatch?.[1] || trimmed);
}

export async function getGoogleDriveAccessToken() {
  const { clientEmail, privateKey } = getServiceAccountConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsignedJwt), createPrivateKey(privateKey));
  const assertion = `${unsignedJwt}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token request failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json() as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Google token response did not include access_token");
  }

  return tokenData.access_token;
}

export async function readDriveJsonlRecords(accessToken: string, fileId: string) {
  const content = await readDriveTextFile(accessToken, fileId);
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  return lines.map((line, index) => {
    try {
      return JSON.parse(line) as JsonlRecord;
    } catch {
      throw new Error(`Invalid JSONL at line ${index + 1}`);
    }
  });
}

export async function appendDriveJsonlRecords(
  accessToken: string,
  fileId: string,
  records: JsonlRecord[]
) {
  if (!records.length) return;

  const currentContent = await readDriveTextFile(accessToken, fileId);
  const normalizedCurrent = currentContent.trimEnd();
  const appendedContent = records.map((record) => JSON.stringify(record)).join("\n");
  const nextContent = normalizedCurrent
    ? `${normalizedCurrent}\n${appendedContent}\n`
    : `${appendedContent}\n`;

  await updateDriveTextFile(accessToken, fileId, nextContent);
}

export async function writeDriveJsonlRecords(
  accessToken: string,
  fileId: string,
  records: JsonlRecord[]
) {
  const nextContent = records.length
    ? `${records.map((record) => JSON.stringify(record)).join("\n")}\n`
    : "";

  await updateDriveTextFile(accessToken, fileId, nextContent);
}

async function readDriveTextFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    throw new TrainingDriveConfigError("Google Drive JSONL file was not found or is not shared with the service account");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive file read failed: ${response.status} ${errorText}`);
  }

  return response.text();
}

async function updateDriveTextFile(accessToken: string, fileId: string, content: string) {
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-ndjson; charset=utf-8",
    },
    body: content,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive file update failed: ${response.status} ${errorText}`);
  }
}

// --- Local JSONL fallback support (for dev / when Drive not configured) ---

export function allowLocalTrainingStorage() {
  return process.env.NODE_ENV !== "production";
}

export function getLocalTrainingJsonlPath() {
  return join(/*turbopackIgnore: true*/ process.cwd(), "data", "training-question-game.local.jsonl");
}

async function ensureLocalDir() {
  const localPath = getLocalTrainingJsonlPath();
  await mkdir(dirname(localPath), { recursive: true });
  return localPath;
}

async function readLocalJsonlRecords(): Promise<JsonlRecord[]> {
  const localPath = await ensureLocalDir();
  try {
    const content = await readFile(localPath, "utf8");
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return lines.map((line, index) => {
      try {
        return JSON.parse(line) as JsonlRecord;
      } catch {
        throw new Error(`Invalid JSONL at line ${index + 1} in local file`);
      }
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "ENOENT") return [];
    throw err;
  }
}

async function appendLocalJsonlRecords(records: JsonlRecord[]): Promise<void> {
  if (!records.length) return;
  const localPath = await ensureLocalDir();
  const appended = records.map((record) => JSON.stringify(record)).join("\n") + "\n";
  await appendFile(localPath, appended, "utf8");
}

async function writeLocalJsonlRecords(records: JsonlRecord[]): Promise<void> {
  const localPath = await ensureLocalDir();
  const nextContent = records.length
    ? `${records.map((record) => JSON.stringify(record)).join("\n")}\n`
    : "";
  await writeFile(localPath, nextContent, "utf8");
}

export function hasGoogleDriveServiceAccountConfig() {
  const clientEmail =
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey =
    process.env.GOOGLE_DRIVE_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  return Boolean(clientEmail && privateKey);
}

export async function readTrainingRecords(): Promise<JsonlRecord[]> {
  if (hasGoogleDriveServiceAccountConfig()) {
    const fileId = getTrainingDriveJsonlFileId();
    const accessToken = await getGoogleDriveAccessToken();
    return readDriveJsonlRecords(accessToken, fileId);
  }

  if (!allowLocalTrainingStorage()) {
    throw new TrainingDriveConfigError("Google Drive service account env vars are missing and local fallback is disabled");
  }

  return readLocalJsonlRecords();
}

export async function appendTrainingRecords(records: JsonlRecord[]): Promise<"google_drive_jsonl" | "local_jsonl"> {
  if (!records.length) return hasGoogleDriveServiceAccountConfig() ? "google_drive_jsonl" : "local_jsonl";

  if (hasGoogleDriveServiceAccountConfig()) {
    const fileId = getTrainingDriveJsonlFileId();
    const accessToken = await getGoogleDriveAccessToken();
    await appendDriveJsonlRecords(accessToken, fileId, records);
    return "google_drive_jsonl";
  }

  if (!allowLocalTrainingStorage()) {
    throw new TrainingDriveConfigError("Google Drive service account env vars are missing and local fallback is disabled");
  }

  await appendLocalJsonlRecords(records);
  return "local_jsonl";
}

export async function writeTrainingRecords(records: JsonlRecord[]): Promise<"google_drive_jsonl" | "local_jsonl"> {
  if (hasGoogleDriveServiceAccountConfig()) {
    const fileId = getTrainingDriveJsonlFileId();
    const accessToken = await getGoogleDriveAccessToken();
    await writeDriveJsonlRecords(accessToken, fileId, records);
    return "google_drive_jsonl";
  }

  if (!allowLocalTrainingStorage()) {
    throw new TrainingDriveConfigError("Google Drive service account env vars are missing and local fallback is disabled");
  }

  await writeLocalJsonlRecords(records);
  return "local_jsonl";
}
