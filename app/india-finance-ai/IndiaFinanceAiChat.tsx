"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Bot, Check, Copy, Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import { getSessionToken } from "@/lib/utils/browser-session";
import { FREE_AI_PROMPT_CHARACTER_LIMIT } from "@/lib/plans/plan-limits";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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
  free: "Free access",
  pro: "Startup access",
  plus: "Agency access",
  startup: "Startup access",
  agency: "Agency access",
  enterprise: "Enterprise access",
};

const CHAT_STORAGE_KEY = "evaldam_startup_ai_chat_v1";
const CONVERSION_PROMPT_THRESHOLDS = [1, 5, 10] as const;

function isFreeAccessPlan(plan: Usage["plan"]) {
  return plan === "anonymous" || plan === "free";
}

function isUsageLimitReached(usage: Usage) {
  return usage.upgradeRequired || usage.remaining <= 0;
}

function getConversionPromptThreshold(usage: Usage) {
  return CONVERSION_PROMPT_THRESHOLDS.find((threshold) => usage.used === threshold) || null;
}

function conversionPromptStorageKey(threshold: number) {
  return `evaldam_startup_ai_conversion_prompt_${threshold}_seen`;
}

function wasConversionPromptShown(threshold: number) {
  try {
    return sessionStorage.getItem(conversionPromptStorageKey(threshold)) === "1";
  } catch {
    return false;
  }
}

function markConversionPromptShown(threshold: number) {
  try {
    sessionStorage.setItem(conversionPromptStorageKey(threshold), "1");
  } catch {}
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

export function IndiaFinanceAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [limiterEnabled, setLimiterEnabled] = useState(false);
  const [queuedBehind, setQueuedBehind] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<"conversion_prompt" | "limit_reached" | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scrollEl = messagesScrollRef.current;
    scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Best-effort cleanup for older saved browser chats.
    }
  }, []);

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
    const promptLimit = usage?.promptCharacterLimit || (usage && isFreeAccessPlan(usage.plan) ? FREE_AI_PROMPT_CHARACTER_LIMIT : null);
    if (promptLimit && text.length > promptLimit) {
      setError(`Free AI prompts are limited to ${promptLimit.toLocaleString()} characters. Shorten your question or upgrade for longer prompts.`);
      return;
    }

    setError("");
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
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
        if (data.usage && isFreeAccessPlan(data.usage.plan) && isUsageLimitReached(data.usage)) {
          setUpgradeModal("limit_reached");
        }
        throw new Error(data.error || "Evaldam Startup AI is unavailable");
      }

      const nextUsage = data.data.usage;
      const nextLimiterEnabled = Boolean(data.data.limiterEnabled);
      setUsage(nextUsage);
      setLimiterEnabled(nextLimiterEnabled);
      setQueuedBehind(data.data.queuedBehind);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      setStatusText("");
      setIsLoading(false);
      await showAssistantReply(data.data.answer || "");

      if (isFreeAccessPlan(nextUsage.plan) && nextLimiterEnabled && isUsageLimitReached(nextUsage)) {
        setUpgradeModal("limit_reached");
      } else if (isFreeAccessPlan(nextUsage.plan) && nextLimiterEnabled) {
        const threshold = getConversionPromptThreshold(nextUsage);
        if (threshold && !wasConversionPromptShown(threshold)) {
          markConversionPromptShown(threshold);
          setUpgradeModal("conversion_prompt");
        }
      }
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
  const promptCharacterLimit = usage?.promptCharacterLimit || (usage && isFreeAccessPlan(usage.plan) ? FREE_AI_PROMPT_CHARACTER_LIMIT : null);

  useEffect(() => {
    if (usage && isFreeAccessPlan(usage.plan) && isLimitReached) {
      setUpgradeModal("limit_reached");
    }
  }, [isLimitReached, usage]);

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
      setInput((current) => {
        if (promptCharacterLimit && current.length >= promptCharacterLimit) return current;
        return current + event.key;
      });
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    window.addEventListener("keydown", handlePageTyping);
    return () => window.removeEventListener("keydown", handlePageTyping);
  }, [isLimitReached, isLoading, isTyping, promptCharacterLimit]);

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
  const upgradeModalCopy =
    upgradeModal === "limit_reached"
      ? {
          title: "Free AI limit reached",
          body: "Upgrade to Startup to continue asking questions with higher limits and unlock the full Evaldam workflow.",
          primaryLabel: usage?.plan === "anonymous" ? "Create account" : "Upgrade to Startup",
          primaryHref: usage?.plan === "anonymous" ? "/signup" : "/pricing",
        }
      : {
          title: usage?.plan === "anonymous" ? "Create your free account" : "Unlock more Startup AI",
          body: usage
            ? `You have used ${usage.used}/${usage.limit} free Startup AI questions. Create an account or upgrade for saved access, higher limits, and the full investor-ready workflow.`
            : "Create an account or upgrade for saved access, higher limits, and the full investor-ready workflow.",
          primaryLabel: usage?.plan === "anonymous" ? "Create account" : "View plans",
          primaryHref: usage?.plan === "anonymous" ? "/signup" : "/pricing",
        };

  const renderComposer = (showDisclaimer = true) => (
    <div className="w-full max-w-xs sm:max-w-xl">
      {notice && (
        <div className="mb-3 rounded-[4px] border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900">
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
        className="overflow-hidden rounded-[4px] border border-slate-200/60 bg-white"
      >
        <div className="flex min-h-[68px] items-end gap-3 px-4 py-3 sm:px-5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !isLoading && !isTyping) {
                event.preventDefault();
                sendMessage();
              }
            }}
            maxLength={promptCharacterLimit || undefined}
            rows={1}
            disabled={isLoading || isTyping || isLimitReached}
            placeholder={isLimitReached ? "Unlock more questions to continue." : "Ask about fundraising, dilution, ESOP, CCPS, CCD, runway, valuation..."}
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-base font-normal leading-6 text-gray-900 outline-none placeholder:text-gray-400 disabled:text-gray-400"
            style={{ resize: "none", overflow: "hidden", minHeight: "40px", maxHeight: "160px" }}
          />
          <button
            type="submit"
            disabled={isLoading || isTyping || isLimitReached || !input.trim()}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:border disabled:border-slate-200/60 disabled:bg-white disabled:text-gray-400"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </form>

      {showDisclaimer && (
        <p className="mx-auto mt-3 max-w-3xl text-center text-xs leading-relaxed text-gray-500">
          {promptCharacterLimit ? `${Math.max(promptCharacterLimit - input.length, 0).toLocaleString()} characters left. ` : ""}
          Founder education and fundraising preparation only. For legal, tax, compliance, or investment decisions, consult a qualified professional.
        </p>
      )}
    </div>
  );

  return (
    <>
    <main className="fixed inset-0 w-screen max-w-full overflow-hidden bg-white text-gray-900">
      {/* Sidebar — fixed, always on top of z-stack */}
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

          <p className="px-3 pt-3 text-xs leading-5 text-gray-500">
            Plan: <span className="font-semibold text-gray-800">{usage ? planLabels[usage.plan] : "Loading..."}</span>
          </p>
        </div>

        <footer className="space-y-1 border-t border-gray-200 px-3 py-4">
          <Link href="/pricing" className="flex h-11 items-center gap-3 rounded-[4px] px-3 text-[15px] font-normal text-gray-900 transition hover:text-primary">
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
      </aside>

      {/* Main content — offset by sidebar width on lg+ */}
      <div className="flex h-full max-w-full flex-col overflow-hidden lg:pl-56">
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

        {hasConversation ? (
          <>
            {/* Scrollable messages */}
            <div ref={messagesScrollRef} className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-12 lg:px-16">
              <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex max-w-full animate-fade ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-[4px] px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] ${
                        message.role === "user"
                          ? "border border-slate-200/60 bg-white text-gray-900"
                          : "border border-slate-200/60 border-l-4 border-l-primary bg-white text-gray-800"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                          <Bot className="h-3.5 w-3.5" />
                          Evaldam Startup AI
                        </div>
                      )}
                      {message.role === "assistant" ? (
                        <div className="min-w-0 break-words text-[15px] leading-relaxed">{message.content ? renderAssistantContent(message.content) : null}</div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      {message.role === "assistant" && message.content.trim() && (
                        <div className="mt-3 flex justify-start">
                          <button
                            type="button"
                            onClick={() => copyMessage(message.content, index)}
                            className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-xs font-medium text-gray-500 transition hover:text-primary"
                          >
                            {copiedMessageIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedMessageIndex === index ? "Copied" : "Copy"}
                          </button>
                        </div>
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
            <div className="shrink-0 border-t border-slate-200/60 bg-white px-4 pb-4 pt-3 sm:px-12 lg:px-16">
              <div className="mx-auto w-full max-w-xl">{renderComposer(false)}</div>
            </div>
          </>
        ) : (
          /* Empty state — centered in right panel */
          <div className="flex flex-1 flex-col justify-center overflow-x-hidden overflow-y-auto px-4 py-10 sm:px-12 lg:px-16">
            <div className="mx-auto w-full max-w-xs sm:max-w-xl">
              <h1 className="mb-6 text-center text-xl font-semibold leading-snug text-gray-950 sm:text-2xl">
                What startup question are we working on today?
              </h1>
              {renderComposer()}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {suggestedPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading || isTyping || isLimitReached}
                    className="w-full max-w-full whitespace-normal rounded-[4px] border border-slate-200/60 bg-white px-4 py-2 text-center text-sm font-medium leading-snug text-gray-700 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                <span>{usage ? planLabels[usage.plan] : "Access"}</span>
                <span className="h-1 w-1 rounded-full border border-gray-300 bg-white" />
                <span>{usageLabel}</span>
                <span className="h-1.5 w-20 overflow-hidden rounded-full border border-slate-200/60 bg-white">
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
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[4px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
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
