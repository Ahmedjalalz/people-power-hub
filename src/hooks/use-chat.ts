import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/services/chat";
import type { ChatMetadata, ChatMessage } from "@/types/chat";

type UseChatOptions = { welcomeMessage: string };
const FRIENDLY_ERROR = "Sorry, I couldn't reach the assistant right now. Please try again in a moment.";
const createId = () => crypto.randomUUID();
const createWelcomeMessage = (content: string): ChatMessage => ({ id: "welcome", role: "assistant", content, timestamp: Date.now(), status: "done" });

const MOCK_DATA: Record<string, { data: unknown; reason: string }> = {
  bar: {
    data: [
      { department: "HR", employees: 45 },
      { department: "Finance", employees: 38 },
      { department: "Sales", employees: 52 },
      { department: "Engineering", employees: 64 },
      { department: "Operations", employees: 41 },
    ],
    reason: "Headcount comparison across top departments",
  },
  pie: {
    data: [
      { role: "Executive", count: 14 },
      { role: "Senior", count: 28 },
      { role: "Mid-level", count: 45 },
      { role: "Junior", count: 32 },
      { role: "Intern", count: 12 },
    ],
    reason: "Workforce breakdown by job level",
  },
  area: {
    data: [
      { month: "Jan", headcount: 410 },
      { month: "Feb", headcount: 425 },
      { month: "Mar", headcount: 440 },
      { month: "Apr", headcount: 460 },
      { month: "May", headcount: 480 },
      { month: "Jun", headcount: 510 },
    ],
    reason: "Headcount growth over the last 6 months",
  },
  table: {
    data: [
      { department: "HR", headcount: 45, budget_status: "Within Budget", score: 92 },
      { department: "Finance", headcount: 38, budget_status: "Near Limit", score: 88 },
      { department: "Sales", headcount: 52, budget_status: "Within Budget", score: 95 },
      { department: "Engineering", headcount: 64, budget_status: "Optimized", score: 91 },
      { department: "Operations", headcount: 41, budget_status: "Within Budget", score: 87 },
    ],
    reason: "Department resource & budget summary",
  },
};

export function useChat({ welcomeMessage }: UseChatOptions) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(welcomeMessage)]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ChatMetadata | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const startNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    setThreadId(null);
    setMessages([createWelcomeMessage(welcomeMessage)]);
    setIsStreaming(false);
    setStatusText(null);
    setMetadata(null);
  }, [welcomeMessage]);

  const sendMessage = useCallback(async (content: string) => {
    const message = content.trim();
    if (!message || isStreaming) return;
    const activeThreadId = threadId ?? createId();
    const assistantMessageId = createId();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    if (!threadId) setThreadId(activeThreadId);
    setIsStreaming(true);
    setStatusText("Analyzing HR workforce data...");

    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", content: message, timestamp: Date.now(), status: "done" },
      { id: assistantMessageId, role: "assistant", content: "", timestamp: Date.now(), status: "thinking", statusText: "Analyzing HR workforce data..." },
    ]);

    const updateAssistant = (update: Partial<ChatMessage>) =>
      setMessages((current) =>
        current.map((item) => (item.id === assistantMessageId ? { ...item, ...update } : item)),
      );

    try {
      const res = await sendChatMessage({
        message,
        threadId: activeThreadId,
        signal: controller.signal,
      });

      if (res.thread_id) {
        setThreadId(res.thread_id);
      }

      setMetadata({
        type: "done",
        thread_id: res.thread_id,
        selected_employee_id: res.selected_employee_id ?? undefined,
        selected_employee_name: res.selected_employee_name ?? undefined,
        last_tool_status: res.last_tool_status ?? undefined,
        elapsed_ms: res.elapsed_ms ?? undefined,
      });

      updateAssistant({
        content: res.reply || "",
        status: "done",
        statusText: undefined,
        visualization: Boolean(res.visualization),
        chartType: res.chart_type ?? null,
        chartData: res.chart_data ?? null,
        chartUrl: res.chart_url ?? null,
        visualizationReason: res.visualization_reason ?? null,
      });
    } catch {
      updateAssistant({
        content: controller.signal.aborted
          ? "The response was interrupted. Please try again."
          : FRIENDLY_ERROR,
        status: "done",
        statusText: undefined,
      });
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      setIsStreaming(false);
      setStatusText(null);
    }
  }, [isStreaming, threadId]);

  const injectMockMessage = useCallback((visualType: "bar" | "pie" | "area" | "table") => {
    const mock = MOCK_DATA[visualType];
    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", content: `Show me the ${visualType} visualization.`, timestamp: Date.now(), status: "done" },
      {
        id: createId(),
        role: "assistant",
        content: `Here is the requested ${visualType} chart:`,
        timestamp: Date.now(),
        status: "done",
        visualization: true,
        chartType: visualType === "area" ? "line" : visualType,
        chartData: mock?.data,
        visualizationReason: mock?.reason,
        visual: visualType,
      },
    ]);
  }, []);

  return { threadId, messages, isStreaming, statusText, metadata, sendMessage, startNewChat, injectMockMessage };
}
