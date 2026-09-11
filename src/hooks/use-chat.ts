import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/services/chat";
import type { ChatMetadata, ChatMessage } from "@/types/chat";
import { extractVisualDataFromResponse } from "@/lib/visual-extractor";
import {
  type ChatSession,
  loadStoredSessions,
  saveStoredSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  generateSessionTitle,
} from "@/lib/chat-storage";

type UseChatOptions = { welcomeMessage: string };
const FRIENDLY_ERROR = "Sorry, I couldn't reach the assistant right now. Please try again in a moment.";
const createId = () => crypto.randomUUID();
const createWelcomeMessage = (content: string): ChatMessage => ({
  id: "welcome",
  role: "assistant",
  content,
  timestamp: Date.now(),
  status: "done",
});

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
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadStoredSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const savedActive = loadActiveSessionId();
    const stored = loadStoredSessions();
    if (savedActive && stored.some((s) => s.id === savedActive)) {
      return savedActive;
    }
    return stored.length > 0 ? stored[0].id : null;
  });

  const activeSession = sessions.find((s) => s.id === currentSessionId) ?? null;

  const [threadId, setThreadId] = useState<string | null>(() => activeSession?.threadId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (activeSession && activeSession.messages.length > 0) {
      return activeSession.messages;
    }
    return [createWelcomeMessage(welcomeMessage)];
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ChatMetadata | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync session changes from other tabs or windows
  useEffect(() => {
    function handleStorageUpdate() {
      const reloaded = loadStoredSessions();
      setSessions(reloaded);
    }
    window.addEventListener("chat-sessions-updated", handleStorageUpdate);
    return () => window.removeEventListener("chat-sessions-updated", handleStorageUpdate);
  }, []);

  // Sync activeSessionId to storage
  useEffect(() => {
    saveActiveSessionId(currentSessionId);
  }, [currentSessionId]);

  // Clean up in-flight requests on unmount
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // Helper to persist updated messages to state and localStorage
  const persistSessionMessages = useCallback(
    (sessionId: string, newMessages: ChatMessage[], newThreadId?: string, overrideTitle?: string) => {
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === sessionId);
        if (index === -1) return prev;
        const target = prev[index];
        const updated: ChatSession = {
          ...target,
          messages: newMessages,
          threadId: newThreadId ?? target.threadId,
          title: overrideTitle ?? target.title,
          updatedAt: Date.now(),
        };
        const next = [...prev];
        next[index] = updated;
        saveStoredSessions(next);
        return next;
      });
    },
    []
  );

  // 1. Cancel in-flight generation
  const cancelGeneration = useCallback(() => {
    if (!abortControllerRef.current) return;
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setStatusText(null);

    setMessages((current) => {
      const updated = current.map((item) => {
        if (item.status === "thinking") {
          return {
            ...item,
            status: "done" as const,
            statusText: undefined,
            content: item.content || "Response generation was stopped.",
          };
        }
        return item;
      });
      if (currentSessionId) {
        persistSessionMessages(currentSessionId, updated);
      }
      return updated;
    });
  }, [currentSessionId, persistSessionMessages]);

  // 2. Start new chat
  const startNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCurrentSessionId(null);
    setThreadId(null);
    setMessages([createWelcomeMessage(welcomeMessage)]);
    setIsStreaming(false);
    setStatusText(null);
    setMetadata(null);
  }, [welcomeMessage]);

  // 3. Switch to existing session
  const switchSession = useCallback(
    (sessionId: string) => {
      if (sessionId === currentSessionId) return;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
      setStatusText(null);

      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSessionId(session.id);
        setThreadId(session.threadId || null);
        setMessages(session.messages.length > 0 ? session.messages : [createWelcomeMessage(welcomeMessage)]);
      }
    },
    [currentSessionId, sessions, welcomeMessage]
  );

  // 4. Delete session
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        saveStoredSessions(next);
        return next;
      });

      if (currentSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          switchSession(remaining[0].id);
        } else {
          startNewChat();
        }
      }
    },
    [currentSessionId, sessions, startNewChat, switchSession]
  );

  // 5. Rename session
  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s));
      saveStoredSessions(next);
      return next;
    });
  }, []);

  // 6. Clear all sessions
  const clearAllSessions = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSessions([]);
    saveStoredSessions([]);
    startNewChat();
  }, [startNewChat]);

  // 7. Send message
  const sendMessage = useCallback(
    async (content: string) => {
      const message = content.trim();
      if (!message || isStreaming) return;

      let sessionId = currentSessionId;
      let activeThreadId = threadId;

      // If no session is active, create one now!
      if (!sessionId) {
        sessionId = createId();
        activeThreadId = createId();
        const newSession: ChatSession = {
          id: sessionId,
          title: generateSessionTitle(message),
          threadId: activeThreadId,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSessions((prev) => {
          const next = [newSession, ...prev];
          saveStoredSessions(next);
          return next;
        });
        setCurrentSessionId(sessionId);
        setThreadId(activeThreadId);
      } else if (!activeThreadId) {
        activeThreadId = createId();
        setThreadId(activeThreadId);
      }

      const userMessageId = createId();
      const assistantMessageId = createId();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsStreaming(true);
      setStatusText("Analyzing HR workforce data...");

      const userMsg: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: message,
        timestamp: Date.now(),
        status: "done",
      };

      const initialAssistantMsg: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        status: "thinking",
        statusText: "Analyzing HR workforce data...",
      };

      setMessages((current) => {
        // Exclude standalone welcome message if this is the first turn
        const baseMessages = current.filter((m) => m.id !== "welcome");
        const next = [...baseMessages, userMsg, initialAssistantMsg];
        if (sessionId) {
          persistSessionMessages(sessionId, next, activeThreadId);
        }
        return next;
      });

      const updateAssistant = (update: Partial<ChatMessage>) => {
        setMessages((current) => {
          const next = current.map((item) =>
            item.id === assistantMessageId ? { ...item, ...update } : item
          );
          if (sessionId) {
            persistSessionMessages(sessionId, next, activeThreadId);
          }
          return next;
        });
      };

      try {
        const res = await sendChatMessage({
          message,
          threadId: activeThreadId,
          signal: controller.signal,
        });

        if (res.thread_id) {
          activeThreadId = res.thread_id;
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

        const visualInfo = extractVisualDataFromResponse(
          res.reply || "",
          res.chart_data,
          res.chart_type,
          res.visualization_reason
        );

        updateAssistant({
          content: res.reply || "",
          status: "done",
          statusText: undefined,
          visualization: visualInfo.visualization,
          chartType: visualInfo.chartType,
          chartData: visualInfo.chartData,
          chartUrl: res.chart_url ?? null,
          visualizationReason: visualInfo.visualizationReason,
        });
      } catch (err: any) {
        if (controller.signal.aborted) {
          updateAssistant({
            content: "Response generation was stopped.",
            status: "done",
            statusText: undefined,
          });
        } else {
          updateAssistant({
            content: FRIENDLY_ERROR,
            status: "done",
            statusText: undefined,
          });
        }
      } finally {
        if (abortControllerRef.current === controller) abortControllerRef.current = null;
        setIsStreaming(false);
        setStatusText(null);
      }
    },
    [currentSessionId, isStreaming, persistSessionMessages, threadId]
  );

  // 8. Edit previous user message and re-send
  const editAndResend = useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      let targetIndex = -1;
      setMessages((current) => {
        targetIndex = current.findIndex((m) => m.id === messageId);
        return current;
      });

      // Find the message index in state
      const currentIndex = messages.findIndex((m) => m.id === messageId);
      if (currentIndex === -1) return;

      // Slice messages up to the message to edit (excluding everything after)
      const priorMessages = messages.slice(0, currentIndex);
      const updatedUserMessage: ChatMessage = {
        ...messages[currentIndex],
        content: trimmed,
        timestamp: Date.now(),
      };

      const assistantMessageId = createId();
      const initialAssistantMsg: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        status: "thinking",
        statusText: "Analyzing HR workforce data...",
      };

      const nextMessages = [...priorMessages, updatedUserMessage, initialAssistantMsg];
      setMessages(nextMessages);

      const sessionId = currentSessionId || createId();
      let activeThreadId = threadId || createId();

      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
        setThreadId(activeThreadId);
        const newSession: ChatSession = {
          id: sessionId,
          title: generateSessionTitle(trimmed),
          threadId: activeThreadId,
          messages: nextMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSessions((prev) => {
          const next = [newSession, ...prev];
          saveStoredSessions(next);
          return next;
        });
      } else {
        persistSessionMessages(sessionId, nextMessages, activeThreadId);
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);
      setStatusText("Analyzing HR workforce data...");

      const updateAssistant = (update: Partial<ChatMessage>) => {
        setMessages((current) => {
          const next = current.map((item) =>
            item.id === assistantMessageId ? { ...item, ...update } : item
          );
          if (sessionId) {
            persistSessionMessages(sessionId, next, activeThreadId);
          }
          return next;
        });
      };

      try {
        const res = await sendChatMessage({
          message: trimmed,
          threadId: activeThreadId,
          signal: controller.signal,
        });

        if (res.thread_id) {
          activeThreadId = res.thread_id;
          setThreadId(res.thread_id);
        }

        const visualInfo = extractVisualDataFromResponse(
          res.reply || "",
          res.chart_data,
          res.chart_type,
          res.visualization_reason
        );

        updateAssistant({
          content: res.reply || "",
          status: "done",
          statusText: undefined,
          visualization: visualInfo.visualization,
          chartType: visualInfo.chartType,
          chartData: visualInfo.chartData,
          chartUrl: res.chart_url ?? null,
          visualizationReason: visualInfo.visualizationReason,
        });
      } catch {
        if (controller.signal.aborted) {
          updateAssistant({
            content: "Response generation was stopped.",
            status: "done",
            statusText: undefined,
          });
        } else {
          updateAssistant({
            content: FRIENDLY_ERROR,
            status: "done",
            statusText: undefined,
          });
        }
      } finally {
        if (abortControllerRef.current === controller) abortControllerRef.current = null;
        setIsStreaming(false);
        setStatusText(null);
      }
    },
    [currentSessionId, messages, persistSessionMessages, threadId]
  );

  // 9. Mock message helper
  const injectMockMessage = useCallback(
    (visualType: "bar" | "pie" | "area" | "table") => {
      const mock = MOCK_DATA[visualType];
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = createId();
        setCurrentSessionId(sessionId);
        const newSession: ChatSession = {
          id: sessionId,
          title: `Mock ${visualType.toUpperCase()} Visual`,
          threadId: createId(),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
      }

      const userMsg: ChatMessage = {
        id: createId(),
        role: "user",
        content: `Show me the ${visualType} visualization.`,
        timestamp: Date.now(),
        status: "done",
      };

      const assistantMsg: ChatMessage = {
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
      };

      setMessages((current) => {
        const base = current.filter((m) => m.id !== "welcome");
        const next = [...base, userMsg, assistantMsg];
        if (sessionId) {
          persistSessionMessages(sessionId, next);
        }
        return next;
      });
    },
    [currentSessionId, persistSessionMessages]
  );

  return {
    sessions,
    currentSessionId,
    activeSession,
    threadId,
    messages,
    isStreaming,
    statusText,
    metadata,
    sendMessage,
    cancelGeneration,
    editAndResend,
    startNewChat,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,
    injectMockMessage,
  };
}
