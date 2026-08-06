export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  status: "thinking" | "typing" | "done";
  statusText?: string;
  visual?: "bar" | "pie" | "area" | "table";
};

export type ChatStreamEvent =
  | { type: "meta"; thread_id?: string }
  | { type: "status"; text?: string }
  | { type: "token"; text?: string }
  | { type: "done"; thread_id?: string; selected_employee_id?: string; selected_employee_name?: string; last_tool_status?: string; elapsed_ms?: number };

export type ChatMetadata = Extract<ChatStreamEvent, { type: "done" }>;
