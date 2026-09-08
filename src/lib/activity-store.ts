import { useSyncExternalStore } from "react";

export interface ActivityLogEntry {
  id: string;
  actionId: string;
  actionTitle: string;
  category: string;
  employeeName: string;
  employeeId?: string;
  department?: string;
  summary: string;
  performedBy: string;
  status: "Completed" | "Pending Approval" | "In Review" | "Scheduled";
  timestamp: string; // ISO 8601 string
  tintClass: string;
  tintVar: string;
  effectiveDate?: string;
  notes?: string;
}

const STORAGE_KEY = "peoplelens_action_activity_log";

// Initial realistic seed entries so Activity tab has meaningful data immediately
const INITIAL_ACTIVITIES: ActivityLogEntry[] = [
  {
    id: "act-101",
    actionId: "bonus-incentive-award",
    actionTitle: "Bonus / Incentive Award",
    category: "Compensation",
    employeeName: "Sara Khan",
    employeeId: "E1004",
    department: "Engineering",
    summary: "Awarded quarterly performance bonus of $2,500 for on-time delivery of enterprise migration project.",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "Completed",
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(), // 28 mins ago
    tintClass: "bg-pastel-sky",
    tintVar: "--pastel-sky",
    effectiveDate: new Date().toISOString().split("T")[0],
    notes: "Approved by VP of Engineering.",
  },
  {
    id: "act-102",
    actionId: "promotion",
    actionTitle: "Promotion",
    category: "Movement",
    employeeName: "Tariq Mehmood",
    employeeId: "E1088",
    department: "Engineering",
    summary: "Processed advancement from Senior Software Engineer to Lead Engineer with updated L6 pay grade.",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "Completed",
    timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(), // 3.5 hours ago
    tintClass: "bg-pastel-mint",
    tintVar: "--pastel-mint",
    effectiveDate: "2026-10-01",
    notes: "Annual talent calibration cycle endorsement.",
  },
  {
    id: "act-103",
    actionId: "probation-confirmation",
    actionTitle: "Probation Confirmation",
    category: "Entry",
    employeeName: "Zoya Ahmed",
    employeeId: "E1102",
    department: "Product Design",
    summary: "Confirmed permanent employment after successful 6-month probation appraisal (Score: 4.8 / 5.0).",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "Completed",
    timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), // ~1 day ago
    tintClass: "bg-pastel-mint",
    tintVar: "--pastel-mint",
    effectiveDate: "2026-09-01",
    notes: "Regularization letter issued to employee.",
  },
  {
    id: "act-104",
    actionId: "allowance-grant-withdrawal",
    actionTitle: "Allowance Grant / Withdrawal",
    category: "Compensation",
    employeeName: "Usman Ali",
    employeeId: "E1042",
    department: "Operations",
    summary: "Granted monthly communication & on-call standby allowance ($120/mo) starting next payroll run.",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "Pending Approval",
    timestamp: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    tintClass: "bg-pastel-teal",
    tintVar: "--pastel-teal",
    effectiveDate: "2026-10-01",
    notes: "Awaiting final sign-off from Head of Operations.",
  },
  {
    id: "act-105",
    actionId: "leave-application",
    actionTitle: "Leave Application",
    category: "Leave & Absence",
    employeeName: "Ayesha Malik",
    employeeId: "E1015",
    department: "Sales",
    summary: "Approved 5 consecutive days of Annual Paid Leave from Oct 12 to Oct 16.",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "Completed",
    timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString(), // ~2 days ago
    tintClass: "bg-pastel-teal",
    tintVar: "--pastel-teal",
    effectiveDate: "2026-10-12",
    notes: "Cover assigned to Hassan Raza.",
  },
  {
    id: "act-106",
    actionId: "job-description-approval",
    actionTitle: "Job description approval",
    category: "Job Architecture",
    employeeName: "Department Wide",
    department: "Engineering",
    summary: "Approved updated organizational job description & competency leveling framework for Senior DevOps Specialist.",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "Completed",
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), // ~3 days ago
    tintClass: "bg-pastel-mint",
    tintVar: "--pastel-mint",
    effectiveDate: "2026-09-01",
    notes: "Synced with salary benchmark data.",
  },
  {
    id: "act-107",
    actionId: "inquiry-suspension",
    actionTitle: "Inquiry / Suspension",
    category: "Discipline",
    employeeName: "Case #DISC-2026-04",
    department: "Operations",
    summary: "Convened fact-finding investigation committee for procedural compliance violation inquiry.",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "In Review",
    timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(), // ~4 days ago
    tintClass: "bg-pastel-peach",
    tintVar: "--pastel-peach",
    notes: "Hearings scheduled for next Tuesday.",
  },
  {
    id: "act-108",
    actionId: "loan-advance-request",
    actionTitle: "Loan / Advance Request",
    category: "Other",
    employeeName: "Bilal Ahmed",
    employeeId: "E1055",
    department: "Support",
    summary: "Approved salary advance of $1,500 with equal installments scheduled across 6 payroll cycles.",
    performedBy: "Ahmad Jalal (HR Lead)",
    status: "Completed",
    timestamp: new Date(Date.now() - 120 * 3600 * 1000).toISOString(), // ~5 days ago
    tintClass: "bg-pastel-lavender",
    tintVar: "--pastel-lavender",
    effectiveDate: "2026-09-15",
    notes: "Deduction mandate submitted to payroll.",
  },
];

let memoryLogs: ActivityLogEntry[] | null = null;
const listeners = new Set<() => void>();

function getStoredLogs(): ActivityLogEntry[] {
  if (memoryLogs !== null) return memoryLogs;

  if (typeof window === "undefined") {
    return INITIAL_ACTIVITIES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryLogs = INITIAL_ACTIVITIES;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
      return INITIAL_ACTIVITIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryLogs = parsed;
      return parsed;
    }
  } catch (err) {
    console.error("Failed to read activity log from storage", err);
  }

  memoryLogs = INITIAL_ACTIVITIES;
  return INITIAL_ACTIVITIES;
}

function saveLogs(logs: ActivityLogEntry[]) {
  memoryLogs = logs;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error("Failed to write activity log to storage", err);
    }
  }
  listeners.forEach((listener) => listener());
}

export function addActivityLog(
  entry: Omit<ActivityLogEntry, "id" | "timestamp"> & { timestamp?: string }
): ActivityLogEntry {
  const newEntry: ActivityLogEntry = {
    ...entry,
    id: "act-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  const current = getStoredLogs();
  const updated = [newEntry, ...current];
  saveLogs(updated);
  return newEntry;
}

export function resetActivityLogsToDefault() {
  saveLogs(INITIAL_ACTIVITIES);
}

export function clearActivityLogs() {
  saveLogs([]);
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useActivityLog(): ActivityLogEntry[] {
  return useSyncExternalStore(subscribe, getStoredLogs, () => INITIAL_ACTIVITIES);
}

export const useActivityLogs = useActivityLog;
