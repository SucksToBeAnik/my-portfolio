"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatCircleDots, PaperPlaneRight, X } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

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

export function ChatPopup({ open, onClose }: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number>(50);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setMessages([]);
      const val = getCookie("query_remaining");
      if (val) {
        const n = parseInt(val, 10);
        if (!isNaN(n)) setRemaining(n);
      }
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
            { role: "assistant", content: body.error || "You've reached your daily limit. Come back tomorrow!" },
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
        let streamOk = true;

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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-bg/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] mx-4 bg-bg border border-hairline rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[520px]"
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
                  m.role === "user" ? "bg-fg text-bg" : "bg-hover-bg text-fg"
                }`}
              >
                {m.content ? (
                  m.role === "user" ? (
                    m.content
                  ) : (
                    <div className="prose prose-invert prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:bg-fg/5 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:text-fg [&_code]:text-[10px] [&_strong]:text-fg [&_a]:text-fg/70 [&_a]:underline [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:text-fg/80 [&_p]:text-fg/80 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{m.content}</ReactMarkdown>
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

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-hairline px-4 py-2.5">
          {remaining < 50 && (
            <span className="text-[10px] text-muted shrink-0">{remaining}/50</span>
          )}
          <input
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
