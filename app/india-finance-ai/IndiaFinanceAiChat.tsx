"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Bot, Check, Copy, Loader2, MessageSquarePlus, Sparkles, X } from "lucide-react";
import { getSessionToken } from "@/lib/utils/browser-session";
import { FREE_AI_PROMPT_CHARACTER_LIMIT } from "@/lib/plans/plan-limits";
import {
  clearStartupAiChatHistory,
  STARTUP_AI_CHAT_STORAGE_KEY as CHAT_STORAGE_KEY,
  STARTUP_AI_CONTEXT_CACHE_STORAGE_KEY as CONTEXT_CACHE_STORAGE_KEY,
} from "@/lib/india-finance-ai/chat-storage";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type StoredChat = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

type Usage = {
  plan: "anonymous" | "free" | "pro" | "plus" | "startup" | "agency" | "enterprise";
  limit: number;
  used: number;
  remaining: number;
  period: "day" | "month";
  promptCharacterLimit?: number | null;
  upgradeRequired: boolean;
};

type ChatResponse = {
  success: boolean;
  data?: {
    answer: string;
    queuedBehind: number;
    waitMs: number;
    usage: Usage;
    limiterEnabled?: boolean;
    thread?: {
      id: string;
      title: string;
      updatedAt: number;
    } | null;
  };
  error?: string;
  usage?: Usage;
  upgradeUrl?: string;
};

type ChatHistoryResponse = {
  success: boolean;
  data?: {
    chats: StoredChat[];
    dbBacked: boolean;
  };
  error?: string;
};

type ChatContextCache = Record<string, ChatMessage[]>;

const suggestedPrompts = [
  "What should I check before accepting this seed term sheet?",
  "Explain CCPS vs CCD for an Indian startup founder.",
  "How much dilution if I raise INR 1 Cr at INR 8 Cr pre-money?",
  "How much runway should I show before fundraising?",
  "How should I think about ESOP pool before a seed round?",
];

const footerLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Help", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

const CONTEXT_MESSAGE_LIMIT = 10;
const MAX_CONTEXT_CACHE_CHATS = 20;
const SINGLE_CHAT_MESSAGE_LIMIT = 40;

function isFreeAccessPlan(plan: Usage["plan"]) {
  return plan === "anonymous" || plan === "free";
}

function isPaidAccessPlan(plan: Usage["plan"]) {
  return !isFreeAccessPlan(plan);
}

function isUsageLimitReached(usage: Usage) {
  return usage.upgradeRequired || usage.remaining <= 0;
}

function normalizeChatMessages(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") return false;
      const record = message as Record<string, unknown>;
      return (record.role === "user" || record.role === "assistant") && typeof record.content === "string" && record.content.trim().length > 0;
    })
    .slice(-limit);
}

function readStoredSingleChatMessages() {
  try {
    const storedValue = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!storedValue) return [];

    const parsedValue: unknown = JSON.parse(storedValue);
    return normalizeChatMessages(parsedValue, SINGLE_CHAT_MESSAGE_LIMIT);
  } catch {
    return [];
  }
}

function readDashboardContextCache(): ChatContextCache {
  try {
    const storedValue = localStorage.getItem(CONTEXT_CACHE_STORAGE_KEY);
    if (!storedValue) return {};

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) return {};

    return Object.entries(parsedValue as Record<string, unknown>).reduce<ChatContextCache>((cache, [chatId, messages]) => {
      const normalizedMessages = normalizeChatMessages(messages, CONTEXT_MESSAGE_LIMIT);
      if (normalizedMessages.length > 0) cache[chatId] = normalizedMessages;
      return cache;
    }, {});
  } catch {
    return {};
  }
}

function writeDashboardContextCache(chats: StoredChat[]) {
  const nextCache = chats.slice(0, MAX_CONTEXT_CACHE_CHATS).reduce<ChatContextCache>((cache, chat) => {
    const contextMessages = normalizeChatMessages(chat.messages, CONTEXT_MESSAGE_LIMIT);
    if (contextMessages.length > 0) cache[chat.id] = contextMessages;
    return cache;
  }, {});

  try {
    localStorage.setItem(CONTEXT_CACHE_STORAGE_KEY, JSON.stringify(nextCache));
  } catch {}

  return nextCache;
}

function createChatId() {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createChatTimestamp() {
  return Date.now();
}

function getChatTitle(messages: ChatMessage[]) {
  return (
    messages
      .find((message) => message.role === "user")
      ?.content.trim()
      .replace(/\s+/g, " ")
      .slice(0, 72) || "New chat"
  );
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-gray-950">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableLine(line: string) {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.includes("|", 1);
}

function isTableDivider(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function isHeadingLine(line: string) {
  const trimmed = line.trim();
  return /^#{1,4}\s+/.test(trimmed) || (/^\*\*[^*]+\*\*$/.test(trimmed) && trimmed.length < 90);
}

function isListLine(line: string) {
  const trimmed = line.trim();
  return /^[-*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed);
}

function isNumericTableCell(cell: string) {
  return /(?:\u20b9|INR|Rs\.?|\$|%|\d)/i.test(cell);
}

function renderAssistantContent(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isTableLine(line)) {
      const tableLines: string[] = [];
      while (index < lines.length && isTableLine(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }

      const rows = tableLines.filter((item) => !isTableDivider(item)).map(parseTableRow);
      const [head, ...body] = rows;

      if (head && body.length > 0) {
        blocks.push(
          <div key={`table-${index}`} className="my-3 max-w-full overflow-x-auto rounded-[4px] border border-slate-200/60 bg-white">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead className="bg-white text-[10px] uppercase text-gray-500">
                <tr>
                  {head.map((cell, cellIndex) => (
                    <th
                      key={cellIndex}
                      className={`border-b border-slate-200/60 px-3 py-2 font-bold ${isNumericTableCell(cell) ? "text-right font-mono tabular-nums" : ""}`}
                    >
                      {renderInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-100 last:border-0">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`align-top px-3 py-2 text-gray-700 ${isNumericTableCell(cell) ? "text-right font-mono tabular-nums text-gray-900" : ""}`}
                      >
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`} className="my-2 ml-5 list-disc space-y-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`} className="my-2 ml-5 list-decimal space-y-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (isHeadingLine(line)) {
      const heading = trimmed.replace(/^#{1,4}\s+/, "").replace(/^\*\*/, "").replace(/\*\*$/, "");
      blocks.push(
        <p key={`heading-${index}`} className="mt-3 font-semibold text-gray-950 first:mt-0">
          {renderInlineMarkdown(heading)}
        </p>
      );
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isTableLine(lines[index]) &&
      !isListLine(lines[index]) &&
      !isHeadingLine(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="my-2 first:mt-0 last:mb-0">
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>
    );
  }

  return blocks;
}

export function IndiaFinanceAiChat({
  embedded = false,
  showHistorySidebar = false,
  embeddedHeightClassName = "h-[calc(100svh-5rem)]",
  defaultHistorySidebarOpen = true,
}: {
  embedded?: boolean;
  showHistorySidebar?: boolean;
  embeddedHeightClassName?: string;
  defaultHistorySidebarOpen?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [queuedBehind, setQueuedBehind] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<"limit_reached" | "new_chat_upgrade" | null>(null);
  const [chatStorageReady, setChatStorageReady] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(defaultHistorySidebarOpen);
  const [storedChats, setStoredChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const contextCacheRef = useRef<ChatContextCache>({});
  const messagesRef = useRef<ChatMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTypingReplyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const scrollEl = messagesScrollRef.current;
    scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isTyping]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const sessionToken = getSessionToken();
    contextCacheRef.current = readDashboardContextCache();
    fetch(`/api/india-finance-ai/chat?sessionToken=${encodeURIComponent(sessionToken)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.data?.usage) setUsage(data.data.usage);
      })
      .catch(() => {});
  }, []);

  const getContextHistory = (chatId: string | null, fallbackMessages: ChatMessage[]) => {
    const contextMessages = chatId ? contextCacheRef.current[chatId] : null;
    return (contextMessages?.length ? contextMessages : fallbackMessages)
      .filter((message) => message.content.trim())
      .slice(-CONTEXT_MESSAGE_LIMIT)
      .map((message) => ({ role: message.role, content: message.content }));
  };

  const upsertStoredChat = (chatId: string, nextMessages: ChatMessage[], updatedAt: number) => {
    if (nextMessages.length === 0) return;

    const nextChat: StoredChat = {
      id: chatId,
      title: getChatTitle(nextMessages),
      messages: nextMessages.slice(-40),
      updatedAt,
    };

    setStoredChats((currentChats) => {
      const nextChats = [nextChat, ...currentChats.filter((chat) => chat.id !== chatId)].slice(0, 20);
      if (showHistorySidebar && usage && isPaidAccessPlan(usage.plan)) {
        contextCacheRef.current = writeDashboardContextCache(nextChats);
      } else {
        try {
          localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextChat.messages));
        } catch {}
      }
      return nextChats;
    });
  };

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading || isTyping) return;

    const promptLimit = usage?.promptCharacterLimit || (usage && isFreeAccessPlan(usage.plan) ? FREE_AI_PROMPT_CHARACTER_LIMIT : null);
    if (promptLimit && text.length > promptLimit) {
      const charactersOverLimit = text.length - promptLimit;
      setError(`Message is too long. Shorten it by ${charactersOverLimit.toLocaleString()} character${charactersOverLimit === 1 ? "" : "s"}.`);
      return;
    }

    setError("");
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setQueuedBehind(0);
    setStatusText("");

    const isPaidDashboardChat = showDashboardHistory && usage && isPaidAccessPlan(usage.plan);
    const requestChatId = isPaidDashboardChat ? activeChatId || createChatId() : null;
    const requestHistory = getContextHistory(requestChatId, messagesRef.current);
    const requestMessages = [...messagesRef.current, { role: "user" as const, content: text }];

    if (requestChatId) {
      if (!activeChatId) setActiveChatId(requestChatId);
      activeChatIdRef.current = requestChatId;
      upsertStoredChat(requestChatId, requestMessages, createChatTimestamp());
    }

    setMessages(requestMessages);
    setIsLoading(true);
    statusTimerRef.current = setTimeout(() => {
      setStatusText("Thinking through the startup context...");
    }, 450);

    try {
      const response = await fetch("/api/india-finance-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: requestHistory,
          sessionToken: getSessionToken(),
          threadId: requestChatId || undefined,
        }),
      });

      const data = (await response.json()) as ChatResponse;

      if (!response.ok || !data.success || !data.data) {
        if (data.usage) setUsage(data.usage);
        if (data.usage && isFreeAccessPlan(data.usage.plan) && isUsageLimitReached(data.usage)) {
          setError("");
          setMessages((current) => {
            const last = current[current.length - 1];
            if (last?.role === "user" && last.content === text) return current.slice(0, -1);
            return current;
          });
          setInput(text);
          setUpgradeModal("limit_reached");
          return;
        }
        throw new Error(data.error || "Evaldam Startup AI is unavailable");
      }

      const nextUsage = data.data.usage;
      const nextLimiterEnabled = Boolean(data.data.limiterEnabled);
      setUsage(nextUsage);
      setQueuedBehind(data.data.queuedBehind);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      setStatusText("");
      setIsLoading(false);
      await showAssistantReply(data.data.answer || "", requestChatId ? { chatId: requestChatId, baseMessages: requestMessages } : undefined);

      if (isFreeAccessPlan(nextUsage.plan) && nextLimiterEnabled && isUsageLimitReached(nextUsage)) {
        setUpgradeModal("limit_reached");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      setStatusText("");
      setIsLoading(false);
    }
  };

  const showAssistantReply = (answer: string, targetChat?: { chatId: string; baseMessages: ChatMessage[] }) =>
    new Promise<void>((resolve) => {
      const text = answer.trim();
      if (!text) {
        resolve();
        return;
      }

      if (targetChat) {
        const finalMessages = [...targetChat.baseMessages, { role: "assistant" as const, content: text }];
        const persistFinalReply = () => upsertStoredChat(targetChat.chatId, finalMessages, createChatTimestamp());
        let finished = false;
        const finishReply = () => {
          if (finished) return;
          finished = true;
          if (typingTimerRef.current) clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          finishTypingReplyRef.current = null;
          setIsTyping(false);
          persistFinalReply();
          resolve();
        };

        if (activeChatIdRef.current !== targetChat.chatId) {
          finishReply();
          return;
        }

        finishTypingReplyRef.current = finishReply;
        const preDelay = Math.min(650, Math.max(180, text.length * 2));
        setIsTyping(true);
        window.setTimeout(() => {
          if (activeChatIdRef.current !== targetChat.chatId) {
            finishReply();
            return;
          }

          setMessages([...targetChat.baseMessages, { role: "assistant", content: "" }]);

          let index = 0;
          const chunkSize = text.length > 900 ? 10 : text.length > 350 ? 6 : 3;
          typingTimerRef.current = setInterval(() => {
            if (activeChatIdRef.current !== targetChat.chatId) {
              finishReply();
              return;
            }

            index = Math.min(text.length, index + chunkSize);
            setMessages([...targetChat.baseMessages, { role: "assistant", content: text.slice(0, index) }]);

            if (index >= text.length) {
              finishReply();
            }
          }, 16);
        }, preDelay);
        return;
      }

      const preDelay = Math.min(650, Math.max(180, text.length * 2));
      setIsTyping(true);
      window.setTimeout(() => {
        setMessages((current) => [...current, { role: "assistant", content: "" }]);

        let index = 0;
        const chunkSize = text.length > 900 ? 10 : text.length > 350 ? 6 : 3;
        typingTimerRef.current = setInterval(() => {
          index = Math.min(text.length, index + chunkSize);
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: text.slice(0, index) };
            }
            return next;
          });

          if (index >= text.length) {
            if (typingTimerRef.current) clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
            setIsTyping(false);
            resolve();
          }
        }, 16);
      }, preDelay);
    });

  const hasConversation = messages.length > 0;
  const showDashboardHistory = embedded && showHistorySidebar && usage?.plan !== "anonymous";
  const plansHref = embedded ? "/subscription" : "/pricing";
  const canCreateHistoryChats = Boolean(showDashboardHistory && usage && isPaidAccessPlan(usage.plan));
  const historyTitle =
    messages
      .find((message) => message.role === "user")
      ?.content.trim()
      .replace(/\s+/g, " ")
      .slice(0, 72) || "";
  useEffect(() => {
    if (!usage || chatStorageReady) return;

    if (showDashboardHistory && isPaidAccessPlan(usage.plan)) {
      let cancelled = false;

      fetch(`/api/india-finance-ai/chats?sessionToken=${encodeURIComponent(getSessionToken())}`)
        .then((response) => response.json())
        .then((data: ChatHistoryResponse) => {
          if (cancelled) return;
          if (!data.success || !data.data?.dbBacked) {
            setChatStorageReady(true);
            return;
          }

          const chats = data.data.chats || [];
          const activeChat = chats[0];
          contextCacheRef.current = writeDashboardContextCache(chats);
          setStoredChats(chats);
          if (activeChat) {
            setActiveChatId(activeChat.id);
            activeChatIdRef.current = activeChat.id;
            setMessages(activeChat.messages);
          }
          setChatStorageReady(true);
        })
        .catch(() => {
          if (!cancelled) {
            setError("Could not load saved chats. New messages can still be sent.");
            setChatStorageReady(true);
          }
        });

      return () => {
        cancelled = true;
      };
    } else if (usage.plan !== "anonymous") {
      const storedMessages = readStoredSingleChatMessages();
      const timeoutId = window.setTimeout(() => {
        if (storedMessages.length > 0) setMessages(storedMessages);
        setChatStorageReady(true);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    } else {
      clearStartupAiChatHistory();
      const timeoutId = window.setTimeout(() => setChatStorageReady(true), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [chatStorageReady, showDashboardHistory, usage]);

  useEffect(() => {
    if (!usage || !chatStorageReady) return;

    if (usage.plan === "anonymous") {
      clearStartupAiChatHistory();
      return;
    }

    if (showDashboardHistory && isPaidAccessPlan(usage.plan)) {
      return;
    }

    try {
      if (messages.length === 0) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } else {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
      }
    } catch {}
  }, [chatStorageReady, messages, showDashboardHistory, usage]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        Boolean(target.closest("button,a,select,[role='button'],[role='menuitem']"))
      );
    };

    const focusComposer = () => {
      requestAnimationFrame(() => {
        const inputElement = inputRef.current;
        if (!inputElement) return;

        inputElement.focus();
        const cursorPosition = inputElement.value.length;
        inputElement.setSelectionRange(cursorPosition, cursorPosition);
        inputElement.style.height = "auto";
        inputElement.style.height = `${Math.min(inputElement.scrollHeight, 120)}px`;
      });
    };

    const handlePageTyping = (event: KeyboardEvent) => {
      if (
        isEditableTarget(event.target) ||
        isLoading ||
        isTyping ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key.length !== 1
      ) {
        return;
      }

      event.preventDefault();
      setInput((current) => current + event.key);
      focusComposer();
    };

    const handlePageEditKey = (event: KeyboardEvent) => {
      if (
        isEditableTarget(event.target) ||
        isLoading ||
        isTyping ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key !== "Backspace"
      ) {
        return;
      }

      event.preventDefault();
      setInput((current) => current.slice(0, -1));
      focusComposer();
    };

    const handlePagePaste = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target) || isLoading || isTyping) return;

      const text = event.clipboardData?.getData("text");
      if (!text) return;

      event.preventDefault();
      setInput((current) => current + text);
      focusComposer();
    };

    window.addEventListener("keydown", handlePageTyping);
    window.addEventListener("keydown", handlePageEditKey);
    window.addEventListener("paste", handlePagePaste);
    return () => {
      window.removeEventListener("keydown", handlePageTyping);
      window.removeEventListener("keydown", handlePageEditKey);
      window.removeEventListener("paste", handlePagePaste);
    };
  }, [isLoading, isTyping]);

  const resetChat = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setMessages([]);
    setInput("");
    setError("");
    setStatusText("");
    setIsTyping(false);
    setCopiedMessageIndex(null);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const startHistoryChat = () => {
    if (!canCreateHistoryChats) {
      setUpgradeModal("new_chat_upgrade");
      return;
    }

    finishTypingReplyRef.current?.();
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    const nextChatId = createChatId();
    activeChatIdRef.current = nextChatId;
    setActiveChatId(nextChatId);
    setMessages([]);
    setInput("");
    setError("");
    setStatusText("");
    setIsTyping(false);
    setCopiedMessageIndex(null);
  };

  const openStoredChat = (chat: StoredChat) => {
    finishTypingReplyRef.current?.();
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    activeChatIdRef.current = chat.id;
    contextCacheRef.current = writeDashboardContextCache([chat, ...storedChats.filter((storedChat) => storedChat.id !== chat.id)]);
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setInput("");
    setError("");
    setStatusText("");
    setIsTyping(false);
    setCopiedMessageIndex(null);
  };

  const copyMessage = async (content: string, index: number) => {
    if (!content.trim()) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedMessageIndex(null), 1600);
    } catch {
      setError("Copy failed. Select the message text and copy manually.");
    }
  };

  const notice = error;
  const upgradeModalCopy = upgradeModal === "new_chat_upgrade"
    ? {
        title: "Multiple chats are a paid feature",
        body: "Upgrade to Startup to create and organize multiple Startup AI chats.",
        primaryLabel: "Upgrade to Startup",
        primaryHref: plansHref,
      }
    : {
        title: "Daily free limit reached",
        body: "You have used today's free Startup AI questions. Upgrade to Startup for higher AI limits, saved workspace access, and the full investor-ready Evaldam workflow.",
        primaryLabel: usage?.plan === "anonymous" ? "Create account" : "Upgrade to Startup",
        primaryHref: usage?.plan === "anonymous" ? "/signup" : plansHref,
      };

  const renderComposer = (showDisclaimer = true) => (
    <div className="w-full max-w-2xl">
      {notice && (
        <div className="mb-3 rounded-[4px] border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">{notice}</p>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)] transition focus-within:border-slate-300 focus-within:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
      >
        <div className="relative px-4 py-1.5 pr-12 sm:px-5 sm:pr-12">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !isLoading && !isTyping) {
                event.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            disabled={isLoading || isTyping}
            placeholder="Ask about fundraising, dilution, ESOP, CCPS, CCD, runway, valuation..."
            className="block w-full border-0 bg-transparent px-0 py-1.5 text-[15px] font-normal leading-6 text-gray-900 outline-none placeholder:text-gray-400 disabled:text-gray-400"
            style={{ resize: "none", overflowY: "auto", minHeight: "28px", maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={isLoading || isTyping || !input.trim()}
            className="absolute bottom-2 right-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:border disabled:border-slate-200 disabled:bg-white disabled:text-gray-400"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </form>

      {showDisclaimer && (
        <p className="mx-auto mt-3 max-w-3xl text-center text-xs leading-relaxed text-gray-500">
          AI-generated founder education only. Always consult a qualified professional for legal, tax, compliance, investment, or fundraising decisions.
        </p>
      )}
    </div>
  );

  const shellClassName = embedded
    ? `relative ${embeddedHeightClassName} min-h-0 w-full max-w-full overflow-hidden bg-white text-gray-900 ${showDashboardHistory ? "flex" : ""}`
    : "fixed inset-0 w-screen max-w-full overflow-hidden bg-white text-gray-900";
  const contentClassName = showDashboardHistory
    ? "flex h-full min-w-0 flex-1 max-w-full flex-col overflow-hidden"
    : embedded
      ? "flex h-full max-w-full flex-col overflow-hidden"
      : "flex h-full max-w-full flex-col overflow-hidden lg:pl-56";

  return (
    <>
    <main className={shellClassName}>
      {showDashboardHistory && historySidebarOpen && (
        <aside className="hidden w-64 shrink-0 overflow-hidden border-r border-slate-200/60 bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
              <p className="text-xs font-bold uppercase text-gray-500">History</p>
              <button
                type="button"
                onClick={() => setHistorySidebarOpen(false)}
                className="rounded-[4px] p-1 text-gray-400 transition hover:bg-slate-50 hover:text-gray-700"
                aria-label="Close chat history"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <button
                type="button"
                onClick={startHistoryChat}
                className="mb-3 flex h-10 w-full items-center gap-2 rounded-[4px] border border-primary/15 bg-white px-3 text-sm font-semibold text-primary transition hover:border-primary/30"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New chat
              </button>

              {canCreateHistoryChats ? (
                storedChats.length > 0 ? (
                  <div className="space-y-1">
                    {storedChats.map((chat) => (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => openStoredChat(chat)}
                        className={`w-full rounded-[4px] px-3 py-2 text-left text-sm font-semibold leading-snug transition ${
                          chat.id === activeChatId ? "bg-slate-100 text-gray-950" : "text-gray-700 hover:bg-slate-50"
                        }`}
                      >
                        {chat.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-gray-500">No chats yet</p>
                )
              ) : historyTitle ? (
                <div className="rounded-[4px] bg-slate-50 px-3 py-2 text-sm font-semibold leading-snug text-gray-900">
                  {historyTitle}
                </div>
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">No chats yet</p>
              )}
            </div>
          </div>
        </aside>
      )}

      {showDashboardHistory && !historySidebarOpen && (
        <button
          type="button"
          onClick={() => setHistorySidebarOpen(true)}
          className="absolute left-3 top-3 z-10 hidden h-9 items-center gap-2 rounded-[4px] border border-slate-200/60 bg-white px-3 text-sm font-semibold text-gray-600 shadow-sm transition hover:text-primary lg:flex"
        >
          History
        </button>
      )}
      {/* Sidebar — fixed, always on top of z-stack */}
      {!embedded && (
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col overflow-hidden border-r border-slate-200/60 bg-white lg:flex">
        <div className="flex h-[72px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-semibold text-gray-950">Evaldam</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <button
            type="button"
            onClick={resetChat}
            className="mb-1 flex h-11 w-full items-center gap-3 rounded-[4px] border border-primary/15 bg-white px-3 text-[15px] font-semibold text-primary transition hover:border-primary/30"
          >
            <MessageSquarePlus className="h-[18px] w-[18px]" />
            New chat
          </button>

          <p className="px-3 pt-3 text-xs leading-5 text-gray-500">
            Q&A mode is live. File upload and saved chat history will be added after the first paid demand signal.
          </p>

        </div>

        {!embedded && (
          <footer className="space-y-1 border-t border-gray-200 px-3 py-4">
            <Link href={plansHref} className="flex h-11 items-center gap-3 rounded-[4px] px-3 text-[15px] font-normal text-gray-900 transition hover:text-primary">
              <Sparkles className="h-[18px] w-[18px]" />
              See plans and pricing
            </Link>
            <Link href="/faq" className="flex h-11 items-center gap-3 rounded-[4px] px-3 text-[15px] font-normal text-gray-900 transition hover:text-primary">
              <Bot className="h-[18px] w-[18px]" />
              Help
            </Link>
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pt-4 text-xs text-gray-500">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-primary">
                  {link.label}
                </Link>
              ))}
            </div>
          </footer>
        )}
      </aside>
      )}

      {/* Main content — offset by sidebar width on lg+ */}
      <div className={contentClassName}>
        {!embedded && (
          <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-slate-200/60 bg-white px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" aria-label="Evaldam home" className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-primary text-white lg:hidden">
                <Sparkles className="h-4 w-4" />
              </Link>
              <p className="truncate text-lg font-semibold leading-none text-gray-950 sm:text-[22px]">Evaldam Startup AI</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link href="/login" className="hidden h-10 items-center rounded-[4px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 sm:flex sm:h-11 sm:px-5 sm:text-[15px]">
                Sign in
              </Link>
              <Link href="/signup" className="hidden h-11 items-center rounded-[4px] border border-primary/30 px-5 text-[15px] font-semibold text-primary transition hover:border-primary sm:flex">
                Get started
              </Link>
            </div>
          </header>
        )}

        {hasConversation ? (
          <>
            {/* Scrollable messages */}
            <div ref={messagesScrollRef} className="flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-6 sm:px-12 lg:px-16">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`group/message flex max-w-full animate-fade ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[88%] sm:max-w-[80%] ${message.role === "assistant" ? "pb-7" : ""}`}>
                      <div
                        className={`rounded-[8px] px-4 py-3 text-sm leading-relaxed ${
                          message.role === "user"
                            ? "border border-slate-200 bg-slate-50 text-gray-950"
                            : "border border-slate-200 bg-white text-gray-800 shadow-[0_8px_28px_rgba(15,23,42,0.04)]"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-primary">
                            <Bot className="h-3.5 w-3.5" />
                            Evaldam Startup AI
                          </div>
                        )}
                        {message.role === "assistant" ? (
                          <div className="min-w-0 break-words text-[15px] leading-relaxed">{message.content ? renderAssistantContent(message.content) : null}</div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                      </div>
                      {message.role === "assistant" && message.content.trim() && (
                        <button
                          type="button"
                          onClick={() => copyMessage(message.content, index)}
                          className="mt-1 inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium text-gray-500 opacity-0 transition hover:bg-slate-50 hover:text-primary focus-visible:opacity-100 group-hover/message:opacity-100"
                        >
                          {copiedMessageIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedMessageIndex === index ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-[4px] border border-slate-200/60 border-l-4 border-l-primary bg-white px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        {queuedBehind > 0 ? "Queued behind another question..." : statusText || "Preparing answer..."}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input — pinned to bottom */}
            <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-200/60 bg-white px-4 pb-4 pt-3 sm:px-12 lg:px-16">
              <div className="mx-auto w-full max-w-2xl">{renderComposer(false)}</div>
            </div>
          </>
        ) : (
          /* Empty state — centered in right panel */
          <div className="flex flex-1 flex-col justify-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
            <div className="mx-auto w-full max-w-2xl">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-primary">
                AI Assistant for the Startup Journey
              </p>
              <h1 className="mb-10 text-center text-2xl font-semibold leading-tight text-gray-950 sm:text-3xl">
                What startup question are we working on today?
              </h1>
              {renderComposer()}
              <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-3">
                {suggestedPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading || isTyping}
                    className="min-h-12 w-full whitespace-normal rounded-[6px] border border-slate-200 bg-white px-3 py-2 text-center text-xs font-medium leading-snug text-gray-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {!embedded && (
                <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-500 lg:hidden">
                {footerLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
    {upgradeModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="startup-ai-upgrade-title"
          className="w-full max-w-md rounded-[4px] border border-slate-200/60 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Evaldam Startup AI</p>
              <h2 id="startup-ai-upgrade-title" className="mt-2 text-xl font-semibold text-gray-950">{upgradeModalCopy.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => setUpgradeModal(null)}
              className="rounded-[2px] px-2 py-1 text-sm font-semibold text-gray-400 transition hover:text-gray-700"
              aria-label="Close"
            >
              x
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">{upgradeModalCopy.body}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={upgradeModalCopy.primaryHref}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[4px] bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              {upgradeModalCopy.primaryLabel}
            </Link>
            <button
              type="button"
              onClick={() => setUpgradeModal(null)}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[4px] border border-slate-200/60 px-5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Continue preview
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
