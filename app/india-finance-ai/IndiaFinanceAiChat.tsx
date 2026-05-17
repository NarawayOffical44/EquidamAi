"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Bot, Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import { getSessionToken } from "@/lib/utils/browser-session";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Usage = {
  plan: "anonymous" | "free" | "pro" | "plus" | "enterprise";
  limit: number;
  used: number;
  remaining: number;
  period: "day" | "month";
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
  };
  error?: string;
  usage?: Usage;
  upgradeUrl?: string;
};

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

const planLabels: Record<Usage["plan"], string> = {
  anonymous: "Preview access",
  free: "Starter access",
  pro: "Founder access",
  plus: "Advisor access",
  enterprise: "Enterprise access",
};

const CHAT_STORAGE_KEY = "evaldam_startup_ai_chat_v1";

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
          <div key={`table-${index}`} className="my-3 max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  {head.map((cell, cellIndex) => (
                    <th key={cellIndex} className="border-b border-gray-200 px-3 py-2 font-semibold">
                      {renderInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-100 last:border-0">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="align-top px-3 py-2 text-gray-700">
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

export function IndiaFinanceAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [limiterEnabled, setLimiterEnabled] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [queuedBehind, setQueuedBehind] = useState(0);
  const [statusText, setStatusText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages) as ChatMessage[];
        const safeMessages = parsed
          .filter((message) => ["user", "assistant"].includes(message.role) && message.content.trim())
          .slice(-40);
        setMessages(safeMessages);
      }
    } catch {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } finally {
      setIsHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isHistoryLoaded) return;

    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Browser storage is best-effort until server-side chat history is built.
    }
  }, [isHistoryLoaded, messages]);

  useEffect(() => {
    const sessionToken = getSessionToken();
    fetch(`/api/india-finance-ai/chat?sessionToken=${encodeURIComponent(sessionToken)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.data?.usage) setUsage(data.data.usage);
        if (typeof data?.data?.limiterEnabled === "boolean") setLimiterEnabled(data.data.limiterEnabled);
      })
      .catch(() => {});
  }, []);

  const history = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim())
        .slice(-8)
        .map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading || isTyping) return;

    setError("");
    setInput("");
    setQueuedBehind(0);
    setStatusText("");
    setMessages((current) => [...current, { role: "user", content: text }]);
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
          history,
          sessionToken: getSessionToken(),
        }),
      });

      const data = (await response.json()) as ChatResponse;

      if (!response.ok || !data.success || !data.data) {
        if (data.usage) setUsage(data.usage);
        throw new Error(data.error || "Evaldam Startup AI is unavailable");
      }

      setUsage(data.data.usage);
      setLimiterEnabled(Boolean(data.data.limiterEnabled));
      setQueuedBehind(data.data.queuedBehind);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      setStatusText("");
      setIsLoading(false);
      await showAssistantReply(data.data.answer || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      setStatusText("");
      setIsLoading(false);
    }
  };

  const showAssistantReply = (answer: string) =>
    new Promise<void>((resolve) => {
      const text = answer.trim();
      if (!text) {
        resolve();
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

  const usageLabel = usage
    ? limiterEnabled
      ? `${usage.used}/${usage.limit} questions this ${usage.period}`
      : "Testing access"
    : "Loading limits...";
  const isLimitReached = limiterEnabled && Boolean(usage?.upgradeRequired || usage?.remaining === 0);
  const usagePercent = usage && limiterEnabled ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const hasConversation = messages.length > 0;

  useEffect(() => {
    const handlePageTyping = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (
        isEditableTarget ||
        isLoading ||
        isTyping ||
        isLimitReached ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key.length !== 1
      ) {
        return;
      }

      event.preventDefault();
      setInput((current) => current + event.key);
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    window.addEventListener("keydown", handlePageTyping);
    return () => window.removeEventListener("keydown", handlePageTyping);
  }, [isLimitReached, isLoading, isTyping]);

  const resetChat = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setMessages([]);
    setInput("");
    setError("");
    setStatusText("");
    setIsTyping(false);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const notice = error;

  const composer = (
    <div className="w-full max-w-3xl xl:max-w-[880px]">
      {notice && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">{notice}</p>
          {isLimitReached && (
            <Link href="/pricing" className="mt-2 inline-flex items-center gap-1 font-bold text-primary">
              Unlock higher limits
            </Link>
          )}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="rounded-[28px] border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,178,178,0.10)]"
      >
        <div className="flex min-h-[68px] items-end gap-3 px-4 py-3 sm:px-5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !isLoading && !isTyping) {
                event.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            disabled={isLoading || isTyping || isLimitReached}
            placeholder={isLimitReached ? "Unlock more questions to continue." : "Ask about fundraising, dilution, ESOP, CCPS, CCD, runway, valuation..."}
            className="max-h-40 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-base font-normal leading-6 text-gray-900 outline-none placeholder:text-gray-400 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={isLoading || isTyping || isLimitReached || !input.trim()}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </form>

      <p className="mx-auto mt-3 max-w-3xl text-center text-xs leading-relaxed text-gray-500">
        Founder education and fundraising preparation only. For legal, tax, compliance, or investment decisions, consult a qualified professional.
      </p>
    </div>
  );

  return (
    <main className="grid min-h-dvh bg-white text-gray-900 lg:grid-cols-[328px_minmax(0,1fr)]">
      <aside className="hidden border-r border-gray-200 bg-[#f9f9f9] lg:flex lg:flex-col">
        <div className="flex h-[72px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-semibold text-gray-950">Evaldam</span>
          </Link>
        </div>

        <div className="flex-1 px-3">
          <button
            type="button"
            onClick={resetChat}
            className="mb-1 flex h-11 w-full items-center gap-3 rounded-xl bg-primary/10 px-3 text-[15px] font-semibold text-primary transition hover:bg-primary/15"
          >
            <MessageSquarePlus className="h-[18px] w-[18px]" />
            New chat
          </button>

          <p className="px-3 pt-3 text-xs leading-5 text-gray-500">
            Q&A mode is live. File upload and saved chat history will be added after the first paid demand signal.
          </p>
        </div>

        <div className="space-y-1 border-t border-gray-200 px-3 py-4">
          <Link href="/pricing" className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-normal text-gray-900 transition hover:bg-primary/10 hover:text-primary">
            <Sparkles className="h-[18px] w-[18px]" />
            See plans and pricing
          </Link>
          <Link href="/faq" className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-normal text-gray-900 transition hover:bg-primary/10 hover:text-primary">
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
        </div>
      </aside>

      <section className="flex min-h-dvh min-w-0 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white lg:hidden">
              <Sparkles className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-none text-gray-950 sm:text-[22px]">Evaldam Startup AI</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/login" className="flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 sm:h-11 sm:px-5 sm:text-[15px]">
              Sign in
            </Link>
            <Link href="/signup" className="hidden h-11 items-center rounded-full border border-primary/30 px-5 text-[15px] font-semibold text-primary transition hover:bg-primary/10 sm:flex">
              Get started
            </Link>
          </div>
        </header>

        {hasConversation ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
              <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6">
                {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex animate-fade ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[86%] ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "border border-gray-200 bg-gray-50 text-gray-800"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                      <Bot className="h-3.5 w-3.5" />
                      Evaldam Startup AI
                    </div>
                  )}
                  {message.role === "assistant" ? (
                    <div className="min-w-0 text-[15px] leading-relaxed">{message.content ? renderAssistantContent(message.content) : null}</div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
                ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
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
            <div className="sticky bottom-0 z-10 shrink-0 border-t border-gray-100 bg-white/95 px-4 pb-4 pt-3 backdrop-blur sm:px-6 sm:pb-5">
              <div className="mx-auto flex max-w-3xl flex-col items-center xl:max-w-[880px]">{composer}</div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-[10vh] pt-6 sm:px-6 sm:pb-[14vh]">
            <h1 className="mb-7 text-center text-2xl font-normal leading-tight text-gray-950 sm:mb-8 sm:text-[30px]">
              What startup question are we working on today?
            </h1>
            {composer}
            <div className="mt-5 flex w-full max-w-3xl flex-wrap justify-center gap-2 xl:max-w-[880px]">
              {suggestedPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading || isTyping || isLimitReached}
                  className="max-w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
              <span>{usage ? planLabels[usage.plan] : "Access"}</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span>{usageLabel}</span>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${usagePercent}%` }} />
              </span>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-500 lg:hidden">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-primary">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
