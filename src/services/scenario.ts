import { getAuthHeader } from "@/lib/auth";

// ─── API types (from OpenAPI schema) ─────────────────────────────────────────

export type ScenarioType =
  | "employee_promotion"
  | "employee_transfer"
  | "headcount_reduction"
  | "workforce_expansion"
  | "budget_change"
  | "skill_reskilling"
  | "business_demand_change";

/** One scenario card returned by GET /api/v1/simulations/scenarios */
export interface ScenarioCard {
  key: ScenarioType;
  title: string;
  description: string;
  subject: "employee" | "department";
  /** Any extra fields the backend includes (icon, category, etc.) */
  [k: string]: unknown;
}

/** One employee hit returned by GET /api/v1/simulations/employees */
export interface EmployeeHit {
  employee_id: string;
  employee_name: string;
  department?: string | null;
  position_title?: string | null;
  [k: string]: unknown;
}

/** Full employee context returned by GET /api/v1/simulations/employees/{id}/context */
export interface EmployeeContext {
  employee_id: string;
  employee_name: string;
  department?: string | null;
  position_title?: string | null;
  job_level?: string | null;
  performance_score?: number | string | null;
  readiness?: string | null;
  skills?: string[] | null;
  [k: string]: unknown;
}

/** One department returned by GET /api/v1/simulations/departments */
export interface DepartmentHit {
  department_id: string;
  department_name: string;
  headcount?: number | null;
  [k: string]: unknown;
}

/** One option item returned by GET /api/v1/simulations/options */
export interface OptionItem {
  id: string;
  label: string;
  [k: string]: unknown;
}

/** Request body for POST /api/v1/simulations/run */
export interface SimulationRequest {
  scenario_type: ScenarioType;
  employee_id?: string | null;
  department_id?: string | null;
  target_position_id?: string | null;
  target_department_id?: string | null;
  parameters: Record<string, string | number | boolean | null>;
}

/** Response from POST /api/v1/simulations/run */
export interface SimulationResponse {
  scenario_type: ScenarioType;
  status: string;
  baseline: Record<string, unknown>;
  simulated_state: Record<string, unknown>;
  impact: Record<string, unknown>;
  assumptions?: Record<string, unknown>;
  warnings?: string[];
}

// ─── Internal fetch helpers ───────────────────────────────────────────────────

const PROXY = "/api/scenario";

async function apiFetch<T>(resource: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(PROXY, window.location.origin);
  url.searchParams.set("resource", resource);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json", ...getAuthHeader() },
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const raw = record["error"] ?? record["detail"] ?? record["message"];
    const message =
      typeof raw === "string" && raw.trim() ? raw : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return data as T;
}

async function apiPost<T>(resource: string, payload: unknown): Promise<T> {
  const url = new URL(PROXY, window.location.origin);
  url.searchParams.set("resource", resource);

  // Strip null / undefined / empty-string fields at the top level so
  // Pydantic's minLength:1 constraints are never triggered.
  const cleanPayload = Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined && v !== "",
    ),
  );

  // Also strip empty parameters object — backend may not want it
  if (
    cleanPayload["parameters"] &&
    typeof cleanPayload["parameters"] === "object" &&
    Object.keys(cleanPayload["parameters"] as object).length === 0
  ) {
    delete cleanPayload["parameters"];
  }

  console.debug("[SimulationRequest]", JSON.stringify(cleanPayload, null, 2));

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(cleanPayload),
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("[SimulationError]", response.status, text);
    const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const detail = record["detail"];

    let message: string;
    if (typeof detail === "string" && detail.trim()) {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      // FastAPI validation errors: [{loc:[...], msg:"...", type:"..."}]
      message = detail
        .map((d) => {
          const loc = Array.isArray((d as Record<string, unknown>)["loc"])
            ? ((d as Record<string, unknown>)["loc"] as string[]).join(".")
            : "";
          const msg = (d as Record<string, unknown>)["msg"] ?? "invalid";
          return loc ? `${loc}: ${msg}` : String(msg);
        })
        .join(" | ");
    } else {
      const raw = record["error"] ?? record["message"];
      message = typeof raw === "string" && raw.trim() ? raw : `Request failed (${response.status}).`;
    }
    throw new Error(message);
  }

  return data as T;
}

// ─── Field-name normalisation ─────────────────────────────────────────────────
// The backend may use scenario_type/name/category instead of key/title/subject.
// We normalise here so the component never has to guess.

const EMPLOYEE_SCENARIO_TYPES = new Set([
  "employee_promotion",
  "employee_transfer",
  "skill_reskilling",
]);

const SCENARIO_LABELS: Record<string, string> = {
  employee_promotion: "Employee Promotion",
  employee_transfer: "Employee Transfer",
  headcount_reduction: "Headcount Reduction",
  workforce_expansion: "Workforce Expansion / Hiring",
  budget_change: "Budget Change",
  skill_reskilling: "Skill Gap / Reskilling",
  business_demand_change: "Business Demand / Workload",
};

const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  employee_promotion: "Model the impact of promoting a person into a higher level or role.",
  employee_transfer: "See what happens when a person moves to another department or location.",
  headcount_reduction: "Reduce roles in a department and review the workforce impact.",
  workforce_expansion: "Add new positions and check capacity, cost and ramp-up effects.",
  budget_change: "Increase or decrease the people budget and see what it supports.",
  skill_reskilling: "Test a reskilling push against current capability gaps.",
  business_demand_change: "Change expected workload and see staffing pressure.",
};

function normalizeScenarioCard(raw: unknown): ScenarioCard {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  // Backend uses code, scenario_type, key, id, or type as the primary identifier
  const key = String(
    r["code"] ?? r["scenario_type"] ?? r["key"] ?? r["id"] ?? r["type"] ?? "",
  ) as ScenarioType;

  // title: backend may use name, label, title, or fall back to formatted key
  const title = String(
    r["title"] ?? r["name"] ?? r["label"] ?? SCENARIO_LABELS[key] ?? key.replace(/_/g, " "),
  );

  // description: backend may use description, blurb, summary
  const description = String(
    r["description"] ?? r["blurb"] ?? r["summary"] ??
      SCENARIO_DESCRIPTIONS[key] ?? "",
  );

  // subject: backend may use subject, category, type — or we derive from key
  const rawSubject = r["subject"] ?? r["category"] ?? r["applies_to"];
  const subject: "employee" | "department" =
    rawSubject === "employee" || EMPLOYEE_SCENARIO_TYPES.has(key)
      ? "employee"
      : "department";

  return { ...r, key, title, description, subject };
}

function normalizeEmployeeHit(raw: unknown): EmployeeHit {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const employee_id = String(
    r["employee_id"] ?? r["Employee_ID"] ?? r["id"] ?? "",
  );
  const employee_name = String(
    r["employee_name"] ?? r["Employee_Name"] ?? r["name"] ?? employee_id,
  );
  const department = String(
    r["department"] ?? r["Department"] ?? r["dept"] ?? "",
  ) || undefined;
  const position_title = String(
    r["position_title"] ?? r["Position_Title"] ?? r["designation"] ?? r["Designation"] ?? "",
  ) || undefined;
  return { ...r, employee_id, employee_name, department, position_title };
}

function normalizeDepartmentHit(raw: unknown): DepartmentHit {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const department_id = String(
    r["department_id"] ?? r["id"] ?? r["department_name"] ?? r["name"] ?? "",
  );
  const department_name = String(
    r["department_name"] ?? r["name"] ?? r["label"] ?? department_id,
  );
  const headcount =
    typeof r["headcount"] === "number"
      ? r["headcount"]
      : typeof r["employee_count"] === "number"
        ? r["employee_count"]
        : null;
  return { ...r, department_id, department_name, headcount };
}

function normalizeOptionItem(raw: unknown): OptionItem {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const id = String(
    r["id"] ?? r["position_id"] ?? r["department_id"] ?? r["course_id"] ?? r["value"] ?? "",
  );
  const label = String(
    r["label"] ?? r["name"] ?? r["title"] ?? r["position_title"] ??
      r["department_name"] ?? r["course_name"] ?? id,
  );
  return { ...r, id, label };
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Load the 7 scenario cards from the backend.
 * GET /api/v1/simulations/scenarios
 */
export async function fetchScenarios(): Promise<ScenarioCard[]> {
  const data = await apiFetch<unknown>("scenarios");
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else {
    const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const list = record["scenarios"] ?? record["data"] ?? record["results"];
    if (Array.isArray(list)) raw = list;
  }
  return raw.map(normalizeScenarioCard);
}

/**
 * Search employees by ID or name.
 * GET /api/v1/simulations/employees?query=...
 */
export async function searchEmployees(query: string, limit = 20): Promise<EmployeeHit[]> {
  const data = await apiFetch<unknown>("employees", {
    query: query.trim(),
    limit: String(limit),
  });
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else {
    const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const list =
      record["employees"] ?? record["results"] ?? record["records"] ?? record["matches"] ?? record["data"];
    if (Array.isArray(list)) raw = list;
    else if (data && typeof data === "object") raw = [data];
  }
  return raw.map(normalizeEmployeeHit);
}

/**
 * Load the full simulation context for a selected employee.
 * GET /api/v1/simulations/employees/{employee_id}/context
 */
export async function fetchEmployeeContext(employeeId: string): Promise<EmployeeContext> {
  const data = await apiFetch<unknown>("employee-context", { employee_id: employeeId });
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  // Backend may nest under "employee", "context", "data", or return flat
  const nested = record["employee"] ?? record["context"] ?? record["data"];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as EmployeeContext;
  }
  return record as EmployeeContext;
}

/**
 * Load/search departments for department-based scenarios.
 * GET /api/v1/simulations/departments?query=...
 */
export async function searchDepartments(query = "", limit = 50): Promise<DepartmentHit[]> {
  const data = await apiFetch<unknown>("departments", {
    query,
    limit: String(limit),
  });
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else {
    const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const list =
      record["departments"] ?? record["results"] ?? record["records"] ?? record["data"];
    if (Array.isArray(list)) raw = list;
  }
  return raw.map(normalizeDepartmentHit);
}

export interface FetchOptionsParams {
  scenario_type: ScenarioType;
  employee_id?: string | null;
  department_id?: string | null;
  target_department_id?: string | null;
  query?: string;
  limit?: number;
}

/**
 * Load valid scenario-specific options (target positions, target departments, courses, etc.)
 * GET /api/v1/simulations/options?...
 */
export async function fetchOptions(params: FetchOptionsParams): Promise<OptionItem[]> {
  const p: Record<string, string> = { scenario_type: params.scenario_type };
  if (params.employee_id) p["employee_id"] = params.employee_id;
  if (params.department_id) p["department_id"] = params.department_id;
  if (params.target_department_id) p["target_department_id"] = params.target_department_id;
  if (params.query) p["query"] = params.query;
  if (params.limit) p["limit"] = String(params.limit);

  const data = await apiFetch<unknown>("options", p);
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else {
    const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    for (const key of ["options", "positions", "target_positions", "target_departments", "departments", "courses", "results", "data", "items"]) {
      const list = record[key];
      if (Array.isArray(list)) { raw = list; break; }
    }
  }
  return raw.map(normalizeOptionItem);
}

/**
 * Run the selected scenario and return the simulation result.
 * POST /api/v1/simulations/run
 */
export async function runSimulation(request: SimulationRequest): Promise<SimulationResponse> {
  return apiPost<SimulationResponse>("run", request);
}

// ─── Presentation helpers (unchanged, kept for compatibility) ─────────────────

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
