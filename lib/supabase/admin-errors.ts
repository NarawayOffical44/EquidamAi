type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
};

export function getSupabaseErrorMessage(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) {
    return String((error as SupabaseErrorLike).message || "");
  }
  return String(error);
}

export function isSupabaseInvalidApiKeyError(error: unknown) {
  const message = getSupabaseErrorMessage(error).toLowerCase();
  return message.includes("invalid api key") || message.includes("jwt malformed");
}
