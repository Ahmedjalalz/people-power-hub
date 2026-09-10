export type ChatRole = "user" | "assistant";

export type ChartType = "bar" | "line" | "pie" | "table" | "area";

export type ChatResponse = {
  reply: string;
  visualization: boolean;
  chart_type?: ChartType | null;
  chart_data?: unknown;
  chart_url?: string | null;
  visualization_reason?: string | null;
  thread_id?: string;
  selected_employee_id?: string | null;
  selected_employee_name?: string | null;
  last_tool_status?: string | null;
  elapsed_ms?: number;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  status: "thinking" | "typing" | "done";
  statusText?: string;
  visualization?: boolean;
  chartType?: ChartType | null;
  chartData?: unknown;
  chartUrl?: string | null;
  visualizationReason?: string | null;
  visual?: "bar" | "pie" | "area" | "table";
};

export type ChatStreamEvent =
  | { type: "meta"; thread_id?: string }
  | { type: "status"; text?: string }
  | { type: "token"; text?: string }
  | { type: "done"; thread_id?: string; selected_employee_id?: string; selected_employee_name?: string; last_tool_status?: string; elapsed_ms?: number };

export type ChatMetadata = Extract<ChatStreamEvent, { type: "done" }>;

