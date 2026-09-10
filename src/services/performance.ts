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

export type TrendPoint = {
  // PascalCase (API)
  Performance_Month?: string;
  Final_Performance_Score?: number;
  Average_Performance_Score?: number;
  Performance_Band?: string;
  Average_Evidence_Quality?: number;
  Critical_KPI_Breach_Flag?: string;
  // snake_case fallbacks
  average_performance_score?: number;
  month?: string;
  score?: number;
  [key: string]: unknown;
};
export type DepartmentRow = {
  // PascalCase (API)
  Department?: string;
  Average_Performance_Score?: number;
  Employee_Count?: number;
  Rank?: number;
  // snake_case fallbacks
  department?: string;
  average_performance_score?: number;
  employee_count?: number;
  rank?: number;
  [key: string]: unknown;
};
export type DistributionRow = {
  // PascalCase (API)
  Performance_Band?: string;
  Employee_Count?: number;
  Percentage?: number;
  // snake_case fallbacks
  performance_band?: string;
  employee_count?: number;
  percentage?: number;
  [key: string]: unknown;
};
export type AttentionRow = {
  // PascalCase (API)
  Employee_ID?: string;
  Employee_Name?: string;
  Department?: string;
  Position_Title?: string;
  Role_Band?: string;
  Latest_Performance_Score?: number;
  Latest_Performance_Band?: string;
  Three_Month_Change_Points?: number;
  Performance_Trend?: string;
  Development_KPI_1?: string;
  Development_KPI_1_Score?: number;
  Development_KPI_2?: string;
  Development_KPI_2_Score?: number;
  // snake_case fallbacks
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
  // PascalCase (from API)
  KPI_ID?: string;
  KPI_Name?: string;
  KPI_Group?: string;
  Measurement_Scope?: string;
  Measurement_Unit?: string;
  Operational_Target_Value?: number;
  Operational_Actual_Value?: number;
  Operational_Unit?: string;
  Actual_KPI_Value?: number;
  Floor_Value?: number;
  Target_Value?: number;
  Stretch_Value?: number;
  Scoring_Direction?: string;
  Normalized_KPI_Score?: number;
  KPI_Weight_pct?: number;
  Weighted_Score?: number;
  Evidence_Source_Mode?: string;
  Production_Replacement_Source?: string;
  Evidence_Quality_Score?: number;
  Performance_Month?: string;
  // snake_case fallbacks
  kpi_id?: string;
  kpi_name?: string;
  actual_value?: number;
  target_value?: number;
  normalized_score?: number;
  weight?: number;
  [key: string]: unknown;
};
export type Recommendation = {
  // PascalCase (from API)
  Recommendation_ID?: string;
  Employee_ID?: string;
  Employee_Name?: string;
  Department_ID?: string;
  Department?: string;
  Business_Unit?: string;
  Position_ID?: string;
  Position_Title?: string;
  Role_Band?: string;
  Latest_Performance_Score?: number;
  Latest_Performance_Band?: string;
  Performance_Trend?: string;
  Three_Month_Change_Points?: number;
  Recommendation_Trigger?: string;
  Development_KPI_ID?: string | null;
  Development_KPI_Name?: string | null;
  Development_KPI_Score?: number | null;
  Skill_ID?: string;
  Skill_Name?: string;
  Current_Proficiency_Level?: number;
  Required_Proficiency_Level?: number;
  Current_Skill_Score?: number;
  Required_Minimum_Skill_Score?: number;
  Mandatory_Role_Skill?: string;
  Position_Skill_Weight_pct?: number;
  Course_ID?: string;
  Course_Name?: string;
  Course_Level?: string;
  Recommendation_Rank?: number;
  Priority_Score?: number;
  Priority?: string;
  Recommendation_Basis?: string;
  How_Course_Supports_Performance?: string;
  Professional_Growth_Insight?: string;
  Post_Course_Review_Metric?: string;
  Recommended_Review_Window_Days?: number;
  Recommendation_Status?: string;
  Recommendation_Mode?: string;
  Data_As_Of_Date?: string;
  // snake_case fallbacks
  course_name?: string;
  course_level?: string;
  priority?: string | number;
  recommendation_reason?: string;
  linked_skill?: string;
  linked_kpi?: string;
  review_window?: string | number;
  [key: string]: unknown;
};
export type LearningRecord = {
  // PascalCase (from API)
  Learning_Record_ID?: string;
  Employee_ID?: string;
  Employee_Name?: string;
  Department_ID?: string;
  Department?: string;
  Position_ID?: string;
  Position_Title?: string;
  Role_Band?: string;
  Course_ID?: string;
  Course_Name?: string;
  Course_Level?: string;
  Skill_ID?: string;
  Skill_Name?: string;
  Current_Proficiency_Level?: number;
  Current_Skill_Score?: number;
  Certification_Status?: string;
  Learning_Status?: string;
  Completion_Date?: string;
  Position_Required_Skill?: string;
  History_Basis?: string;
  Record_Source?: string;
  Is_Actual_LMS_Record?: string;
  Data_As_Of_Date?: string;
  // snake_case fallbacks
  course_name?: string;
  completion_date?: string;
  status?: string;
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
  if (!payload) return null;
  
  if (Array.isArray(payload)) {
    return payload.length > 0 ? pickObject<T>(payload[0], ...keys) : null;
  }
  
  if (typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  const targetKeys = [
    "average_performance_score",
    "Average_Performance_Score",
    "total_employees",
    "Total_Employees",
    "strong_and_exceptional_count",
    "Strong_And_Exceptional_Count",
    "strong_or_exceptional_count",
    "Strong_Or_Exceptional_Count",
    "performance_score",
    "Performance_Score",
    "employee_name",
    "Employee_Name",
    "latest_performance_score",
    "Latest_Performance_Score",
  ];

  // 1. If the root object itself has target keys, use it
  for (const tKey of targetKeys) {
    if (tKey in record) {
      return payload as T;
    }
  }

  // 2. Otherwise look inside specified keys
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as T;
    }
  }

  // 3. Scan all properties to find any nested object that has target keys
  for (const value of Object.values(record)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedObj = value as Record<string, unknown>;
      for (const tKey of targetKeys) {
        if (tKey in nestedObj) {
          return value as T;
        }
      }
    }
  }

  // 4. Fallback to first non-array object found
  for (const value of Object.values(record)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as T;
    }
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
