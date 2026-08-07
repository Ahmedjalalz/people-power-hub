import { getAuthHeader } from "@/lib/auth";

export type PerformanceFilters = {
  month?: string;
  department?: string;
  role_band?: string;
};

export type PerformanceOverview = {
  average_performance_score?: number;
  total_employees?: number;
  strong_and_exceptional_count?: number;
  strong_and_exceptional_percentage?: number;
  improving_count?: number;
  declining_count?: number;
  [key: string]: unknown;
};

export type TrendPoint = { Performance_Month?: string; average_performance_score?: number; [key: string]: unknown };
export type DepartmentRow = { department?: string; average_performance_score?: number; employee_count?: number; rank?: number; [key: string]: unknown };
export type DistributionRow = { performance_band?: string; employee_count?: number; percentage?: number; [key: string]: unknown };
export type AttentionRow = {
  employee_id?: string;
  employee_name?: string;
  department?: string;
  latest_performance_score?: number;
  performance_score?: number;
  performance_band?: string;
  three_month_change?: number;
  performance_trend?: string;
  development_kpis?: string[] | string;
  [key: string]: unknown;
};
export type EmployeeKpi = {
  kpi_name?: string;
  actual_value?: number;
  target_value?: number;
  normalized_score?: number;
  weight?: number;
  [key: string]: unknown;
};
export type Recommendation = {
  course_name?: string;
  course_level?: string;
  priority?: string | number;
  recommendation_reason?: string;
  linked_skill?: string;
  linked_kpi?: string;
  review_window?: string;
  [key: string]: unknown;
};
export type LearningRecord = {
  course_name?: string;
  completion_date?: string;
  status?: string;
  Is_Actual_LMS_Record?: string;
  [key: string]: unknown;
};

async function request<T>(params: Record<string, string | undefined>, init?: RequestInit): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const response = await fetch(`/api/performance?${search.toString()}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(init?.headers ?? {}),
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = (payload ?? {}) as Record<string, unknown>;
    const message = record.detail ?? record.error ?? record.message;
    throw new Error(message ? String(message) : "Unable to load performance data.");
  }
  return payload as T;
}

/** Backends wrap collections under different keys — pick the first array we find. */
export function pickArray<T>(payload: unknown, ...keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export function pickObject<T>(payload: unknown, ...keys: string[]): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as T;
  }
  return payload as T;
}

const filterParams = (filters?: PerformanceFilters) => ({
  month: filters?.month,
  department: filters?.department,
  role_band: filters?.role_band,
});

export const getPerformanceOverview = (filters?: PerformanceFilters) =>
  request<Record<string, unknown>>({ resource: "overview", ...filterParams(filters) });

export const getPerformanceTrend = (months = 12, filters?: PerformanceFilters) =>
  request<Record<string, unknown>>({ resource: "trend", months: String(months), ...filterParams(filters) });

export const getPerformanceDepartments = (filters?: PerformanceFilters) =>
  request<Record<string, unknown>>({ resource: "departments", ...filterParams(filters) });

export const getPerformanceDistribution = (filters?: PerformanceFilters) =>
  request<Record<string, unknown>>({ resource: "distribution", ...filterParams(filters) });

export const getPerformanceAttention = (filters?: PerformanceFilters) =>
  request<Record<string, unknown>>({ resource: "attention", ...filterParams(filters) });

export const getPerformanceEmployee = (employeeId: string) =>
  request<Record<string, unknown>>({ resource: "employee", employeeId });

export const getPerformanceEmployeeTrend = (employeeId: string, months = 12) =>
  request<Record<string, unknown>>({ resource: "employee-trend", employeeId, months: String(months) });

export const getPerformanceEmployeeKpis = (employeeId: string) =>
  request<Record<string, unknown>>({ resource: "employee-kpis", employeeId });

export const getPerformanceEmployeeRecommendations = (employeeId: string) =>
  request<Record<string, unknown>>({ resource: "employee-recommendations", employeeId });

export const getPerformanceEmployeeLearningHistory = (employeeId: string) =>
  request<Record<string, unknown>>({ resource: "employee-learning-history", employeeId });

export const askPerformance = (question: string) =>
  request<Record<string, unknown>>({ resource: "ask" }, { method: "POST", body: JSON.stringify({ question }) });
