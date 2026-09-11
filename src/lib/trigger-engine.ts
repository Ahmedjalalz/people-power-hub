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

// ─── Initial Seed Cases (Reflecting Proposal & Real Data) ───────────────────

export const INITIAL_CASES: TriggerCase[] = [
  {
    id: "CASE-1042",
    title: "Retention Review — Key Operations Lead at Risk",
    category: "Retention Review",
    priority: "Critical",
    status: "Open",
    createdAt: "2026-09-08T09:30:00Z",
    updatedAt: "2026-09-08T09:30:00Z",
    dueDate: "2026-09-15",
    isOverdue: false,
    subjectType: "employee",
    subjectId: "E1042",
    subjectName: "Usman Ali",
    department: "Operations",
    role: "Senior Operations Analyst (L5)",
    reason:
      "A strong-performing employee holds an essential operations role, has an 82% attrition risk score, and has no immediate ready successor.",
    evidence: [
      {
        metric: "Attrition Risk Score",
        actual: "82%",
        threshold: "> 70%",
        status: "violation",
        detail: "ML model flags imminent flight risk within 60–90 days.",
      },
      {
        metric: "Performance Rating",
        actual: "4.8 / 5.0",
        threshold: "≥ 4.0",
        status: "violation",
        detail: "Consistently rated Strong / Exceptional across last 3 review cycles.",
      },
      {
        metric: "Role Criticality",
        actual: "High",
        threshold: "High",
        status: "violation",
        detail: "Single point of failure for core regional settlement dashboards.",
      },
      {
        metric: "Successor Readiness",
        actual: "0% Ready Now",
        threshold: "≥ 50%",
        status: "violation",
        detail: "Nearest successor (Hina Yousaf) requires 3–6 months ramp-up.",
      },
    ],
    suggestedAction:
      "Schedule an immediate 1-on-1 retention discussion with the Department Head, evaluate compensation leveling against market benchmarks, and consider a remote/hybrid retention arrangement.",
    actionChecklist: [
      { id: "c1", text: "Conduct confidential retention interview with Usman", completed: false },
      { id: "c2", text: "Evaluate market compensation adjustment (L5 Ops benchmark)", completed: false },
      { id: "c3", text: "Model counter-offer impact in Scenario Simulator", completed: false },
      { id: "c4", text: "Accelerate handover roadmap for Hina Yousaf", completed: false },
    ],
    assignedTo: "HR People Partner",
    history: [
      {
        id: "h1",
        timestamp: "2026-09-08T09:30:00Z",
        author: "Trigger Engine",
        action: "Rule 'Key Performer Flight Risk' triggered. Created Critical case.",
      },
    ],
    scenarioType: "employee_promotion",
    employeeId: "E1042",
  },
  {
    id: "CASE-1088",
    title: "Critical Vacancy — Senior DevOps & Infrastructure Lead",
    category: "Critical Vacancy",
    priority: "High",
    status: "Under Review",
    createdAt: "2026-09-05T11:00:00Z",
    updatedAt: "2026-09-09T14:20:00Z",
    dueDate: "2026-09-12",
    isOverdue: true,
    subjectType: "position",
    subjectId: "POS-OPS-044",
    subjectName: "Senior DevOps Engineer",
    department: "Operations / Tech",
    role: "Senior Infrastructure Engineer",
    reason:
      "A mission-critical position has exceeded the maximum approved vacancy duration (45 days) with replacement readiness rated low.",
    evidence: [
      {
        metric: "Vacancy Age",
        actual: "52 days",
        threshold: "≤ 30 days",
        status: "violation",
        detail: "Exceeded standard technical hiring SLA by 22 days.",
      },
      {
        metric: "Internal Replacement Readiness",
        actual: "Low (0 Candidates)",
        threshold: "Medium or High",
        status: "violation",
        detail: "No internal engineers currently qualified for Kubernetes/Terraform stack.",
      },
      {
        metric: "Business Impact",
        actual: "High",
        threshold: "Medium",
        status: "violation",
        detail: "Delays in CI/CD pipeline modernization and quarterly security audit.",
      },
    ],
    suggestedAction:
      "Review external recruitment pipeline with the talent acquisition lead or initiate an expedited contractor / redeployment review from Engineering.",
    actionChecklist: [
      { id: "c21", text: "Review talent agency shortlist for senior DevOps profiles", completed: true },
      { id: "c22", text: "Discuss temporary 50% allocation from Platform Engineering", completed: false },
      { id: "c23", text: "Simulate workforce expansion cost in Scenario Simulator", completed: false },
    ],
    assignedTo: "Talent Acquisition Lead",
    history: [
      {
        id: "h21",
        timestamp: "2026-09-05T11:00:00Z",
        author: "Trigger Engine",
        action: "Rule 'Overdue Critical Position Vacancy' triggered. Created High priority case.",
      },
      {
        id: "h22",
        timestamp: "2026-09-09T14:20:00Z",
        author: "Talent Acquisition Lead",
        action: "Status updated to Under Review. Initial candidate screening in progress.",
      },
    ],
    scenarioType: "workforce_expansion",
  },
  {
    id: "CASE-1057",
    title: "Retention Review — Payments Product Manager Disparity",
    category: "Retention Review",
    priority: "High",
    status: "Open",
    createdAt: "2026-09-07T08:15:00Z",
    updatedAt: "2026-09-07T08:15:00Z",
    dueDate: "2026-09-18",
    isOverdue: false,
    subjectType: "employee",
    subjectId: "E1057",
    subjectName: "Sarah Malik",
    department: "Product",
    role: "Product Manager, Payments (L4)",
    reason:
      "Employee has high flight risk (76%), passed over in recent review despite exceptional product delivery, and market salary parity gap exceeds 18%.",
    evidence: [
      {
        metric: "Flight Risk Score",
        actual: "76%",
        threshold: "> 65%",
        status: "violation",
        detail: "Estimated notice window within 30–60 days based on external signals.",
      },
      {
        metric: "Market Comp Ratio",
        actual: "0.82 (18% below)",
        threshold: "≥ 0.95",
        status: "violation",
        detail: "Fintech payment product lead compensation currently lagging market P50.",
      },
      {
        metric: "Performance Score",
        actual: "4.7 / 5.0",
        threshold: "≥ 4.0",
        status: "violation",
        detail: "Successfully rolled out instant settlements 2 weeks ahead of schedule.",
      },
    ],
    suggestedAction:
      "Expedite out-of-cycle promotion evaluation to L5 Product Lead, pair with retention grant, and align on upcoming digital wallet roadmap ownership.",
    actionChecklist: [
      { id: "c31", text: "Review salary band alignment with Head of Product", completed: false },
      { id: "c32", text: "Schedule retention alignment meeting with Sarah", completed: false },
      { id: "c33", text: "Model promotion & comp increase in Scenario Simulator", completed: false },
    ],
    assignedTo: "HR Business Partner (Product)",
    history: [
      {
        id: "h31",
        timestamp: "2026-09-07T08:15:00Z",
        author: "Trigger Engine",
        action: "Rule 'High Performer Comp Disparity' matched. Created High priority case.",
      },
    ],
    scenarioType: "employee_promotion",
    employeeId: "E1057",
  },
  {
    id: "CASE-1099",
    title: "Succession Gap — Financial Controller Single Point of Failure",
    category: "Succession Gap",
    priority: "Medium",
    status: "In Progress",
    createdAt: "2026-09-04T10:00:00Z",
    updatedAt: "2026-09-09T16:45:00Z",
    dueDate: "2026-09-25",
    isOverdue: false,
    subjectType: "employee",
    subjectId: "E1089",
    subjectName: "Ayesha Khan",
    department: "Finance",
    role: "Financial Controller (L6)",
    reason:
      "Critical compliance & audit function has 0 qualified secondary backups identified in succession planning pipeline.",
    evidence: [
      {
        metric: "Succession Bench Depth",
        actual: "0 Candidates",
        threshold: "≥ 2 Candidates",
        status: "violation",
        detail: "No ready or developing deputies designated for statutory audit filings.",
      },
      {
        metric: "Tenure in Role",
        actual: "5.4 years",
        threshold: "> 4 years",
        status: "warning",
        detail: "Extended tenure without rotation increases operational dependency risk.",
      },
    ],
    suggestedAction:
      "Identify 2 high-potential senior accountants for accelerated controllership mentoring and enroll them in statutory reporting certification.",
    actionChecklist: [
      { id: "c41", text: "Nominate internal accountants for succession pool", completed: true },
      { id: "c42", text: "Develop shadowing schedule for Q3 close process", completed: false },
    ],
    assignedTo: "Chief Financial Officer",
    history: [
      {
        id: "h41",
        timestamp: "2026-09-04T10:00:00Z",
        author: "Trigger Engine",
        action: "Rule 'Zero Bench Depth on Critical Function' triggered.",
      },
      {
        id: "h42",
        timestamp: "2026-09-09T16:45:00Z",
        author: "HR BP",
        action: "Assigned mentoring candidates. Moved to In Progress.",
      },
    ],
    scenarioType: "skill_reskilling",
    employeeId: "E1089",
  },
  {
    id: "CASE-1102",
    title: "Skill Gap — Cloud Architecture Certification Overdue",
    category: "Skill Gap",
    priority: "Low",
    status: "Open",
    createdAt: "2026-09-06T14:00:00Z",
    updatedAt: "2026-09-06T14:00:00Z",
    dueDate: "2026-09-30",
    isOverdue: false,
    subjectType: "department",
    subjectId: "DEP-ENG-001",
    subjectName: "Engineering Team",
    department: "Engineering",
    role: "Platform Engineers",
    reason:
      "Annual cloud architect capability target lags company baseline by 35% ahead of migration.",
    evidence: [
      {
        metric: "Target Certification %",
        actual: "25%",
        threshold: "≥ 60%",
        status: "warning",
        detail: "Only 4 out of 16 platform engineers completed AWS/GCP architecture exams.",
      },
    ],
    suggestedAction:
      "Roll out cohort-based cloud certification sprint and sponsor exam voucher packages.",
    actionChecklist: [
      { id: "c51", text: "Distribute training vouchers to 8 engineers", completed: false },
      { id: "c52", text: "Schedule weekly study group sessions", completed: false },
    ],
    assignedTo: "Head of Learning & Development",
    history: [
      {
        id: "h51",
        timestamp: "2026-09-06T14:00:00Z",
        author: "Trigger Engine",
        action: "Capability compliance check completed.",
      },
    ],
    scenarioType: "skill_reskilling",
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CASES;
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
