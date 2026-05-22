import crypto from "crypto";

const API_KEY_PREFIX = "evd";

export function createApiKeySecret() {
  return `${API_KEY_PREFIX}_${crypto.randomBytes(32).toString("base64url")}`;
}

export function hashApiKey(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function getApiKeyPrefix(secret: string) {
  const [prefix, body] = secret.split("_");
  return `${prefix || API_KEY_PREFIX}_${(body || "").slice(0, 8)}`;
}

export function maskApiKey(prefix: string) {
  return `${prefix}...****`;
}
