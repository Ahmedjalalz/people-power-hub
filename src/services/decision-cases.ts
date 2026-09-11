import { getAuthHeader } from "@/lib/auth";

// ─── Types matching Backend OpenAPI Schema ────────────────────────────────────

export type DecisionCaseSubjectType = "Employee" | "Organization" | "Department" | "Position";
export type DecisionCasePriority = "Critical" | "High" | "Medium" | "Low";
export type DecisionCaseStatus = "Open" | "Under Review" | "In Progress" | "Resolved" | "Closed";

export interface DecisionCaseRecord {
  id: string; // e.g. "CASE-A1421EBD35A5"
  case_key: string; // e.g. "EMPLOYEE:EMP292"
  rule_id: string; // "DTE-001" | "DTE-002" | "DTE-003" | "DTE-004" | "DTE-005"
  case_type: string; // e.g. "Critical Retention and Role Continuity"
  subject_type: DecisionCaseSubjectType;
  subject_id: string; // e.g. "EMP292", "ORGANIZATION"
  employee_id?: string | null;
  position_id?: string | null;
  department_id?: string | null;
  department?: string | null;
  priority: DecisionCasePriority;
  display_rank: number;
  title: string;
  reason: string;
  evidence: Record<string, any>;
  suggested_action: string;
  data_as_of?: string | null;
  status: DecisionCaseStatus;
  is_trigger_active: boolean;
  detected_at: string;
  last_evaluated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
}

export interface DecisionCaseQueryResult {
  status: "success" | "not_found" | "unsupported" | "error" | string;
  count: number;
  total_matching: number;
  cases: DecisionCaseRecord[];
  message?: string | null;
}

export interface DecisionCaseEvaluationResult {
  status: "success" | string;
  evaluated_at: string;
  detected_case_count: number;
  actionable_case_count: number;
  dashboard_case_count: number;
  dashboard_limit: number;
  cases: DecisionCaseRecord[];
  note?: string;
}

export interface DecisionCaseListParams {
  priority?: string;
  status?: string;
  department?: string;
  employee_id?: string;
  rule_id?: string;
  active_only?: boolean;
  refresh?: boolean;
  limit?: number;
}

// ─── 5 Critical Detection Rules Catalog ───────────────────────────────────────

export interface DecisionRuleMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultPriority: DecisionCasePriority;
  scenarioType?: string;
}

export const DECISION_RULES: Record<string, DecisionRuleMeta> = {
  "DTE-001": {
    id: "DTE-001",
    name: "Leadership Continuity Risk",
    category: "Retention & Succession",
    description: "Key employee may leave and no ready replacement is available.",
    defaultPriority: "Critical",
    scenarioType: "employee_promotion",
  },
  "DTE-002": {
    id: "DTE-002",
    name: "Critical Role Performance Risk",
    category: "Performance Deterioration",
    description: "Performance is dropping in an important business role.",
    defaultPriority: "High",
    scenarioType: "skill_reskilling",
  },
  "DTE-003": {
    id: "DTE-003",
    name: "Budget Compliance Risk",
    category: "Headcount & Budget Governance",
    description: "A filled position is operating without approved budget.",
    defaultPriority: "Critical",
    scenarioType: "budget_change",
  },
  "DTE-004": {
    id: "DTE-004",
    name: "Critical Vacancy Risk",
    category: "Talent Acquisition & SLA",
    description: "An important position has remained vacant longer than allowed.",
    defaultPriority: "High",
    scenarioType: "workforce_expansion",
  },
  "DTE-005": {
    id: "DTE-005",
    name: "Capacity Risk",
    category: "Operational Delivery Capacity",
    description: "Long-open vacancies may reduce team capacity and affect work delivery.",
    defaultPriority: "Critical",
    scenarioType: "workforce_expansion",
  },
};

export function getRuleMeta(ruleId: string): DecisionRuleMeta {
  return (
    DECISION_RULES[ruleId] ?? {
      id: ruleId,
      name: "Workforce Decision Rule",
      category: "Workforce Risk",
      description: "Automated workforce risk trigger rule.",
      defaultPriority: "Medium",
    }
  );
}

// ─── Client API Functions ─────────────────────────────────────────────────────

const BASE_URL = "/api/decision-cases";

/**
 * Fetch active decision cases with optional filtering.
 * Calls GET /api/v1/decision-cases
 */
export async function fetchDecisionCases(
  params?: DecisionCaseListParams,
  signal?: AbortSignal,
): Promise<DecisionCaseQueryResult> {
  const url = new URL(BASE_URL, window.location.origin);
  if (params) {
    if (params.priority && params.priority !== "All") url.searchParams.set("priority", params.priority);
    if (params.status && params.status !== "All") url.searchParams.set("status", params.status);
    if (params.department && params.department !== "All") url.searchParams.set("department", params.department);
    if (params.employee_id) url.searchParams.set("employee_id", params.employee_id);
    if (params.rule_id && params.rule_id !== "All") url.searchParams.set("rule_id", params.rule_id);
    if (params.active_only !== undefined) url.searchParams.set("active_only", String(params.active_only));
    if (params.refresh !== undefined) url.searchParams.set("refresh", String(params.refresh));
    if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch decision cases (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch a single decision case with complete evidence.
 * Calls GET /api/v1/decision-cases/{case_id}
 */
export async function fetchDecisionCase(
  caseId: string,
  signal?: AbortSignal,
): Promise<DecisionCaseRecord> {
  const url = new URL(BASE_URL, window.location.origin);
  url.searchParams.set("case_id", caseId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch case ${caseId} (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

/**
 * Run decision rules evaluation on the backend.
 * Calls POST /api/v1/decision-cases/evaluate
 */
export async function evaluateDecisionCases(signal?: AbortSignal): Promise<DecisionCaseEvaluationResult> {
  const url = new URL(BASE_URL, window.location.origin);
  url.searchParams.set("action", "evaluate");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to evaluate decision rules (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

/**
 * Update case workflow status.
 * Calls PATCH /api/v1/decision-cases/{case_id}/status
 */
export async function updateDecisionCaseStatus(
  caseId: string,
  status: DecisionCaseStatus,
  signal?: AbortSignal,
): Promise<DecisionCaseRecord> {
  const url = new URL(BASE_URL, window.location.origin);
  url.searchParams.set("case_id", caseId);

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to update case status (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}
