import type { DecisionCaseRecord } from "@/services/decision-cases";

export type CasePriority = "Critical" | "High" | "Medium" | "Low";

export type CaseStatus = "Open" | "Under Review" | "In Progress" | "Resolved" | "Closed";

export type CaseCategory =
  | "Retention Review"
  | "Retention & Succession"
  | "Critical Vacancy"
  | "Succession Gap"
  | "Compensation Risk"
  | "Skill Gap"
  | "Performance Deterioration"
  | "Budget Compliance"
  | "Capacity Risk";

export interface TriggerEvidence {
  metric: string;
  actual: string | number;
  threshold: string | number;
  status: "violation" | "warning" | "info";
  detail: string;
}

export interface CaseAuditEntry {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  notes?: string;
}

export interface TriggerCase {
  id: string;
  title: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  isOverdue: boolean;
  subjectType: "employee" | "position" | "department" | "organization" | string;
  subjectId: string;
  subjectName: string;
  department: string;
  role: string;
  reason: string;
  evidence: TriggerEvidence[];
  rawEvidence?: Record<string, any>;
  suggestedAction: string;
  actionChecklist: { id: string; text: string; completed: boolean }[];
  assignedTo: string;
  resolutionNotes?: string;
  history: CaseAuditEntry[];
  scenarioType?: string; // Links to Scenario Simulator
  employeeId?: string; // Direct link to Employee profile
  ruleId?: string; // "DTE-001" to "DTE-005"
}

export interface CaseUserMetadata {
  checklist?: { id: string; text: string; completed: boolean }[];
  assignedTo?: string;
  resolutionNotes?: string;
  history?: CaseAuditEntry[];
}

// ─── Initial Seed Cases (Reflecting Backend Rules & Live Data) ──────────────

export const INITIAL_CASES: TriggerCase[] = [
  {
    id: "CASE-A1421EBD35A5",
    title: "Leadership Continuity Risk — Imran Mughal (Head of IT)",
    category: "Retention & Succession",
    priority: "Critical",
    status: "Open",
    createdAt: "2026-09-11T09:00:00Z",
    updatedAt: "2026-09-11T09:00:00Z",
    dueDate: "2026-09-25",
    isOverdue: false,
    subjectType: "employee",
    subjectId: "EMP292",
    subjectName: "Imran Mughal",
    department: "Information Technology",
    role: "Head of IT",
    reason:
      "Key employee may leave and no ready replacement is available. Successor readiness gap identified.",
    evidence: [
      {
        metric: "Attrition Risk",
        actual: "High (Flight Risk Confirmed)",
        threshold: "No Flight Risk",
        status: "violation",
        detail: "CatBoost attrition model predicts departure risk.",
      },
      {
        metric: "Successor Readiness",
        actual: "Ready in 6-12 Months",
        threshold: "Ready Now",
        status: "violation",
        detail: "Top successor Ayesha Mughal requires 6-12 months ramp-up.",
      },
      {
        metric: "Performance Rating",
        actual: "88.5 / 100 (Strong)",
        threshold: "≥ 75.0",
        status: "violation",
        detail: "Critical leadership seat holds essential tech delivery responsibilities.",
      },
    ],
    suggestedAction:
      "Schedule confidential retention interview, review market comp leveling, and model retention package in Scenario Simulator.",
    actionChecklist: [
      { id: "c1", text: "Schedule confidential 1-on-1 retention discussion with employee", completed: false },
      { id: "c2", text: "Evaluate market compensation adjustment against benchmarks", completed: false },
      { id: "c3", text: "Model counter-offer or promotion impact in Scenario Simulator", completed: false },
      { id: "c4", text: "Review acceleration roadmap for top successor (Ayesha Mughal)", completed: false },
    ],
    assignedTo: "HR People Partner",
    history: [
      {
        id: "h1",
        timestamp: "2026-09-11T09:00:00Z",
        author: "Decision Trigger Engine",
        action: "Rule 'DTE-001' matched. Created Critical case.",
      },
    ],
    scenarioType: "employee_promotion",
    employeeId: "EMP292",
    ruleId: "DTE-001",
  },
  {
    id: "CASE-5F72CFD16A48",
    title: "Budget Compliance Risk — 3 Unapproved Positions Filled",
    category: "Budget Compliance",
    priority: "Critical",
    status: "Open",
    createdAt: "2026-09-11T09:00:00Z",
    updatedAt: "2026-09-11T09:00:00Z",
    dueDate: "2026-09-20",
    isOverdue: false,
    subjectType: "organization",
    subjectId: "ORGANIZATION",
    subjectName: "Organization-wide",
    department: "Human Resources, Legal & Compliance",
    role: "Unapproved Headcount",
    reason:
      "A filled position is operating without approved budget. 3 employees allocated without budget line.",
    evidence: [
      {
        metric: "Unapproved Positions",
        actual: "3 Filled Staff",
        threshold: "0 Unbudgeted",
        status: "violation",
        detail: "Affected Departments: Human Resources, Legal & Compliance",
      },
      {
        metric: "Governance Status",
        actual: "Budget Approval Missing",
        threshold: "Approved: Yes",
        status: "violation",
        detail: "Active employees allocated without approved headcount authorization line",
      },
    ],
    suggestedAction:
      "Audit filled unbudgeted headcount with Department Heads and regularize position allocations.",
    actionChecklist: [
      { id: "c1", text: "Audit filled unbudgeted headcount with Department Heads", completed: false },
      { id: "c2", text: "Regularize position allocations in headcount plan", completed: false },
      { id: "c3", text: "Simulate budget variance adjustment in Scenario Simulator", completed: false },
    ],
    assignedTo: "Chief Financial Officer",
    history: [
      {
        id: "h2",
        timestamp: "2026-09-11T09:00:00Z",
        author: "Decision Trigger Engine",
        action: "Rule 'DTE-003' matched. Created Critical case.",
      },
    ],
    scenarioType: "budget_change",
    ruleId: "DTE-003",
  },
  {
    id: "CASE-6C3EA9D5949C",
    title: "Capacity Risk — 62 Long-Open Vacancies Across 12 Departments",
    category: "Capacity Risk",
    priority: "Critical",
    status: "Open",
    createdAt: "2026-09-11T09:00:00Z",
    updatedAt: "2026-09-11T09:00:00Z",
    dueDate: "2026-09-30",
    isOverdue: false,
    subjectType: "organization",
    subjectId: "ORGANIZATION",
    subjectName: "Organization-wide",
    department: "Cross-Department (12 Units)",
    role: "Long-Open Vacancies",
    reason:
      "Long-open vacancies may reduce team capacity and affect work delivery (> 90 days open).",
    evidence: [
      {
        metric: "Long-Open Vacancies",
        actual: "62 Positions",
        threshold: "≤ 30 days",
        status: "violation",
        detail: "Positions vacant > 90 days creating systemic delivery capacity risks",
      },
      {
        metric: "Affected Departments",
        actual: "12 Departments",
        threshold: "Minimal backlog",
        status: "warning",
        detail: "Top: Medical Care (9), Production (8), Engineering (6)",
      },
    ],
    suggestedAction:
      "Review operational capacity impact and prioritize external recruitment or contractor coverage.",
    actionChecklist: [
      { id: "c1", text: "Review team delivery capacity with operational department heads", completed: false },
      { id: "c2", text: "Prioritize external recruitment for top affected business units", completed: false },
      { id: "c3", text: "Simulate contractor & redeployment coverage in Scenario Simulator", completed: false },
    ],
    assignedTo: "Head of Talent Acquisition",
    history: [
      {
        id: "h3",
        timestamp: "2026-09-11T09:00:00Z",
        author: "Decision Trigger Engine",
        action: "Rule 'DTE-005' matched. Created Critical case.",
      },
    ],
    scenarioType: "workforce_expansion",
    ruleId: "DTE-005",
  },
  {
    id: "CASE-33F594CF6495",
    title: "Critical Role Performance Risk — Amna Chaudhry (Head of Operations)",
    category: "Performance Deterioration",
    priority: "High",
    status: "Open",
    createdAt: "2026-09-11T09:00:00Z",
    updatedAt: "2026-09-11T09:00:00Z",
    dueDate: "2026-09-28",
    isOverdue: false,
    subjectType: "employee",
    subjectId: "EMP277",
    subjectName: "Amna Chaudhry",
    department: "Operations",
    role: "Head of Operations",
    reason:
      "Performance is dropping in an important business role (-3.91 pts over 3 months).",
    evidence: [
      {
        metric: "Performance Trend",
        actual: "Declining",
        threshold: "Stable or Improving",
        status: "violation",
        detail: "3-Month Change: -3.91 points",
      },
      {
        metric: "Current Score",
        actual: "80.9 (Strong)",
        threshold: "≥ 80.0",
        status: "warning",
        detail: "Critical Position: Head of Operations",
      },
      {
        metric: "Development Area",
        actual: "Teamwork and Communication (69.9 pts)",
        threshold: "≥ 75.0",
        status: "violation",
        detail: "Identified competency gap requiring structured mentoring intervention",
      },
    ],
    suggestedAction:
      "Review metric trend with executive sponsor, establish targeted development coaching, and simulate reskilling.",
    actionChecklist: [
      { id: "c1", text: "Review performance metric trend with reporting executive", completed: false },
      { id: "c2", text: "Establish targeted development plan for Teamwork and Communication", completed: false },
      { id: "c3", text: "Simulate training & capability uplift in Scenario Simulator", completed: false },
    ],
    assignedTo: "Head of Learning & Development",
    history: [
      {
        id: "h4",
        timestamp: "2026-09-11T09:00:00Z",
        author: "Decision Trigger Engine",
        action: "Rule 'DTE-002' matched. Created High priority case.",
      },
    ],
    scenarioType: "skill_reskilling",
    employeeId: "EMP277",
    ruleId: "DTE-002",
  },
];

// ─── LocalStorage Persistence & Reactive Updates ────────────────────────────

const STORAGE_KEY = "people_power_trigger_cases_v1";
const LAST_RUN_KEY = "people_power_trigger_last_run";

export function loadStoredCases(): TriggerCase[] {
  if (typeof window === "undefined") return INITIAL_CASES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CASES));
      return INITIAL_CASES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // If legacy seed detected without real rules, upgrade to real backend INITIAL_CASES
      const hasRealRules = parsed.some((c: TriggerCase) => Boolean(c.ruleId));
      if (!hasRealRules) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CASES));
        return INITIAL_CASES;
      }
      return parsed;
    }
    return INITIAL_CASES;
  } catch {
    return INITIAL_CASES;
  }
}

export function saveCases(cases: TriggerCase[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event("trigger-cases-updated"));
  } catch (err) {
    console.error("Failed to persist trigger cases:", err);
  }
}

export function getCriticalOpenCount(cases?: TriggerCase[]): number {
  const list = cases ?? loadStoredCases();
  return list.filter((c) => c.priority === "Critical" && c.status !== "Resolved" && c.status !== "Closed").length;
}

export function getActiveCount(cases?: TriggerCase[]): number {
  const list = cases ?? loadStoredCases();
  return list.filter((c) => c.status !== "Resolved" && c.status !== "Closed").length;
}

export function getLastScanTime(): string {
  if (typeof window === "undefined") return "Today at 08:00 AM";
  return localStorage.getItem(LAST_RUN_KEY) || "Today at 08:00 AM";
}

export function setLastScanTime(timeStr: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_RUN_KEY, timeStr);
}

// ─── Case User Metadata Local Persistence (Notes, Checklist, Assignment) ─────

const USER_META_KEY = "people_power_case_user_metadata_v1";

export function loadAllCaseUserMetadata(): Record<string, CaseUserMetadata> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USER_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCaseUserMetadata(caseId: string, meta: Partial<CaseUserMetadata>) {
  if (typeof window === "undefined") return;
  try {
    const all = loadAllCaseUserMetadata();
    all[caseId] = { ...all[caseId], ...meta };
    localStorage.setItem(USER_META_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to persist case user metadata:", err);
  }
}

// ─── Backend OpenAPI Adapter ──────────────────────────────────────────────────

export function adaptBackendCaseToTriggerCase(
  c: DecisionCaseRecord,
  localStore?: Record<string, CaseUserMetadata>
): TriggerCase {
  const local = (localStore && localStore[c.id]) || (typeof window !== "undefined" ? loadAllCaseUserMetadata()[c.id] : undefined) || {};
  const ev = c.evidence || {};

  let category: CaseCategory = "Retention & Succession";
  let scenarioType = "employee_promotion";
  let defaultChecklist = [
    { id: "c1", text: "Conduct initial HR review with line manager", completed: false },
    { id: "c2", text: "Review market benchmarks and team alignment", completed: false },
    { id: "c3", text: "Model intervention impact in Scenario Simulator", completed: false },
  ];

  const structuredEvidence: TriggerEvidence[] = [];

  if (c.rule_id === "DTE-001") {
    category = "Retention & Succession";
    scenarioType = "employee_promotion";
    const successorName = ev.top_successor?.employee_name || "candidate";
    defaultChecklist = [
      { id: "c1", text: "Schedule confidential 1-on-1 retention discussion with employee", completed: false },
      { id: "c2", text: "Evaluate market compensation adjustment against benchmarks", completed: false },
      { id: "c3", text: "Model counter-offer or promotion impact in Scenario Simulator", completed: false },
      { id: "c4", text: `Review acceleration & ramp-up roadmap for top successor (${successorName})`, completed: false },
    ];
    if (ev.attrition_prediction) {
      structuredEvidence.push({
        metric: "Attrition Risk",
        actual: `High (${ev.attrition_prediction === "Yes" ? "Flight Risk Confirmed" : ev.attrition_prediction})`,
        threshold: "No Flight Risk",
        status: "violation",
        detail: `Contributing Factors: ${Array.isArray(ev.attrition_contributing_factors) ? ev.attrition_contributing_factors.join(", ") : "Market parity & satisfaction"}`,
      });
    }
    if (ev.top_successor) {
      structuredEvidence.push({
        metric: "Successor Readiness",
        actual: ev.top_successor.readiness || "Developing",
        threshold: "Ready Now",
        status: "violation",
        detail: `Top candidate: ${ev.top_successor.employee_name} (${ev.top_successor.current_position || "Successor"})`,
      });
    }
    if (ev.performance_score != null) {
      structuredEvidence.push({
        metric: "Performance Rating",
        actual: `${ev.performance_score} / 100 (${ev.performance_band || "Strong"})`,
        threshold: "≥ 75.0",
        status: "violation",
        detail: `Critical Position: ${ev.position_title || "Department Lead"}`,
      });
    }
  } else if (c.rule_id === "DTE-002") {
    category = "Performance Deterioration";
    scenarioType = "skill_reskilling";
    defaultChecklist = [
      { id: "c1", text: "Review performance metric trend with reporting executive", completed: false },
      { id: "c2", text: `Establish targeted development plan for '${ev.development_kpi_1 || "core competency"}'`, completed: false },
      { id: "c3", text: "Simulate training & capability uplift in Scenario Simulator", completed: false },
    ];
    structuredEvidence.push({
      metric: "Performance Trend",
      actual: ev.performance_trend || "Declining",
      threshold: "Stable or Improving",
      status: "violation",
      detail: `3-Month Change: ${ev.three_month_change_points ?? -3.9} points`,
    });
    structuredEvidence.push({
      metric: "Current Score",
      actual: `${ev.latest_performance_score ?? 80.9} (${ev.latest_performance_band || "Strong"})`,
      threshold: "≥ 80.0",
      status: "warning",
      detail: `Critical Position: ${ev.position_title || "Role"}`,
    });
    if (ev.development_kpi_1) {
      structuredEvidence.push({
        metric: "Development Area",
        actual: `${ev.development_kpi_1} (${ev.development_kpi_1_score ?? 69.9} pts)`,
        threshold: "≥ 75.0",
        status: "violation",
        detail: "Identified competency gap requiring structured mentoring intervention",
      });
    }
  } else if (c.rule_id === "DTE-003") {
    category = "Budget Compliance";
    scenarioType = "budget_change";
    defaultChecklist = [
      { id: "c1", text: "Audit filled unbudgeted headcount with Department Heads", completed: false },
      { id: "c2", text: "Regularize position allocations in headcount plan", completed: false },
      { id: "c3", text: "Simulate budget variance adjustment in Scenario Simulator", completed: false },
    ];
    structuredEvidence.push({
      metric: "Unapproved Positions",
      actual: `${ev.exception_count ?? 3} Filled Staff`,
      threshold: "0 Unbudgeted",
      status: "violation",
      detail: `Affected Departments: ${Array.isArray(ev.departments) ? ev.departments.join(", ") : "HR, Legal"}`,
    });
    structuredEvidence.push({
      metric: "Governance Status",
      actual: "Budget Approval Missing",
      threshold: "Approved: Yes",
      status: "violation",
      detail: "Active employees allocated without approved headcount authorization line",
    });
  } else if (c.rule_id === "DTE-004") {
    category = "Critical Vacancy";
    scenarioType = "workforce_expansion";
    defaultChecklist = [
      { id: "c1", text: "Review talent pipeline SLA with talent acquisition team", completed: false },
      { id: "c2", text: "Identify internal succession candidates for redeployment", completed: false },
      { id: "c3", text: "Simulate workforce expansion in Scenario Simulator", completed: false },
    ];
    structuredEvidence.push({
      metric: "Vacancy Duration",
      actual: `${ev.days_vacant ?? 45} days`,
      threshold: "≤ 30 days",
      status: "violation",
      detail: "Critical position vacant exceeding maximum approved SLA window",
    });
  } else if (c.rule_id === "DTE-005") {
    category = "Capacity Risk";
    scenarioType = "workforce_expansion";
    defaultChecklist = [
      { id: "c1", text: "Review team delivery capacity with operational department heads", completed: false },
      { id: "c2", text: "Prioritize external recruitment for top affected business units", completed: false },
      { id: "c3", text: "Simulate contractor & redeployment coverage in Scenario Simulator", completed: false },
    ];
    structuredEvidence.push({
      metric: "Long-Open Vacancies",
      actual: `${ev.long_open_vacancy_count ?? 62} Positions`,
      threshold: "≤ 30 days",
      status: "violation",
      detail: "Positions vacant > 90 days creating systemic delivery capacity risks",
    });
    structuredEvidence.push({
      metric: "Affected Departments",
      actual: `${ev.affected_department_count ?? 12} Departments`,
      threshold: "Minimal backlog",
      status: "warning",
      detail: Array.isArray(ev.top_affected_departments)
        ? `Top: ${ev.top_affected_departments.map((d: any) => `${d.department} (${d.long_open_vacancies})`).slice(0, 3).join(", ")}`
        : "Cross-departmental capacity impact",
    });
  }

  const subjectName =
    ev.employee_name ||
    (c.subject_type === "Organization"
      ? "Organization-wide"
      : c.department || c.subject_id);

  const role = ev.position_title || c.case_type;
  const dept = c.department || ev.department || "Cross-Department";
  const employeeId = c.employee_id || ev.employee_id || (c.subject_type === "Employee" ? c.subject_id : undefined);

  return {
    id: c.id,
    title: c.title,
    category,
    priority: c.priority,
    status: c.status,
    createdAt: c.detected_at,
    updatedAt: c.last_evaluated_at,
    dueDate: c.data_as_of || "2026-09-30",
    isOverdue: false,
    subjectType: c.subject_type.toLowerCase(),
    subjectId: c.subject_id,
    subjectName,
    department: dept,
    role,
    reason: c.reason,
    evidence: structuredEvidence,
    rawEvidence: ev,
    suggestedAction: c.suggested_action,
    actionChecklist: local.checklist || defaultChecklist,
    assignedTo: local.assignedTo || "HR People Partner",
    resolutionNotes: local.resolutionNotes || "",
    history: local.history || [
      {
        id: "h-init",
        timestamp: c.detected_at,
        author: "Decision Trigger Engine",
        action: `Rule '${c.rule_id}' matched. Created ${c.priority} case.`,
      },
    ],
    scenarioType,
    employeeId,
    ruleId: c.rule_id,
  };
}
