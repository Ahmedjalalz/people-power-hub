import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Sparkles, BarChart3, PieChart as PieChartIcon, Activity, TableProperties, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { Link } from "@tanstack/react-router";
import { employees } from "@/lib/employees";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
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
};

export function Chatbot({
  compact = false,
  autoFocus = false,
  title = "HR Insights Assistant",
  subtitle = "Ask about attrition, risk & retention",
  placeholder = "Ask about an employee or risk...",
  welcomeMessage = "Hi! I'm your HR Insights assistant. Ask me things like *\"Is Usman expected to leave soon?\"* or *\"Who is at highest risk this quarter?\"*",
}: ChatbotProps) {
  const { messages, isStreaming, sendMessage, injectMockMessage } = useChat({ welcomeMessage });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

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
    <div className={cn("flex flex-col h-full bg-card", compact ? "" : "rounded-2xl border")}>
      {/* ── Header ── */}
      <div className="flex flex-col border-b bg-pastel-lavender/50 rounded-t-2xl">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
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
          <MessageBubble key={message.id} message={message} />
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

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  if (message.role === "assistant" && message.status === "thinking")
    return (
      <div className="flex gap-2 items-start">
        <BotAvatar />
        <div className="rounded-2xl rounded-tl-sm bg-pastel-lavender/40 px-4 py-3 max-w-[85%]">
          <div className="text-xs italic text-muted-foreground flex items-center gap-1">
            <span>{message.statusText}</span>
            <span className="thinking-dot">.</span>
            <span className="thinking-dot">.</span>
            <span className="thinking-dot">.</span>
          </div>
        </div>
      </div>
    );
  return (
    <div className={cn("flex gap-2 items-start", isUser && "flex-row-reverse")}>
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-pastel-lavender/40 text-foreground rounded-tl-sm w-full",
        )}
      >
        <FormattedText text={message.content} />
        {message.visual && (
          <div className="mt-4">
            <ChatVisualizer type={message.visual} />
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

function ChatVisualizer({ type }: { type: "bar" | "pie" | "area" | "table" }) {
  if (type === "bar") {
    return (
      <div className="w-full max-w-[400px] bg-card rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h4 className="text-sm font-semibold">Headcount Comparison</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Actual vs Approved across top departments.</p>
        </div>
        <div className="h-48 p-2 pt-4">
          <ResponsiveContainer>
            <BarChart data={departments.slice(0, 5)} margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={9} interval={0} />
              <YAxis stroke="var(--muted-foreground)" fontSize={9} />
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
              <Bar dataKey="actual" fill="var(--pastel-sky)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  if (type === "pie") {
    return (
      <div className="w-full max-w-[400px] bg-card rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h4 className="text-sm font-semibold">Role Distribution</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Breakdown of employees by job level.</p>
        </div>
        <div className="h-48 p-2 flex items-center justify-center">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={jobLevelMix.slice(0, 5)} dataKey="count" nameKey="level" innerRadius={35} outerRadius={60} paddingAngle={2}>
                {jobLevelMix.slice(0, 5).map((row) => (
                  <Cell key={row.level} fill={row.color} stroke="var(--card)" />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  if (type === "area") {
    return (
      <div className="w-full max-w-[400px] bg-card rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h4 className="text-sm font-semibold">Staffing Trend</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Historical headcount over the last 6 months.</p>
        </div>
        <div className="h-48 p-2 pt-4">
          <ResponsiveContainer>
            <AreaChart data={headcountTrend.slice(-6)} margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={9} />
              <YAxis stroke="var(--muted-foreground)" fontSize={9} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
              <Area type="monotone" dataKey="people" stroke="var(--primary)" strokeWidth={2} fill="var(--pastel-lavender)" fillOpacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  if (type === "table") {
    return (
      <div className="w-full max-w-[400px] bg-card rounded-xl border overflow-hidden text-xs">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h4 className="text-sm font-semibold">Budget Utilization</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Current spend against allocated department budgets.</p>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Department</th>
                <th className="p-2 font-medium">Usage</th>
              </tr>
            </thead>
            <tbody>
              {departments.slice(0, 4).map((d) => (
                <tr key={d.name} className="border-t">
                  <td className="p-2 font-medium">{d.name}</td>
                  <td className="p-2">
                    <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden flex items-center">
                      <div className="h-full bg-pastel-mint" style={{ width: `${d.utilization}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return null;
}
