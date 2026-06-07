import { callLLM } from "@/lib/claude/providers";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type IndiaFinanceAiRequest = {
  message: string;
  history?: ChatMessage[];
  maxTokens?: number;
};

export type IndiaFinanceAiAnswer = {
  answer: string;
  rawStatus?: string;
};

const DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_MAX_TOKENS = 900;
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v4-flash:free";
const DEFAULT_OPENROUTER_FALLBACK_MODELS = [
  "openai/gpt-oss-20b:free",
  "google/gemma-4-26b-a4b-it:free",
];
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

const systemMessage: ChatMessage = {
  role: "system",
  content:
    "You are Evaldam Startup AI, an Indian startup assistant for founders. Answer Indian startup questions, especially fundraising, valuation, dilution, ESOP, CCPS, CCD, runway, investor-readiness, pitch, and founder decision questions. Keep answers practical and founder-friendly. Use concise sections and bullet lists. Do not use emojis, decorative symbols, or emoji-style bullets. Avoid Markdown tables unless the user explicitly asks for a table. Do not provide legal, tax, or investment advice; suggest CA, CS, legal, or investment professional review where appropriate.",
};

const previewGuidanceMessage: ChatMessage = {
  role: "system",
  content:
    "For preview/free access, keep the answer short: under 180 words, no tables, and only the most actionable points.",
};

function getRunpodEndpointUrl() {
  const configuredUrl = process.env.RUNPOD_ENDPOINT_URL?.trim();
  const endpointId = process.env.RUNPOD_ENDPOINT_ID?.trim();

  if (configuredUrl) {
    const trimmed = configuredUrl.replace(/\/$/, "");
    return /\/run(sync)?$/.test(trimmed) ? trimmed : `${trimmed}/runsync`;
  }

  if (endpointId) {
    return `https://api.runpod.ai/v2/${endpointId}/runsync`;
  }

  throw new Error("RunPod endpoint is not configured");
}

function getRunpodApiKey() {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  if (!apiKey) throw new Error("RunPod API key is not configured");
  return apiKey;
}

function getProvider() {
  const provider = process.env.INDIA_FINANCE_AI_PROVIDER?.trim().toLowerCase();
  if (provider === "shared" || provider === "evaldam") return "shared";
  if (provider === "runpod") return "runpod";
  if (provider === "openrouter" && getOpenRouterApiKeys().length > 0) return "openrouter";
  if (provider === "groq") return "groq";
  if (process.env.EVALDAM_LLM_ENDPOINT_URL?.trim()) return "shared";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  return getOpenRouterApiKeys().length > 0 ? "openrouter" : "runpod";
}

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("Groq API key is not configured");
  return apiKey;
}

function getOpenRouterApiKeys() {
  const keys = [
    ...(process.env.OPENROUTER_API_KEYS || "")
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean),
    process.env.OPENROUTER_API_KEY?.trim(),
    process.env.OPENROUTER_API_KEY2?.trim(),
  ].filter((key): key is string => Boolean(key));

  return Array.from(new Set(keys));
}

function getOpenRouterModels() {
  const configuredModels = (process.env.OPENROUTER_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  if (configuredModels.length > 0) {
    return Array.from(new Set(configuredModels));
  }

  const primaryModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const fallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(new Set([primaryModel, ...fallbackModels, ...DEFAULT_OPENROUTER_FALLBACK_MODELS]));
}

function getMaxTokens(request: IndiaFinanceAiRequest) {
  const configured = Number(request.maxTokens || 0);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_MAX_TOKENS;
  return Math.min(DEFAULT_MAX_TOKENS, Math.max(200, Math.floor(configured)));
}

function buildMessages(request: IndiaFinanceAiRequest): ChatMessage[] {
  const { message, history = [] } = request;
  const safeHistory = history
    .filter((item) => ["user", "assistant", "system"].includes(item.role) && item.content.trim())
    .slice(-8);
  const usePreviewGuidance = getMaxTokens(request) < DEFAULT_MAX_TOKENS;

  return [
    systemMessage,
    ...(usePreviewGuidance ? [previewGuidanceMessage] : []),
    ...safeHistory.filter((item) => item.role !== "system"),
    { role: "user", content: message.trim() },
  ];
}

function buildPrompt(messages: ChatMessage[]) {
  return messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
}

function contentToText(content: unknown) {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return record.text ?? record.content ?? "";
        }
        return "";
      })
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .join("\n")
      .trim();
  }

  return "";
}

function recordText(record: Record<string, unknown>): string {
  const directAnswer =
    record.answer ??
    record.response ??
    record.text ??
    record.content ??
    record.generated_text ??
    record.generatedText ??
    record.completion ??
    record.result;

  const directText = contentToText(directAnswer);
  if (directText) return directText;

  if (Array.isArray(record.choices)) {
    const choiceTexts = record.choices
      .map((choice) => {
        if (!choice || typeof choice !== "object") return "";
        const choiceRecord = choice as Record<string, unknown>;
        const message = choiceRecord.message as Record<string, unknown> | undefined;
        const delta = choiceRecord.delta as Record<string, unknown> | undefined;
        return (
          contentToText(message?.content) ||
          contentToText(delta?.content) ||
          contentToText(choiceRecord.text) ||
          contentToText(choiceRecord.content)
        );
      })
      .filter(Boolean);

    if (choiceTexts.length > 0) return choiceTexts.join("\n").trim();
  }

  for (const key of ["output", "data", "outputs", "result", "results"]) {
    const nested = record[key];
    const nestedText = extractText(nested);
    if (nestedText) return nestedText;
  }

  return "";
}

function extractText(value: unknown): string {
  const directText = contentToText(value);
  if (directText) return directText;

  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (value && typeof value === "object") {
    return recordText(value as Record<string, unknown>);
  }

  return "";
}

function extractAnswer(data: unknown): IndiaFinanceAiAnswer {
  if (!data || typeof data !== "object") {
    const directText = contentToText(data);
    if (directText) return { answer: stripDecorativeEmoji(directText) };
    throw new Error("The model provider returned an empty response. Please try again.");
  }

  const record = data as Record<string, unknown>;
  const rawStatus = typeof record.status === "string" ? record.status : undefined;

  if ("error" in record) {
    throw new Error(providerErrorMessage(data, "The model provider returned an error."));
  }

  const answer = extractText(record);

  if (answer) {
    return { answer: stripDecorativeEmoji(answer), rawStatus };
  }

  if (rawStatus && rawStatus.toUpperCase() !== "COMPLETED") {
    throw new Error(`The model provider returned ${rawStatus}. Please try again in a moment.`);
  }

  throw new Error("The model provider returned a completed response without text. Please try again.");
}

function stripDecorativeEmoji(value: string) {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "").replace(/[ \t]+\n/g, "\n").trim();
}

function providerErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error: unknown }).error;
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error) {
      const errorRecord = error as { message: unknown; metadata?: unknown };
      const metadata = errorRecord.metadata as Record<string, unknown> | undefined;
      if (typeof metadata?.raw === "string") return metadata.raw;
      const message = errorRecord.message;
      if (typeof message === "string") return message;
    }
    return JSON.stringify(error);
  }

  return fallback;
}

export async function askIndiaFinanceAi(request: IndiaFinanceAiRequest): Promise<IndiaFinanceAiAnswer> {
  const provider = getProvider();

  if (provider === "shared") {
    return askSharedEvaldamAi(request);
  }

  if (provider === "groq") {
    return askGroqIndiaFinanceAi(request);
  }

  if (provider === "openrouter") {
    return askOpenRouterIndiaFinanceAi(request);
  }

  return askRunpodIndiaFinanceAi(request);
}

async function askSharedEvaldamAi(request: IndiaFinanceAiRequest): Promise<IndiaFinanceAiAnswer> {
  const messages = buildMessages(request)
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  const answer = await callLLM(messages, {
    system: getMaxTokens(request) < DEFAULT_MAX_TOKENS
      ? `${systemMessage.content}\n\n${previewGuidanceMessage.content}`
      : systemMessage.content,
    useCase: "report",
    maxTokens: getMaxTokens(request),
    temperature: 0.2,
  });

  return {
    answer: stripDecorativeEmoji(answer),
    rawStatus: process.env.PREFERRED_LLM_PROVIDER || "shared",
  };
}

async function askGroqIndiaFinanceAi(request: IndiaFinanceAiRequest): Promise<IndiaFinanceAiAnswer> {
  const apiKey = getGroqApiKey();
  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
  const messages = buildMessages(request);
  const maxTokens = getMaxTokens(request);
  const controller = new AbortController();
  const timeoutMs = Number(process.env.RUNPOD_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(providerErrorMessage(data, `Groq request failed with status ${response.status}`));
    }

    const answer = extractAnswer(data);
    return { ...answer, rawStatus: answer.rawStatus || model };
  } finally {
    clearTimeout(timeout);
  }
}

async function askOpenRouterIndiaFinanceAi(request: IndiaFinanceAiRequest): Promise<IndiaFinanceAiAnswer> {
  const apiKeys = getOpenRouterApiKeys();
  if (apiKeys.length === 0) throw new Error("OpenRouter API key is not configured");

  const models = getOpenRouterModels();
  const messages = buildMessages(request);
  const maxTokens = getMaxTokens(request);
  const timeoutMs = Number(process.env.RUNPOD_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  let lastError: Error | null = null;

  for (let index = 0; index < apiKeys.length; index += 1) {
    for (const model of models) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKeys[index]}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://equidamai.com",
            "X-OpenRouter-Title": "Evaldam Startup AI",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(providerErrorMessage(data, `OpenRouter request failed with status ${response.status}`));
        }

        const answer = extractAnswer(data);
        return { ...answer, rawStatus: answer.rawStatus || model };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("OpenRouter request failed");
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  throw lastError || new Error("OpenRouter request failed");
}

async function askRunpodIndiaFinanceAi(request: IndiaFinanceAiRequest): Promise<IndiaFinanceAiAnswer> {
  const endpointUrl = getRunpodEndpointUrl();
  const apiKey = getRunpodApiKey();
  const messages = buildMessages(request);
  const controller = new AbortController();
  const timeoutMs = Number(process.env.RUNPOD_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: {
          message: request.message.trim(),
          messages,
          prompt: buildPrompt(messages),
          max_tokens: getMaxTokens(request),
        },
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(providerErrorMessage(data, `RunPod request failed with status ${response.status}`));
    }

    return extractAnswer(data);
  } finally {
    clearTimeout(timeout);
  }
}
