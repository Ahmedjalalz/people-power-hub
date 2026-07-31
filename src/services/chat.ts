import type { ChatStreamEvent } from "@/types/chat";

const STREAM_TIMEOUT_MS = 60_000;

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) throw new Error("The chat service is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function parseEvent(line: string): ChatStreamEvent | null {
  if (!line.startsWith("data:")) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;
  try {
    const event = JSON.parse(payload) as unknown;
    return event && typeof event === "object" && "type" in event ? (event as ChatStreamEvent) : null;
  } catch {
    return null;
  }
}

export async function streamChat({ message, threadId, signal, onEvent }: { message: string; threadId: string; signal?: AbortSignal; onEvent: (event: ChatStreamEvent) => void }): Promise<void> {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), STREAM_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal;
  try {
    const response = await fetch(`${getApiBaseUrl()}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ message, thread_id: threadId }),
      signal: requestSignal,
    });
    if (!response.ok) throw new Error(`Chat request failed (${response.status}).`);
    if (!response.body) throw new Error("The chat service returned no response stream.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const processLines = (flush = false) => {
      const lines = buffer.split(/\r?\n/);
      buffer = flush ? "" : (lines.pop() ?? "");
      for (const line of lines) {
        const event = parseEvent(line);
        if (event) onEvent(event);
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      processLines(done);
      if (done) break;
    }
  } catch (error) {
    if (timeoutController.signal.aborted) throw new Error("The chat request timed out.");
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
