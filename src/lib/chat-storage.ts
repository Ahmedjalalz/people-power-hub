import type { ChatMessage } from "@/types/chat";

export interface ChatSession {
  id: string;
  title: string;
  threadId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "people_power_chat_sessions_v2";
const ACTIVE_SESSION_KEY = "people_power_active_chat_session_id";

export function loadStoredSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load chat sessions:", err);
    return [];
  }
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new Event("chat-sessions-updated"));
  } catch (err) {
    console.error("Failed to save chat sessions:", err);
  }
}

export function loadActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function saveActiveSessionId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

export function generateSessionTitle(firstPrompt: string): string {
  const cleaned = firstPrompt
    .replace(/^["']|["']$/g, "")
    .trim()
    .replace(/\s+/g, " ");
  if (!cleaned) return "New Conversation";
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 37) + "...";
}

export type SessionGroup = {
  groupName: "Today" | "Yesterday" | "Previous 7 Days" | "Older";
  sessions: ChatSession[];
};

export function groupSessionsByDate(sessions: ChatSession[]): SessionGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const todayList: ChatSession[] = [];
  const yesterdayList: ChatSession[] = [];
  const past7DaysList: ChatSession[] = [];
  const olderList: ChatSession[] = [];

  // Sort descending by updatedAt
  const sorted = [...sessions].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  for (const s of sorted) {
    const time = s.updatedAt || s.createdAt;
    if (time >= startOfToday) {
      todayList.push(s);
    } else if (time >= startOfYesterday) {
      yesterdayList.push(s);
    } else if (time >= startOf7Days) {
      past7DaysList.push(s);
    } else {
      olderList.push(s);
    }
  }

  const groups: SessionGroup[] = [];
  if (todayList.length > 0) groups.push({ groupName: "Today", sessions: todayList });
  if (yesterdayList.length > 0) groups.push({ groupName: "Yesterday", sessions: yesterdayList });
  if (past7DaysList.length > 0) groups.push({ groupName: "Previous 7 Days", sessions: past7DaysList });
  if (olderList.length > 0) groups.push({ groupName: "Older", sessions: olderList });

  return groups;
}
