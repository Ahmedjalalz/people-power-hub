import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { pickReply } from "@/lib/chatbot-data";

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  thinking?: string;
  status: "thinking" | "typing" | "done";
  visibleWords?: number;
};

const WORD_INTERVAL_MS = 60;
const THINKING_MS = 1400;

export function Chatbot({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I'm your HR Insights assistant. Ask me things like *\"Is Usman expected to leave soon?\"* or *\"Who is at highest risk this quarter?\"*",
      status: "done",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: trimmed, status: "done" };
    const reply = pickReply(trimmed);
    const botId = crypto.randomUUID();
    const botMsg: Message = {
      id: botId,
      role: "bot",
      text: reply.answer,
      thinking: reply.thinking,
      status: "thinking",
      visibleWords: 0,
    };
    setMessages((m) => [...m, userMsg, botMsg]);
    setInput("");

    const words = reply.answer.split(/(\s+)/);

    timers.current.push(
      setTimeout(() => {
        setMessages((m) => m.map((x) => (x.id === botId ? { ...x, status: "typing", visibleWords: 0 } : x)));
        let i = 0;
        const step = () => {
          i += 2; // move by a word + whitespace token
          setMessages((m) =>
            m.map((x) => (x.id === botId ? { ...x, visibleWords: Math.min(i, words.length) } : x)),
          );
          if (i < words.length) {
            timers.current.push(setTimeout(step, WORD_INTERVAL_MS));
          } else {
            setMessages((m) => m.map((x) => (x.id === botId ? { ...x, status: "done" } : x)));
          }
        };
        timers.current.push(setTimeout(step, WORD_INTERVAL_MS));
      }, THINKING_MS),
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-card", compact ? "" : "rounded-2xl border")}>
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-pastel-lavender/50 rounded-t-2xl">
        <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-sm">HR Insights Assistant</div>
          <div className="text-xs text-muted-foreground">Ask about attrition, risk & retention</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about an employee or risk..."
          className="rounded-full"
        />
        <Button onClick={send} size="icon" className="rounded-full shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (message.role === "bot" && message.status === "thinking") {
    return (
      <div className="flex gap-2 items-start">
        <BotAvatar />
        <div className="rounded-2xl rounded-tl-sm bg-pastel-lavender/40 px-4 py-3 max-w-[85%]">
          <div className="text-xs italic text-muted-foreground flex items-center gap-1">
            <span>{message.thinking}</span>
            <span className="thinking-dot">.</span>
            <span className="thinking-dot">.</span>
            <span className="thinking-dot">.</span>
          </div>
        </div>
      </div>
    );
  }

  const words = message.text.split(/(\s+)/);
  const shown =
    message.role === "bot" && message.status === "typing"
      ? words.slice(0, message.visibleWords ?? 0).join("")
      : message.text;

  return (
    <div className={cn("flex gap-2 items-start", isUser && "flex-row-reverse")}>
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-pastel-lavender/40 text-foreground rounded-tl-sm",
        )}
      >
        <FormattedText text={shown} />
        {message.role === "bot" && message.status === "typing" && (
          <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center shrink-0">
      <Sparkles className="w-4 h-4 text-primary" />
    </div>
  );
}

// Minimal markdown-ish: **bold** and *italic*
function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <strong key={i} className="font-semibold">
              {p.slice(2, -2)}
            </strong>
          );
        if (p.startsWith("*") && p.endsWith("*"))
          return (
            <em key={i} className="italic">
              {p.slice(1, -1)}
            </em>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
