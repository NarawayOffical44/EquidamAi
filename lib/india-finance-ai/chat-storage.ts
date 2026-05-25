export const STARTUP_AI_CHAT_STORAGE_KEY = "evaldam_startup_ai_chat_v1";
export const STARTUP_AI_CHAT_HISTORY_STORAGE_KEY = "evaldam_startup_ai_chat_history_v1";
export const STARTUP_AI_ACTIVE_CHAT_ID_STORAGE_KEY = "evaldam_startup_ai_active_chat_id_v1";
export const STARTUP_AI_CONTEXT_CACHE_STORAGE_KEY = "evaldam_startup_ai_context_cache_v1";

export function clearStartupAiChatHistory() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STARTUP_AI_CHAT_STORAGE_KEY);
    localStorage.removeItem(STARTUP_AI_CHAT_HISTORY_STORAGE_KEY);
    localStorage.removeItem(STARTUP_AI_ACTIVE_CHAT_ID_STORAGE_KEY);
    localStorage.removeItem(STARTUP_AI_CONTEXT_CACHE_STORAGE_KEY);
  } catch {}
}
