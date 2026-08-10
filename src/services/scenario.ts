import { getAuthHeader } from "@/lib/auth";

export type ScenarioKey =
  | "employee_promotion"
  | "employee_transfer"
  | "headcount_reduction"
  | "workforce_expansion"
  | "budget_change"
  | "skill_gap_reskilling"
  | "business_demand";

export type ScenarioField = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
  suffix?: string;
};

export type ScenarioDefinition = {
  key: ScenarioKey;
  title: string;
  subject: "employee" | "department";
  blurb: string;
  tint: string;
  fields: ScenarioField[];
};

export const scenarioDefinitions: ScenarioDefinition[] = [
  {
    key: "employee_promotion",
    title: "Employee Promotion",
    subject: "employee",
    blurb: "Model the impact of promoting a person into a higher level or role.",
    tint: "bg-pastel-teal",
    fields: [
      { name: "new_designation", label: "New designation", type: "text", placeholder: "e.g. Senior Engineer" },
      { name: "new_job_level", label: "New job level", type: "text", placeholder: "e.g. L4" },
      { name: "salary_change_percent", label: "Salary change", type: "number", suffix: "%", placeholder: "e.g. 12" },
      { name: "effective_month", label: "Effective month", type: "text", placeholder: "YYYY-MM" },
      { name: "notes", label: "Notes for the model (optional)", type: "textarea" },
    ],
  },
  {
    key: "employee_transfer",
    title: "Employee Transfer",
    subject: "employee",
    blurb: "See what happens when a person moves to another department or location.",
    tint: "bg-pastel-sky",
    fields: [
      { name: "target_department", label: "Target department", type: "text", placeholder: "e.g. Operations" },
      { name: "target_position_title", label: "Target position", type: "text", placeholder: "e.g. Team Lead" },
      { name: "target_location", label: "Target location (optional)", type: "text" },
      { name: "effective_month", label: "Effective month", type: "text", placeholder: "YYYY-MM" },
      { name: "notes", label: "Notes for the model (optional)", type: "textarea" },
    ],
  },
  {
    key: "headcount_reduction",
    title: "Headcount Reduction",
    subject: "department",
    blurb: "Reduce roles in a department and review the workforce impact.",
    tint: "bg-pastel-rose",
    fields: [
      { name: "headcount_change", label: "Positions to remove", type: "number", placeholder: "e.g. 5" },
      { name: "effective_month", label: "Effective month", type: "text", placeholder: "YYYY-MM" },
      { name: "notes", label: "Notes for the model (optional)", type: "textarea" },
    ],
  },
  {
    key: "workforce_expansion",
    title: "Workforce Expansion / Hiring",
    subject: "department",
    blurb: "Add new positions and check capacity, cost and ramp-up effects.",
    tint: "bg-pastel-mint",
    fields: [
      { name: "headcount_change", label: "Positions to add", type: "number", placeholder: "e.g. 8" },
      { name: "target_position_title", label: "Role to hire (optional)", type: "text" },
      { name: "effective_month", label: "Effective month", type: "text", placeholder: "YYYY-MM" },
      { name: "notes", label: "Notes for the model (optional)", type: "textarea" },
    ],
  },
  {
    key: "budget_change",
    title: "Budget Change",
    subject: "department",
    blurb: "Increase or decrease the people budget and see what it supports.",
    tint: "bg-pastel-yellow",
    fields: [
      { name: "budget_change_percent", label: "Budget change", type: "number", suffix: "%", placeholder: "e.g. -10" },
      { name: "effective_month", label: "Effective month", type: "text", placeholder: "YYYY-MM" },
      { name: "notes", label: "Notes for the model (optional)", type: "textarea" },
    ],
  },
  {
    key: "skill_gap_reskilling",
    title: "Skill Gap / Reskilling",
    subject: "department",
    blurb: "Test a reskilling push against current capability gaps.",
    tint: "bg-pastel-lavender",
    fields: [
      { name: "target_skill", label: "Skill to build", type: "text", placeholder: "e.g. Data analysis" },
      { name: "employees_to_reskill", label: "People to reskill", type: "number", placeholder: "e.g. 15" },
      { name: "training_duration_months", label: "Training duration", type: "number", suffix: "months" },
      { name: "notes", label: "Notes for the model (optional)", type: "textarea" },
    ],
  },
  {
    key: "business_demand",
    title: "Business Demand / Workload",
    subject: "department",
    blurb: "Change expected workload and see staffing pressure.",
    tint: "bg-pastel-peach",
    fields: [
      { name: "workload_change_percent", label: "Workload change", type: "number", suffix: "%", placeholder: "e.g. 25" },
      { name: "duration_months", label: "Duration", type: "number", suffix: "months" },
      { name: "notes", label: "Notes for the model (optional)", type: "textarea" },
    ],
  },
];

async function post<T>(resource: string, payload: unknown): Promise<T> {
  const response = await fetch(`/api/scenario?resource=${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const raw = record["error"] ?? record["detail"] ?? record["message"];
    const message = typeof raw === "string" && raw.trim() ? raw : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return data as T;
}

export type EmployeeSearchHit = Record<string, unknown>;

export function searchEmployees(query: string): Promise<unknown> {
  const trimmed = query.trim();
  const looksLikeId = /^[A-Za-z]*\d/.test(trimmed) && !trimmed.includes(" ");
  return post("employee-search", looksLikeId ? { employee_id: trimmed } : { employee_name: trimmed });
}

export type ScenarioRequest = {
  scenario_type: ScenarioKey;
  employee_id?: string;
  department?: string;
  parameters: Record<string, string | number>;
};

export function runScenarioSimulation(payload: ScenarioRequest): Promise<unknown> {
  return post("simulate", payload);
}

/** Find the first array of records under any of the given keys (or anywhere shallow). */
export function pickArray<T = Record<string, unknown>>(source: unknown, ...keys: string[]): T[] | null {
  if (Array.isArray(source)) return source as T[];
  if (!source || typeof source !== "object") return null;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object") return value as T[];
    if (value && typeof value === "object") {
      const nested = pickArray<T>(value, ...keys);
      if (nested) return nested;
    }
  }
  return null;
}

export function pickObject<T = Record<string, unknown>>(source: unknown, ...keys: string[]): T | null {
  if (!source || typeof source !== "object") return null;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as T;
  }
  return null;
}

export function pickString(source: unknown, ...keys: string[]): string | null {
  if (!source || typeof source !== "object") return null;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

/** Normalise a mixed list (strings or objects) into readable lines. */
export function toLines(value: unknown): { title: string; detail?: string }[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return { title: item };
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const title =
        pickString(record, "title", "name", "risk", "reason", "recommendation", "action", "label", "message", "text") ??
        "Item";
      const detail =
        pickString(record, "detail", "details", "description", "impact", "explanation", "rationale", "severity", "priority") ??
        undefined;
      return detail ? { title, detail } : { title };
    }
    return { title: String(item) };
  });
}
