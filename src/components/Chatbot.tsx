import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Sparkles, BarChart3, PieChart as PieChartIcon, Activity, TableProperties, Mic, MicOff, X, LineChart as LineChartIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import type { ActiveVisual, ChatMessage } from "@/types/chat";
import { Link } from "@tanstack/react-router";
import { employees } from "@/lib/employees";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { departments, jobLevelMix, headcountTrend } from "@/lib/headcount-data";

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
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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
      console.log("Speech recognition started");
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
      console.log("Speech recognition ended");
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
      navigator.mediaDevices.getUserMedia({ audio: true })
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

// ── Wave visualizer shown inside the input bar while recording ────────────────
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
  placeholder = "Ask about an employee or risk...",
  welcomeMessage = "Hi! I'm your HR Insights assistant. Ask me things like *\"Is Usman expected to leave soon?\"* or *\"Who is at highest risk this quarter?\"*",
  onClose,
  activeVisual,
  onActiveVisualChange,
  isExternalVisualOpen = false,
}: ChatbotProps) {
  const { messages, isStreaming, sendMessage, injectMockMessage } = useChat({ welcomeMessage });
  const [input, setInput] = useState("");
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
    const lastVisualMessage = [...messages].reverse().find(
      (m) => m.role === "assistant" && (m.visualization || m.visual) && m.status === "done",
    );
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

  // Voice input — transcript lands in the text box for review before sending
  const handleTranscript = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const { voiceState, isSupported, toggleListening, stopListening, errorMessage } =
    useVoiceInput(handleTranscript);

  const isListening = voiceState === "listening";

  return (
    <div className={cn("flex flex-col h-full bg-card", compact ? "" : "rounded-xl border")}>
      {/* ── Header ── */}
      <div className="flex flex-col border-b bg-pastel-lavender/50 rounded-t-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">{title}</div>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
              aria-label="Close chat"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            Mock visuals:
          </span>
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => injectMockMessage("bar")}>
            <BarChart3 className="w-3 h-3 mr-1" /> Bar
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => injectMockMessage("pie")}>
            <PieChartIcon className="w-3 h-3 mr-1" /> Pie
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => injectMockMessage("area")}>
            <Activity className="w-3 h-3 mr-1" /> Area
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => injectMockMessage("table")}>
            <TableProperties className="w-3 h-3 mr-1" /> Table
          </Button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
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

      {/* ── Input bar ── */}
      <div className="p-3 border-t">
        {/* Listening state — full-width wave bar replaces normal input */}
        {isListening ? (
          <div className="flex items-center gap-2 rounded-full border bg-primary/5 border-primary/30 px-3 py-2 transition-all">
            {/* Pulsing mic icon with ring */}
            <div className="relative shrink-0 flex items-center justify-center w-8 h-8">
              <span className="mic-ring absolute inset-0 rounded-full bg-primary/25" />
              <div className="relative z-10 w-8 h-8 rounded-full bg-primary grid place-items-center">
                <Mic className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>

            {/* Audio wave bars */}
            <div className="flex-1 flex items-center">
              <VoiceWaveBars />
              <span className="text-xs text-primary font-medium ml-1">Listening…</span>
            </div>

            {/* Cancel voice input */}
            <button
              onClick={stopListening}
              className="shrink-0 w-7 h-7 rounded-full bg-muted/70 grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Cancel voice input"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Send transcript */}
            <button
              onClick={() => {
                const trimmed = input.trim();
                if (!trimmed) return;
                stopListening();
                send();
              }}
              className="shrink-0 w-7 h-7 rounded-full bg-primary grid place-items-center text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Send voice message"
              title="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={placeholder}
                className="rounded-full pr-10"
                disabled={isStreaming}
              />
            </div>

            {/* Mic button — only shown if browser supports SpeechRecognition */}
            {isSupported && (
              <Button
                onClick={toggleListening}
                size="icon"
                variant="outline"
                className={cn(
                  "rounded-full shrink-0 transition-all duration-200",
                  "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50",
                )}
                disabled={isStreaming}
                aria-label="Voice input"
                title="Click to speak"
              >
                <Mic className="w-4 h-4" />
              </Button>
            )}

            {/* Send button */}
            <Button
              onClick={send}
              size="icon"
              className="rounded-full shrink-0"
              disabled={isStreaming || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Hint below: only shown when browser doesn't support API */}
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
  );
}

function MessageBubble({
  message,
  isExternalVisualOpen = false,
  isActiveVisualOnStage = false,
  onSelectVisual,
}: {
  message: ChatMessage;
  isExternalVisualOpen?: boolean;
  isActiveVisualOnStage?: boolean;
  onSelectVisual?: () => void;
}) {
  const isUser = message.role === "user";
  if (message.role === "assistant" && message.status === "thinking")
    return (
      <div className="flex gap-2 items-start">
        <BotAvatar />
        <div className="rounded-xl rounded-tl-sm bg-pastel-lavender/40 px-4 py-3 max-w-[85%]">
          <div className="text-xs italic text-muted-foreground flex items-center gap-1">
            <span>{message.statusText}</span>
            <span className="thinking-dot">.</span>
            <span className="thinking-dot">.</span>
            <span className="thinking-dot">.</span>
          </div>
        </div>
      </div>
    );

  const hasVisual = Boolean(message.visualization || message.visual);
  const visualType = message.chartType ?? message.visual ?? "bar";

  return (
    <div className={cn("flex gap-2 items-start", isUser && "flex-row-reverse")}>
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          "rounded-xl px-4 py-3 max-w-[88%] text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-pastel-lavender/40 text-foreground rounded-tl-sm w-full",
        )}
      >
        <FormattedText text={message.content} />
        {hasVisual && (
          <div className="mt-4">
            {isExternalVisualOpen ? (
              <>
                {/* On desktop when visual stage is open, show interactive pill */}
                <div className="hidden md:block p-3 rounded-xl border border-primary/20 bg-background/90 shadow-2xs">
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
                    {isActiveVisualOnStage ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        On Canvas
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onSelectVisual}
                        className="h-6 px-2 text-[11px] rounded-full gap-1 shrink-0"
                      >
                        <span>View on Stage</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* On mobile screens, render inline so mobile users see chart */}
                <div className="md:hidden">
                  <ChatVisualizer
                    type={visualType}
                    data={message.chartData}
                    reason={message.visualizationReason}
                    url={message.chartUrl}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {onSelectVisual && (
                  <div className="hidden md:flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onSelectVisual}
                      className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 rounded-full gap-1"
                    >
                      <span>Open on Visual Stage</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                )}
                <ChatVisualizer
                  type={visualType}
                  data={message.chartData}
                  reason={message.visualizationReason}
                  url={message.chartUrl}
                />
              </div>
            )}
          </div>
        )}
        {message.role === "assistant" && message.status === "typing" && (
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

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={index} className="font-semibold">
              <EmployeeLinks text={part.slice(2, -2)} />
            </strong>
          );
        if (part.startsWith("*") && part.endsWith("*"))
          return (
            <em key={index} className="italic">
              <EmployeeLinks text={part.slice(1, -1)} />
            </em>
          );
        return <EmployeeLinks key={index} text={part} />;
      })}
    </>
  );
}

const nameMatcher = new RegExp(
  `(${employees.map((employee) => employee.name).join("|")})`,
  "g",
);

/** Turns any employee name inside chat text into a link to that employee's profile. */
function EmployeeLinks({ text }: { text: string }) {
  const segments = text.split(nameMatcher);
  return (
    <>
      {segments.map((segment, index) => {
        const employee = employees.find((item) => item.name === segment);
        if (!employee) return <span key={index}>{segment}</span>;
        return (
          <Link
            key={index}
            to="/employee/$employeeId"
            params={{ employeeId: employee.id }}
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          >
            {segment}
          </Link>
        );
      })}
    </>
  );
}

const PALETTE = [
  "var(--pastel-sky)",
  "var(--pastel-mint)",
  "var(--pastel-lavender)",
  "var(--pastel-peach)",
  "var(--pastel-pink)",
  "var(--pastel-yellow)",
  "var(--pastel-blue)",
  "var(--pastel-teal)",
  "var(--pastel-rose)",
];

function formatHeaderKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseVisualData(raw: unknown): Record<string, any>[] {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is Record<string, any> => item != null && typeof item === "object");
  }
  if (typeof parsed === "object" && parsed !== null) {
    const record = parsed as Record<string, any>;
    for (const key of ["data", "items", "rows", "records", "results", "chart_data"]) {
      if (Array.isArray(record[key])) {
        return record[key].filter((item): item is Record<string, any> => item != null && typeof item === "object");
      }
    }
    const entries = Object.entries(record).filter(([, v]) => typeof v === "number" || typeof v === "string");
    if (entries.length > 0) {
      return entries.map(([name, value]) => ({
        name,
        value: typeof value === "number" ? value : Number(value) || value,
      }));
    }
  }
  return [];
}

function analyzeDataStructure(items: Record<string, any>[]) {
  if (items.length === 0) {
    return { categoryKey: "name", metricKeys: ["value"], columns: [] };
  }

  const columns = Object.keys(items[0]);
  
  const categoryKeyCandidate =
    columns.find((c) => {
      const val = items[0][c];
      return typeof val === "string" && isNaN(Number(val));
    }) ||
    columns.find((c) =>
      /name|dept|department|label|category|month|date|period|role|title|status|type/i.test(c),
    ) ||
    columns[0];

  const metricKeys = columns.filter((c) => {
    if (c === categoryKeyCandidate) return false;
    const val = items[0][c];
    return typeof val === "number" || (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "");
  });

  return {
    categoryKey: categoryKeyCandidate,
    metricKeys: metricKeys.length > 0 ? metricKeys : columns.filter((c) => c !== categoryKeyCandidate),
    columns,
  };
}

type ChatVisualizerProps = {
  type?: "bar" | "line" | "pie" | "table" | "area" | string | null;
  data?: unknown;
  reason?: string | null;
  url?: string | null;
};

function ChatVisualizer({ type, data, reason, url }: ChatVisualizerProps) {
  const normalizedType = (type || "").toLowerCase().trim();
  const isTable = normalizedType === "table";
  const isPie = normalizedType === "pie";
  const isLine = normalizedType === "line" || normalizedType === "area";
  const isBar = normalizedType === "bar" || (!isTable && !isPie && !isLine);

  const rawItems = parseVisualData(data);

  // Fallback data if items are empty
  const hasDynamicData = rawItems.length > 0;
  const items = hasDynamicData
    ? rawItems
    : isBar
      ? departments.slice(0, 5)
      : isPie
        ? jobLevelMix.slice(0, 5)
        : isLine
          ? headcountTrend.slice(-6)
          : departments.slice(0, 4);

  const { categoryKey, metricKeys, columns } = analyzeDataStructure(items);

  // Convert string numeric values to numbers for recharts
  const chartItems = items.map((row) => {
    const copy = { ...row };
    for (const mk of metricKeys) {
      const num = Number(copy[mk]);
      if (!isNaN(num)) copy[mk] = num;
    }
    return copy;
  });

  const chartTitle = reason
    ? reason
    : isBar
      ? "Workforce Comparison"
      : isPie
        ? "Workforce Distribution"
        : isLine
          ? "Historical Trend"
          : "Workforce Data Overview";

  const chartBadge = isBar ? "Bar Chart" : isPie ? "Pie Chart" : isLine ? "Line Trend" : "Table View";

  const ChartIcon = isBar ? BarChart3 : isPie ? PieChartIcon : isLine ? Activity : TableProperties;

  return (
    <div className="w-full max-w-2xl bg-card rounded-xl border border-border/80 shadow-xs overflow-hidden text-xs">
      {/* Visualizer header */}
      <div className="px-4 py-3 border-b bg-muted/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-md bg-primary/10 grid place-items-center shrink-0">
            <ChartIcon className="w-3.5 h-3.5 text-primary" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate">{chartTitle}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {reason && reason !== chartTitle ? reason : `${items.length} records visualized`}
            </p>
          </div>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background border border-border text-muted-foreground">
          {chartBadge}
        </span>
      </div>

      {/* Chart body */}
      {isBar && (
        <div className="h-52 p-2 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartItems}
              margin={{ left: -15, right: 10, top: 0, bottom: chartItems.length > 5 ? 24 : 0 }}
            >
              <XAxis
                dataKey={categoryKey}
                stroke="var(--muted-foreground)"
                fontSize={9}
                interval={0}
                angle={chartItems.length > 5 ? -25 : 0}
                textAnchor={chartItems.length > 5 ? "end" : "middle"}
                tickLine={false}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
              {metricKeys.slice(0, 2).map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={formatHeaderKey(key)}
                  fill={PALETTE[i % PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {isPie && (
        <div className="p-3">
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartItems}
                  dataKey={metricKeys[0] || "value"}
                  nameKey={categoryKey}
                  innerRadius={34}
                  outerRadius={62}
                  paddingAngle={2}
                >
                  {chartItems.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--card)" strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto px-1">
            {chartItems.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <span className="truncate max-w-[100px]">{String(item[categoryKey] ?? "")}</span>
                <span className="font-semibold text-foreground">({String(item[metricKeys[0]] ?? "")})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLine && (
        <div className="h-52 p-2 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartItems}
              margin={{ left: -15, right: 10, top: 0, bottom: chartItems.length > 5 ? 24 : 0 }}
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey={categoryKey}
                stroke="var(--muted-foreground)"
                fontSize={9}
                interval={0}
                angle={chartItems.length > 5 ? -25 : 0}
                textAnchor={chartItems.length > 5 ? "end" : "middle"}
                tickLine={false}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
              <Area
                type="monotone"
                dataKey={metricKeys[0]}
                name={formatHeaderKey(metricKeys[0])}
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#chartGrad)"
                dot={{ r: 3, fill: "var(--primary)" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {isTable && (
        <div className="p-2">
          <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-lg border border-border/50">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/60 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="p-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                    >
                      {formatHeaderKey(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                    {columns.map((col) => {
                      const val = row[col];
                      const isNum =
                        typeof val === "number" ||
                        (!isNaN(Number(val)) && typeof val === "string" && val.trim() !== "");
                      return (
                        <td
                          key={col}
                          className={cn(
                            "p-2 text-[11px]",
                            isNum ? "tabular-nums font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {val != null ? String(val) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* External chart link or image url if provided */}
      {url && (
        <div className="px-3 py-2 border-t bg-muted/20 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Original visualization:</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> View artifact
          </a>
        </div>
      )}
    </div>
  );
}
