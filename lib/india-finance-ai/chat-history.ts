import type { SupabaseClient } from "@supabase/supabase-js";

export type StartupAiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StartupAiStoredChat = {
  id: string;
  title: string;
  messages: StartupAiChatMessage[];
  updatedAt: number;
};

type ChatThreadRow = {
  id: string;
  title: string | null;
  messages: unknown;
  updated_at: string | null;
};

const MAX_THREADS = 20;
const MAX_MESSAGES_PER_THREAD = 40;

export function isPaidStartupAiPlan(plan: string) {
  return plan !== "anonymous" && plan !== "free";
}

export function createStartupAiChatTitle(messages: StartupAiChatMessage[]) {
  return (
    messages
      .find((message) => message.role === "user")
      ?.content.trim()
      .replace(/\s+/g, " ")
      .slice(0, 72) || "New chat"
  );
}

function isUuid(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function timestamp(value?: string | null) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeMessages(value: unknown): StartupAiChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((message): message is StartupAiChatMessage => {
      if (!message || typeof message !== "object") return false;
      const record = message as Record<string, unknown>;
      return (
        (record.role === "user" || record.role === "assistant") &&
        typeof record.content === "string" &&
        record.content.trim().length > 0
      );
    })
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
    .slice(-MAX_MESSAGES_PER_THREAD);
}

function normalizeChatRow(row: ChatThreadRow): StartupAiStoredChat {
  const messages = normalizeMessages(row.messages);

  return {
    id: row.id,
    title: row.title?.trim() || createStartupAiChatTitle(messages),
    messages,
    updatedAt: timestamp(row.updated_at),
  };
}

export async function listStartupAiChats(supabase: SupabaseClient, userId: string): Promise<StartupAiStoredChat[]> {
  const { data, error } = await supabase
    .from("startup_ai_chat_threads")
    .select("id, title, messages, updated_at")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(MAX_THREADS);

  if (error) throw error;

  return ((data || []) as ChatThreadRow[]).map(normalizeChatRow);
}

export async function saveStartupAiExchange(params: {
  supabase: SupabaseClient;
  userId: string;
  threadId?: string | null;
  userMessage: string;
  assistantMessage: string;
}): Promise<StartupAiStoredChat> {
  const title = createStartupAiChatTitle([{ role: "user", content: params.userMessage }]);
  const { data, error } = await params.supabase.rpc("append_startup_ai_chat_exchange", {
    p_thread_id: isUuid(params.threadId) ? params.threadId : null,
    p_user_id: params.userId,
    p_user_message: params.userMessage,
    p_assistant_message: params.assistantMessage,
    p_title: title,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Startup AI chat history was not saved");

  return normalizeChatRow(row as ChatThreadRow);
}
