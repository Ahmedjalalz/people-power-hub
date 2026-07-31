import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

type ChatbotProps = { compact?: boolean; title?: string; subtitle?: string; placeholder?: string; welcomeMessage?: string };

export function Chatbot({ compact = false, title = "HR Insights Assistant", subtitle = "Ask about attrition, risk & retention", placeholder = "Ask about an employee or risk...", welcomeMessage = "Hi! I'm your HR Insights assistant. Ask me things like *\"Is Usman expected to leave soon?\"* or *\"Who is at highest risk this quarter?\"*" }: ChatbotProps) {
  const { messages, isStreaming, sendMessage } = useChat({ welcomeMessage });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  const send = () => { const trimmed = input.trim(); if (!trimmed || isStreaming) return; setInput(""); void sendMessage(trimmed); };
  return <div className={cn("flex flex-col h-full bg-card", compact ? "" : "rounded-2xl border")}>
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-pastel-lavender/50 rounded-t-2xl"><div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center"><Sparkles className="w-4 h-4 text-primary" /></div><div><div className="font-semibold text-sm">{title}</div><div className="text-xs text-muted-foreground">{subtitle}</div></div></div>
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((message) => <MessageBubble key={message.id} message={message} />)}</div>
    <div className="p-3 border-t flex gap-2"><Input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder={placeholder} className="rounded-full" disabled={isStreaming} /><Button onClick={send} size="icon" className="rounded-full shrink-0" disabled={isStreaming}><Send className="w-4 h-4" /></Button></div>
  </div>;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  if (message.role === "assistant" && message.status === "thinking") return <div className="flex gap-2 items-start"><BotAvatar /><div className="rounded-2xl rounded-tl-sm bg-pastel-lavender/40 px-4 py-3 max-w-[85%]"><div className="text-xs italic text-muted-foreground flex items-center gap-1"><span>{message.statusText}</span><span className="thinking-dot">.</span><span className="thinking-dot">.</span><span className="thinking-dot">.</span></div></div></div>;
  return <div className={cn("flex gap-2 items-start", isUser && "flex-row-reverse")}><>{!isUser && <BotAvatar />}</><div className={cn("rounded-2xl px-4 py-3 max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed", isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-pastel-lavender/40 text-foreground rounded-tl-sm")}><FormattedText text={message.content} />{message.role === "assistant" && message.status === "typing" && <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 align-middle animate-pulse" />}</div></div>;
}
function BotAvatar() { return <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center shrink-0"><Sparkles className="w-4 h-4 text-primary" /></div>; }
function FormattedText({ text }: { text: string }) { const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g); return <>{parts.map((part, index) => { if (part.startsWith("**") && part.endsWith("**")) return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>; if (part.startsWith("*") && part.endsWith("*")) return <em key={index} className="italic">{part.slice(1, -1)}</em>; return <span key={index}>{part}</span>; })}</>; }

