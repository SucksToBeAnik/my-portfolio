"use client";

import { ArrowSquareOut, ChatCircleDots, PaperPlaneRight, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPopupProps {
  open: boolean;
  onClose: () => void;
}

const suggestions = [
  "What projects have you built?",
  "Tell me about your experience",
  "What technologies do you use?",
  "What are you currently working on?",
];

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="text-fg/80 mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
  em: ({ children }) => <em className="italic text-fg/70">{children}</em>,
  ul: ({ children }) => <ul className="my-1.5 pl-4 space-y-0.5 list-disc marker:text-fg/30">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 pl-4 space-y-0.5 list-decimal marker:text-fg/30">{children}</ol>,
  li: ({ children }) => <li className="text-fg/80 leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-fg/70 underline underline-offset-2 hover:text-fg transition-colors inline-flex items-center gap-0.5"
    >
      {children}
      <ArrowSquareOut weight="bold" className="w-2.5 h-2.5 shrink-0" />
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = !!className;
    if (isBlock) return <code className={`${className} text-fg/90 text-[10px]`}>{children}</code>;
    return <code className="bg-fg/10 text-fg text-[10px] px-1 py-0.5 rounded font-mono">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-fg/5 rounded-lg p-2.5 overflow-x-auto my-2 text-[10px] font-mono">{children}</pre>
  ),
  h1: ({ children }) => <h1 className="text-sm font-heading font-semibold text-fg mb-1 mt-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xs font-heading font-semibold text-fg mb-1 mt-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-semibold text-fg mb-0.5 mt-1.5">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-fg/20 pl-3 my-1.5 text-fg/60 italic">{children}</blockquote>
  ),
  hr: () => <hr className="border-hairline my-2" />,
};

export function ChatPopup({ open, onClose }: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number>(50);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([]);
      const val = getCookie("query_remaining");
      if (val) {
        const n = parseInt(val, 10);
        if (!Number.isNaN(n)) setRemaining(n);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = { role: "user", content: text };
      const assistantPlaceholder: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setInput("");
      setIsLoading(true);

      abortRef.current = new AbortController();

      const messagesWithoutPlaceholder = [...messages, userMsg];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ messages: messagesWithoutPlaceholder }),
          signal: abortRef.current.signal,
        });

        if (res.status === 429) {
          const body = await res.json();
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: body.error || "You've reached your daily limit. Come back tomorrow!",
            },
          ]);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: "Sorry, something went wrong. Please try again." },
          ]);
          setIsLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let accumulated = "";
        const streamOk = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: accumulated };
            return next;
          });
        }

        if (streamOk && accumulated) {
          try {
            const consumeRes = await fetch("/api/chat/consume", { method: "POST" });
            if (consumeRes.ok) {
              const body = await consumeRes.json();
              setRemaining(body.remaining);
            }
          } catch {}
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: "Sorry, something went wrong." },
          ]);
        }
      }

      setIsLoading(false);
    },
    [isLoading, messages],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] sm:pt-[12vh]"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-bg/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] mx-4 bg-bg border border-hairline rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[480px] sm:max-h-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <ChatCircleDots weight="thin" className="w-4 h-4 text-fg" />
            <span className="text-sm font-heading">Ask about me</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X weight="thin" className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="space-y-3 py-4">
              <p className="text-xs text-muted text-center">
                Ask me anything about my work, projects, or experience.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 rounded-full text-xs border border-hairline text-muted hover:text-fg hover:border-fg/30 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-fg/15 text-fg"
                    : "bg-hover-bg text-fg"
                }`}
              >
                {m.content ? (
                  m.role === "user" ? (
                    m.content
                  ) : (
                    <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-fg/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-1 bg-fg/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-1 bg-fg/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-hairline px-4 py-2.5"
        >
          {remaining < 50 && (
            <span className="text-[10px] font-medium text-fg/50 bg-hover-bg px-1.5 py-0.5 rounded-full shrink-0">
              {remaining}/50
            </span>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 text-xs bg-transparent text-fg placeholder-fg/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-1.5 text-muted hover:text-fg transition-colors disabled:opacity-30 cursor-pointer"
          >
            <PaperPlaneRight weight="thin" className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
