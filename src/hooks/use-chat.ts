import { useCallback, useEffect, useRef, useState } from "react";
import { streamChat } from "@/services/chat";
import type { ChatMessage, ChatMetadata } from "@/types/chat";

type UseChatOptions = { welcomeMessage: string };
const FRIENDLY_ERROR = "Sorry, I couldn't reach the assistant right now. Please try again in a moment.";
const createId = () => crypto.randomUUID();
const createWelcomeMessage = (content: string): ChatMessage => ({ id: "welcome", role: "assistant", content, timestamp: Date.now(), status: "done" });

export function useChat({ welcomeMessage }: UseChatOptions) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(welcomeMessage)]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ChatMetadata | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortControllerRef.current?.abort(), []);
  const startNewChat = useCallback(() => {
    abortControllerRef.current?.abort(); setThreadId(null); setMessages([createWelcomeMessage(welcomeMessage)]); setIsStreaming(false); setStatusText(null); setMetadata(null);
  }, [welcomeMessage]);
  const sendMessage = useCallback(async (content: string) => {
    const message = content.trim();
    if (!message || isStreaming) return;
    const activeThreadId = threadId ?? createId();
    const assistantMessageId = createId();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    if (!threadId) setThreadId(activeThreadId);
    setIsStreaming(true); setStatusText(null);
    setMessages((current) => [...current, { id: createId(), role: "user", content: message, timestamp: Date.now(), status: "done" }, { id: assistantMessageId, role: "assistant", content: "", timestamp: Date.now(), status: "thinking" }]);
    const updateAssistant = (update: Partial<ChatMessage>) => setMessages((current) => current.map((item) => item.id === assistantMessageId ? { ...item, ...update } : item));
    try {
      await streamChat({ message, threadId: activeThreadId, signal: controller.signal, onEvent: (event) => {
        switch (event.type) {
          case "meta": if (event.thread_id) setThreadId(event.thread_id); break;
          case "status": if (event.text) { setStatusText(event.text); updateAssistant({ status: "thinking", statusText: event.text }); } break;
          case "token": setStatusText(null); setMessages((current) => current.map((item) => item.id === assistantMessageId ? { ...item, content: `${item.content}${event.text ?? ""}`, status: "typing", statusText: undefined } : item)); break;
          case "done": if (event.thread_id) setThreadId(event.thread_id); setMetadata(event); updateAssistant({ status: "done", statusText: undefined }); break;
        }
      }});
      updateAssistant({ status: "done", statusText: undefined });
    } catch {
      updateAssistant({ content: controller.signal.aborted ? "The response was interrupted. Please try again." : FRIENDLY_ERROR, status: "done", statusText: undefined });
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      setIsStreaming(false); setStatusText(null);
    }
  }, [isStreaming, threadId]);
  const injectMockMessage = useCallback((visualType: "bar" | "pie" | "area" | "table") => {
    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", content: `Show me the ${visualType} visualization.`, timestamp: Date.now(), status: "done" },
      { id: createId(), role: "assistant", content: `Here is the requested ${visualType} chart:`, timestamp: Date.now(), status: "done", visual: visualType }
    ]);
  }, []);

  return { threadId, messages, isStreaming, statusText, metadata, sendMessage, startNewChat, injectMockMessage };
}
