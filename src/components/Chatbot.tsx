import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Send,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  TableProperties,
  Mic,
  MicOff,
  X,
  LineChart as LineChartIcon,
  ExternalLink,
  History,
  Plus,
  Trash2,
  Edit2,
  Check,
  Copy,
  Square,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bot,
  User,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { employees } from "@/lib/employees";
import type { ActiveVisual, ChatMessage } from "@/types/chat";
import { groupSessionsByDate, type ChatSession } from "@/lib/chat-storage";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { parseVisualData, analyzeDataStructure } from "@/lib/visual-extractor";

const chartTooltip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 };

// ── Web Speech API type declaration ──────────────────────────────────────────
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: { isFinal: boolean; [alt: number]: { transcript: string } };
  };
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

type VoiceState = "idle" | "listening" | "processing";

function useVoiceInput(onTranscript: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isIntentionallyStopped = useRef(false);
  const isListeningRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  useEffect(() => {
    return () => {
      isIntentionallyStopped.current = true;
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop recognition on unmount", e);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    setErrorMessage(null);

    if (recognitionRef.current) {
      isIntentionallyStopped.current = true;
      recognitionRef.current.onstart = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop previous recognition", e);
      }
      recognitionRef.current = null;
    }

    isIntentionallyStopped.current = false;
    isListeningRef.current = true;

    const recognition: ISpeechRecognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setVoiceState("listening");
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      onTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event);
      const error = event?.error as string | undefined;

      if (["not-allowed", "service-not-allowed", "audio-capture", "aborted"].includes(error || "")) {
        isIntentionallyStopped.current = true;
        isListeningRef.current = false;
        setErrorMessage("Microphone access was blocked or unavailable.");
        setVoiceState("idle");
        return;
      }

      if (error === "no-speech") {
        setVoiceState("listening");
        return;
      }

      isListeningRef.current = false;
      setErrorMessage("Voice input stopped unexpectedly. Please try again.");
      setVoiceState("idle");
    };

    recognition.onend = () => {
      if (isIntentionallyStopped.current || !isListeningRef.current) {
        isListeningRef.current = false;
        setVoiceState("idle");
        return;
      }

      setVoiceState("listening");
      window.setTimeout(() => {
        if (recognitionRef.current === recognition && !isIntentionallyStopped.current) {
          try {
            recognition.start();
          } catch (err) {
            console.error("Failed to restart speech recognition:", err);
            isListeningRef.current = false;
            setVoiceState("idle");
          }
        }
      }, 120);
    };

    recognitionRef.current = recognition;

    if (!window.isSecureContext) {
      setErrorMessage("Use localhost or HTTPS for voice input.");
      setVoiceState("idle");
      return;
    }

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          try {
            recognition.start();
          } catch (err) {
            console.error("Failed to start speech recognition:", err);
            isListeningRef.current = false;
            setErrorMessage("Voice input could not be started.");
            setVoiceState("idle");
          }
        })
        .catch((err) => {
          console.error("Microphone permission denied:", err);
          isIntentionallyStopped.current = true;
          isListeningRef.current = false;
          setErrorMessage("Please allow microphone access in your browser.");
          setVoiceState("idle");
        });
      return;
    }

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      isListeningRef.current = false;
      setErrorMessage("Voice input could not be started.");
      setVoiceState("idle");
    }
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    isIntentionallyStopped.current = true;
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onstart = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop recognition", e);
      }
      recognitionRef.current = null;
    }
    setVoiceState("idle");
  }, []);

  const toggleListening = useCallback(() => {
    if (voiceState === "listening") {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  return { voiceState, isSupported, toggleListening, stopListening, errorMessage };
}

function VoiceWaveBars() {
  return (
    <div className="flex items-center gap-[3px] px-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="voice-bar" />
      ))}
    </div>
  );
}

type ChatbotProps = {
  compact?: boolean;
  autoFocus?: boolean;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  welcomeMessage?: string;
  onClose?: () => void;
  activeVisual?: ActiveVisual | null;
  onActiveVisualChange?: (visual: ActiveVisual | null) => void;
  isExternalVisualOpen?: boolean;
};

export function Chatbot({
  compact = false,
  autoFocus = false,
  title = "HR Insights Assistant",
  subtitle = "Ask about attrition, risk & retention",
  placeholder = "Ask about an employee, ranking, or risk...",
  welcomeMessage = "Hi! I'm your HR Insights assistant. Ask me things like *\"who are the top 10 performers this month?\"*, *\"Why was Usman Ali flagged?\"*, or *\"What are today's critical cases?\"*",
  onClose,
  activeVisual,
  onActiveVisualChange,
  isExternalVisualOpen = false,
}: ChatbotProps) {
  const {
    sessions,
    currentSessionId,
    activeSession,
    messages,
    isStreaming,
    statusText,
    sendMessage,
    cancelGeneration,
    editAndResend,
    startNewChat,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,
    injectMockMessage,
  } = useChat({ welcomeMessage });

  const [input, setInput] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestVisualRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // When a new assistant message arrives with visualization, automatically open on stage
  useEffect(() => {
    if (!onActiveVisualChange) return;
    const lastVisualMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && (m.visualization || m.visual) && m.status === "done");
    if (lastVisualMessage && lastVisualMessage.id !== latestVisualRef.current) {
      latestVisualRef.current = lastVisualMessage.id;
      onActiveVisualChange({
        id: lastVisualMessage.id,
        type: lastVisualMessage.chartType ?? lastVisualMessage.visual ?? "bar",
        data: lastVisualMessage.chartData,
        reason: lastVisualMessage.visualizationReason,
        url: lastVisualMessage.chartUrl,
      });
    }
  }, [messages, onActiveVisualChange]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    void sendMessage(trimmed);
  };

  // Voice input
  const handleTranscript = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const { voiceState, isSupported, toggleListening, stopListening, errorMessage } =
    useVoiceInput(handleTranscript);

  const isListening = voiceState === "listening";

  // Filtered session history groups
  const filteredSessions = useMemo(() => {
    if (!searchHistoryQuery.trim()) return sessions;
    const q = searchHistoryQuery.toLowerCase().trim();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, searchHistoryQuery]);

  const sessionGroups = useMemo(() => {
    return groupSessionsByDate(filteredSessions);
  }, [filteredSessions]);

  const handleStartRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(s.id);
    setRenameInput(s.title);
  };

  const handleSaveRename = (sessionId: string) => {
    renameSession(sessionId, renameInput);
    setRenamingId(null);
  };

  return (
    <div className={cn("flex h-full bg-card overflow-hidden relative", compact ? "" : "rounded-2xl border shadow-sm")}>
      {/* ── Collapsible Chat History Side Panel ── */}
      {isHistoryOpen && (
        <aside
          className={cn(
            "z-30 flex flex-col border-r border-border bg-card/98 backdrop-blur-md transition-all duration-300",
            compact || isExternalVisualOpen
              ? "absolute inset-y-0 left-0 w-72 shadow-2xl"
              : "w-64 md:w-72 shrink-0 relative"
          )}
        >
          {/* History Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <span className="font-semibold text-xs text-foreground">Chat History</span>
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                {sessions.length}
              </span>
            </div>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close history panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* New Chat Button & Search */}
          <div className="p-3 border-b border-border space-y-2">
            <Button
              onClick={() => {
                startNewChat();
                if (compact) setIsHistoryOpen(false);
              }}
              size="sm"
              className="w-full gap-2 rounded-xl text-xs font-semibold shadow-xs justify-start"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </Button>

            <div className="relative">
              <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full h-8 pl-8 pr-2 text-xs rounded-xl bg-muted/40 border border-border/80 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              {searchHistoryQuery && (
                <button
                  onClick={() => setSearchHistoryQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {sessions.length === 0 ? (
              <div className="py-10 px-4 text-center text-muted-foreground">
                <MessageSquare className="h-7 w-7 mx-auto opacity-30 mb-2" />
                <div className="text-xs font-medium">No previous chats</div>
                <p className="text-[11px] opacity-70 mt-1">Start asking questions to build your history.</p>
              </div>
            ) : sessionGroups.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No conversations match "{searchHistoryQuery}".
              </div>
            ) : (
              sessionGroups.map((group) => (
                <div key={group.groupName} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {group.groupName}
                  </div>

                  <div className="space-y-0.5">
                    {group.sessions.map((s) => {
                      const isActive = s.id === currentSessionId;
                      const isRenaming = renamingId === s.id;

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            if (!isRenaming) {
                              switchSession(s.id);
                              if (compact) setIsHistoryOpen(false);
                            }
                          }}
                          className={cn(
                            "group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-all cursor-pointer",
                            isActive
                              ? "bg-primary/10 text-primary font-medium shadow-2xs border border-primary/20"
                              : "text-foreground/80 hover:bg-muted/70 hover:text-foreground border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                            <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            {isRenaming ? (
                              <input
                                autoFocus
                                value={renameInput}
                                onChange={(e) => setRenameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveRename(s.id);
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                onBlur={() => handleSaveRename(s.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-background border border-primary rounded px-1 text-xs text-foreground focus:outline-none"
                              />
                            ) : (
                              <span className="truncate leading-snug">{s.title || "Conversation"}</span>
                            )}
                          </div>

                          {!isRenaming && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={(e) => handleStartRename(s, e)}
                                className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                                title="Rename chat"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(s.id);
                                }}
                                className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
                                title="Delete chat"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* History Footer */}
          {sessions.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{sessions.length} conversation{sessions.length === 1 ? "" : "s"}</span>
              <button
                onClick={() => {
                  if (confirm("Clear all saved chat conversations?")) {
                    clearAllSessions();
                  }
                }}
                className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete all chat history"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear all</span>
              </button>
            </div>
          )}
        </aside>
      )}

      {/* ── Main Chat Area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* ── Header ── */}
        <div className="flex flex-col border-b border-border bg-pastel-lavender/40 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              {/* History Toggle Button */}
              <button
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl border text-muted-foreground transition-colors cursor-pointer",
                  isHistoryOpen
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "border-border/80 bg-background/80 hover:bg-muted hover:text-foreground shadow-2xs"
                )}
                aria-label="Toggle chat history"
                title={isHistoryOpen ? "Hide history" : "Show chat history"}
              >
                {isHistoryOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </button>

              <div className="w-8 h-8 rounded-xl bg-primary/15 grid place-items-center text-primary shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate flex items-center gap-2">
                  <span>{activeSession ? activeSession.title : title}</span>
                  {activeSession && (
                    <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.2 hidden sm:inline">
                      Saved Chat
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                className="h-8 gap-1 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer hidden sm:flex"
                title="Start a new chat session"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Chat</span>
              </Button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl grid place-items-center text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Close chat"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Mock Visuals Ribbon */}
          <div className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Test Visuals:
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6.5 text-[11px] rounded-full border-border/80 bg-background/70 hover:bg-muted"
              onClick={() => injectMockMessage("bar")}
            >
              <BarChart3 className="w-3 h-3 mr-1 text-primary" /> Bar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6.5 text-[11px] rounded-full border-border/80 bg-background/70 hover:bg-muted"
              onClick={() => injectMockMessage("pie")}
            >
              <PieChartIcon className="w-3 h-3 mr-1 text-primary" /> Pie
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6.5 text-[11px] rounded-full border-border/80 bg-background/70 hover:bg-muted"
              onClick={() => injectMockMessage("area")}
            >
              <Activity className="w-3 h-3 mr-1 text-primary" /> Area
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6.5 text-[11px] rounded-full border-border/80 bg-background/70 hover:bg-muted"
              onClick={() => injectMockMessage("table")}
            >
              <TableProperties className="w-3 h-3 mr-1 text-primary" /> Table
            </Button>
          </div>
        </div>

        {/* ── Messages Scroll Area ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isEditing={editingMessageId === message.id}
              isStreaming={isStreaming}
              onStartEdit={() => setEditingMessageId(message.id)}
              onCancelEdit={() => setEditingMessageId(null)}
              onSaveEdit={(newContent) => {
                setEditingMessageId(null);
                editAndResend(message.id, newContent);
              }}
              onCancelGeneration={cancelGeneration}
              isExternalVisualOpen={isExternalVisualOpen}
              isActiveVisualOnStage={activeVisual?.id === message.id}
              onSelectVisual={() => {
                onActiveVisualChange?.({
                  id: message.id,
                  type: message.chartType ?? message.visual ?? "bar",
                  data: message.chartData,
                  reason: message.visualizationReason,
                  url: message.chartUrl,
                });
              }}
            />
          ))}
        </div>

        {/* ── Input Bar ── */}
        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-xs">
          {/* Listening state — wave bar replaces text input */}
          {isListening ? (
            <div className="flex items-center gap-2 rounded-2xl border bg-primary/5 border-primary/30 px-3 py-2 transition-all">
              <div className="relative shrink-0 flex items-center justify-center w-8 h-8">
                <span className="mic-ring absolute inset-0 rounded-full bg-primary/25" />
                <div className="relative z-10 w-8 h-8 rounded-full bg-primary grid place-items-center">
                  <Mic className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>

              <div className="flex-1 flex items-center">
                <VoiceWaveBars />
                <span className="text-xs text-primary font-medium ml-1">Listening…</span>
              </div>

              <button
                onClick={stopListening}
                className="shrink-0 w-7 h-7 rounded-full bg-muted/70 grid place-items-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Cancel voice input"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const trimmed = input.trim();
                  if (!trimmed) return;
                  stopListening();
                  send();
                }}
                className="shrink-0 w-7 h-7 rounded-full bg-primary grid place-items-center text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                aria-label="Send voice message"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={placeholder}
                  className="rounded-2xl pr-10 text-xs h-10 shadow-2xs border-border/80"
                  disabled={isStreaming}
                />
              </div>

              {/* Mic button */}
              {isSupported && !isStreaming && (
                <Button
                  onClick={toggleListening}
                  size="icon"
                  variant="outline"
                  className={cn(
                    "rounded-2xl shrink-0 transition-all duration-200 h-10 w-10 border-border/80 hover:bg-primary/10 hover:border-primary/50 text-muted-foreground hover:text-primary cursor-pointer"
                  )}
                  aria-label="Voice input"
                  title="Speak prompt"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              )}

              {/* Send or Stop Button */}
              {isStreaming ? (
                <Button
                  onClick={cancelGeneration}
                  variant="destructive"
                  size="sm"
                  className="rounded-2xl shrink-0 h-10 px-3.5 gap-1.5 text-xs font-semibold shadow-xs cursor-pointer animate-in fade-in"
                  title="Stop generating response"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  onClick={send}
                  size="icon"
                  className="rounded-2xl shrink-0 h-10 w-10 shadow-xs cursor-pointer"
                  disabled={!input.trim()}
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {!isSupported && (
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <MicOff className="w-3 h-3" /> Voice input not supported in this browser.
            </p>
          )}

          {errorMessage && (
            <p className="mt-1.5 text-center text-[10px] text-destructive flex items-center justify-center gap-1">
              <MicOff className="w-3 h-3" /> {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Individual Message Bubble ────────────────────────────────────────────────

function MessageBubble({
  message,
  isEditing,
  isStreaming,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onCancelGeneration,
  isExternalVisualOpen = false,
  isActiveVisualOnStage = false,
  onSelectVisual,
}: {
  message: ChatMessage;
  isEditing: boolean;
  isStreaming: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (newContent: string) => void;
  onCancelGeneration: () => void;
  isExternalVisualOpen?: boolean;
  isActiveVisualOnStage?: boolean;
  onSelectVisual?: () => void;
}) {
  const isUser = message.role === "user";
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditText(message.content);
  }, [message.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Thinking / Waiting State
  if (message.role === "assistant" && message.status === "thinking") {
    return (
      <div className="flex gap-2.5 items-start animate-in fade-in-0 duration-200">
        <BotAvatar />
        <div className="rounded-2xl rounded-tl-sm bg-pastel-lavender/40 px-4 py-3 max-w-[85%] border border-border/40 shadow-2xs">
          <div className="text-xs text-muted-foreground flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 italic">
              <span>{message.statusText || "Analyzing HR workforce data..."}</span>
              <span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
            </div>
            <button
              onClick={onCancelGeneration}
              className="not-italic text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              title="Cancel response"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasVisual = Boolean(message.visualization || message.visual);
  const visualType = message.chartType ?? message.visual ?? "bar";

  return (
    <div className={cn("group flex gap-2.5 items-start", isUser && "flex-row-reverse")}>
      {!isUser && <BotAvatar />}

      <div className={cn("relative flex flex-col", isUser ? "items-end max-w-[88%]" : "items-start max-w-[92%] w-full")}>
        {/* Message Bubble Card */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all shadow-2xs",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-pastel-lavender/35 text-foreground rounded-tl-sm w-full border border-border/40"
          )}
        >
          {/* User Inline Editing Form */}
          {isUser && isEditing ? (
            <div className="space-y-2.5 min-w-[260px] text-foreground">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (editText.trim()) onSaveEdit(editText);
                  } else if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
                className="w-full text-xs p-2.5 rounded-xl bg-background text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] resize-none leading-relaxed"
                autoFocus
              />
              <div className="flex justify-end items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelEdit}
                  className="h-7 px-2.5 text-xs text-primary-foreground/90 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => editText.trim() && onSaveEdit(editText)}
                  disabled={!editText.trim() || isStreaming}
                  className="h-7 px-3 text-xs bg-background text-foreground hover:bg-background/90 shadow-2xs"
                >
                  Save & Submit
                </Button>
              </div>
            </div>
          ) : (
            <FormattedText text={message.content} />
          )}

          {/* Visualization preview / stage link */}
          {hasVisual && (
            <div className="mt-3.5">
              {isExternalVisualOpen ? (
                <div className="p-3 rounded-xl border border-primary/25 bg-background/90 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                        <BarChart3 className="w-3.5 h-3.5 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {message.visualizationReason || "Data Visualization"}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize">
                          {visualType} view rendered on canvas
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isActiveVisualOnStage ? "default" : "outline"}
                      onClick={onSelectVisual}
                      className="h-7 text-xs rounded-lg shrink-0 gap-1"
                    >
                      <span>{isActiveVisualOnStage ? "Viewing" : "Focus on Stage"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-border bg-card/90 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-primary/10 grid place-items-center text-primary">
                        <BarChart3 className="w-3 h-3" />
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {message.visualizationReason || "Data Visualization"}
                      </span>
                    </div>

                    {onSelectVisual && (
                      <button
                        onClick={onSelectVisual}
                        className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Expand</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <InlineVisualView
                    visualType={visualType}
                    chartData={message.chartData}
                    chartUrl={message.chartUrl}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar Below Message (Copy, Edit) */}
        {!isEditing && (
          <div
            className={cn(
              "flex items-center gap-1.5 mt-1 px-1 text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {isUser ? (
              <>
                <button
                  onClick={onStartEdit}
                  disabled={isStreaming}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Edit prompt"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Copy prompt"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
            <span className="text-[10px] opacity-60">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline Visual Renderer ──────────────────────────────────────────────────

function InlineVisualView({
  visualType,
  chartData,
  chartUrl,
}: {
  visualType: string;
  chartData: unknown;
  chartUrl?: string | null;
}) {
  const parsedData = parseVisualData(chartData);

  if (chartUrl) {
    return (
      <div className="rounded-lg overflow-hidden border border-border bg-background/50">
        <img src={chartUrl} alt="Chart visual" className="w-full h-44 object-contain" />
      </div>
    );
  }

  if (!parsedData || parsedData.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground italic">
        Visual data loaded
      </div>
    );
  }

  const { categoryKey, metricKeys } = analyzeDataStructure(parsedData);
  const primaryMetric = metricKeys[0] || "value";
  const colors = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"];

  if (visualType === "pie") {
    return (
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={parsedData}
              dataKey={primaryMetric}
              nameKey={categoryKey}
              cx="50%"
              cy="50%"
              outerRadius={60}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {parsedData.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (visualType === "area" || visualType === "line") {
    return (
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={parsedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey={categoryKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={chartTooltip} />
            <Area type="monotone" dataKey={primaryMetric} stroke="#0d9488" fill="#0d9488" fillOpacity={0.25} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (visualType === "table") {
    const keys = Object.keys(parsedData[0] || {});
    return (
      <div className="max-h-48 overflow-auto rounded-lg border border-border bg-background text-xs">
        <table className="w-full text-left">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground sticky top-0">
            <tr>
              {keys.map((k) => (
                <th key={k} className="p-2 font-semibold">{k.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {parsedData.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30">
                {keys.map((k) => (
                  <td key={k} className="p-2">{String(row[k] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Default Bar Chart
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={parsedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey={categoryKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={chartTooltip} />
          <Bar dataKey={primaryMetric} fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Bot Avatar ───────────────────────────────────────────────────────────────

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-xl bg-primary/20 text-primary grid place-items-center shrink-0 shadow-2xs mt-0.5">
      <Sparkles className="w-3.5 h-3.5" />
    </div>
  );
}

// ─── Markdown / Text Formatter with Clickable Employee Links ─────────────────

function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1.5" />;

        // Numbered list
        const numberedMatch = line.match(/^(\d+\.)\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-2 items-start pl-1">
              <span className="font-semibold text-primary shrink-0">{numberedMatch[1]}</span>
              <span className="flex-1"><InlineMarkdown text={numberedMatch[2]} /></span>
            </div>
          );
        }

        // Bullet point
        const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex gap-2 items-start pl-1">
              <span className="text-primary shrink-0">•</span>
              <span className="flex-1"><InlineMarkdown text={bulletMatch[1]} /></span>
            </div>
          );
        }

        return (
          <div key={idx} className="leading-relaxed">
            <InlineMarkdown text={line} />
          </div>
        );
      })}
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  // Parse bold **text** and match with employees
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const content = part.slice(2, -2);
          const matchedEmp = employees.find(
            (e) => e.name.toLowerCase() === content.toLowerCase().trim()
          );

          if (matchedEmp) {
            return (
              <Link
                key={i}
                to="/employee/$employeeId"
                params={{ employeeId: matchedEmp.id }}
                className="font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity inline-flex items-center gap-0.5"
              >
                <span>{content}</span>
                <ExternalLink className="w-2.5 h-2.5 inline opacity-70" />
              </Link>
            );
          }
          return <strong key={i} className="font-semibold">{content}</strong>;
        }

        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
