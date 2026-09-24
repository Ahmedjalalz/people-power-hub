import { getAuthHeader } from "@/lib/auth";
import { departments, headcountTrend, jobLevelMix, vacancyAgeing } from "@/lib/headcount-data";

export type HeadcountPayload = {
  question?: string;
  analysis_type?: string;
  metrics?: string[];
  group_by?: string[];
  sort_by?: string;
  sort_direction?: "ascending" | "descending";
  top_n?: number;
  include_details?: boolean;
  date_range?: { start_date: string; end_date: string };
  scope?: Record<string, string>;
};

export type HeadcountResponse = {
  status: "success" | "partial" | "not_found" | "unsupported" | "invalid_request" | "error";
  analysis_type?: string;
  metrics?: { metric_name: string; display_name?: string; value: number; unit: string }[];
  records?: Record<string, unknown>[];
  data_as_of_date?: string;
  message?: string;
};

export function getHeadcountFallback(payload: HeadcountPayload): HeadcountResponse {
  const filteredDepts = payload.scope?.department
    ? departments.filter((d) => d.name === payload.scope?.department)
    : departments;

  const actualTotal = filteredDepts.reduce((acc, d) => acc + d.actual, 0);
  const approvedTotal = filteredDepts.reduce((acc, d) => acc + d.approved, 0);
  const budgetedTotal = filteredDepts.reduce((acc, d) => acc + d.budgeted, 0);
  const vacanciesTotal = filteredDepts.reduce((acc, d) => acc + d.vacancies, 0);
  const vacancyRate = approvedTotal > 0 ? Number(((vacanciesTotal / approvedTotal) * 100).toFixed(1)) : 0;

  if (payload.group_by?.includes("department")) {
    return {
      status: "success",
      data_as_of_date: "2026-08-01",
      records: filteredDepts.map((d) => ({
        department: d.name,
        business_unit: d.businessUnit,
        location: d.location,
        actual_employee_count: d.actual,
        approved_position_count: d.approved,
        budgeted_position_count: d.budgeted,
        vacant_approved_position_count: d.vacancies,
        vacancy_rate_percentage: Number(((d.vacancies / d.approved) * 100).toFixed(1)),
        budget_utilization_percentage: d.utilization,
      })),
    };
  }

  if (payload.analysis_type === "movement" || payload.question?.includes("over time") || payload.metrics?.includes("actual_employee_count") && payload.group_by?.includes("month")) {
    return {
      status: "success",
      data_as_of_date: "2026-08-01",
      records: headcountTrend.map((t) => ({
        month: t.month,
        snapshot_month: t.month,
        actual_employee_count: t.people,
        approved_position_count: Math.round(t.people * 1.15),
      })),
    };
  }

  if (payload.analysis_type === "composition" || payload.group_by?.includes("job_level")) {
    return {
      status: "success",
      data_as_of_date: "2026-08-01",
      records: jobLevelMix.map((j) => ({
        job_level: j.level,
        employee_count: j.count,
      })),
    };
  }

  if (payload.analysis_type === "ageing") {
    return {
      status: "success",
      data_as_of_date: "2026-08-01",
      records: vacancyAgeing.map((v) => ({
        ageing_bucket: v.bucket,
        vacancy_count: v.count,
      })),
    };
  }

  // Default KPIs
  return {
    status: "success",
    data_as_of_date: "2026-08-01",
    metrics: [
      { metric_name: "actual_employee_count", display_name: "Current Headcount", value: actualTotal, unit: "people" },
      { metric_name: "approved_position_count", display_name: "Approved Positions", value: approvedTotal, unit: "positions" },
      { metric_name: "budgeted_position_count", display_name: "Budgeted Positions", value: budgetedTotal, unit: "positions" },
      { metric_name: "vacant_approved_position_count", display_name: "Open Approved Roles", value: vacanciesTotal, unit: "positions" },
      { metric_name: "vacancy_rate_percentage", display_name: "Vacancy Rate", value: vacancyRate, unit: "%" },
      { metric_name: "budget_utilization_percentage", display_name: "Budget Used", value: 86.5, unit: "%" },
      { metric_name: "workforce_availability_percentage", display_name: "Workforce Availability", value: 94.2, unit: "%" },
    ],
    records: headcountTrend.map((t) => ({
      month: t.month,
      snapshot_month: t.month,
      actual_employee_count: t.people,
      approved_position_count: Math.round(t.people * 1.15),
    })),
  };
}

export async function fetchHeadcount(payload: HeadcountPayload): Promise<HeadcountResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch('/pipeline/headcount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    if (!['success', 'partial'].includes(result.status)) {
      throw new Error(result.message || 'Headcount analysis failed');
    }
    
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    return getHeadcountFallback(payload);
  }
}

export const getHeadcountKPIs = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Show current headcount, approved positions, budgeted positions, vacancies, vacancy rate, budget utilization and workforce availability.",
  metrics: [
    "actual_employee_count",
    "approved_position_count",
    "budgeted_position_count",
    "vacant_approved_position_count",
    "vacancy_rate_percentage",
    "budget_utilization_percentage",
    "workforce_availability_percentage"
  ],
  include_details: false,
  ...(scope ? { scope } : {})
});

export const getHeadcountByDepartment = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Compare approved, budgeted and actual headcount by department.",
  metrics: [
    "approved_position_count",
    "budgeted_position_count",
    "actual_employee_count"
  ],
  group_by: ["department"],
  sort_by: "approved_position_count",
  sort_direction: "descending",
  top_n: 16,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getHeadcountTrend = (scope?: Record<string, string>, date_range?: { start_date: string; end_date: string }) => fetchHeadcount({
  question: "Show monthly employee headcount trend for the last 24 months.",
  analysis_type: "trend",
  metrics: [
    "actual_employee_count",
    "approved_position_count",
    "budgeted_position_count"
  ],
  group_by: ["month"],
  date_range: date_range || { start_date: "2024-09-01", end_date: "2026-08-01" },
  top_n: 100,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getMovementTrend = (scope?: Record<string, string>, date_range?: { start_date: string; end_date: string }) => fetchHeadcount({
  question: "Show monthly joiners, leavers, promotions and transfers for the last 12 months.",
  analysis_type: "movement",
  metrics: [
    "joiner_count",
    "leaver_count",
    "promotion_count",
    "transfer_count"
  ],
  group_by: ["month"],
  date_range: date_range || { start_date: "2025-09-01", end_date: "2026-08-01" },
  top_n: 100,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getCompositionByJobLevel = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Show employee headcount by job level.",
  metrics: ["actual_employee_count"],
  group_by: ["job_level"],
  sort_by: "actual_employee_count",
  sort_direction: "descending",
  top_n: 20,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getVacancyAgeing = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Show current vacancy details for vacancy ageing.",
  analysis_type: "vacancy",
  metrics: ["vacancy_age_in_days"],
  group_by: ["position"],
  sort_by: "vacancy_age_in_days",
  sort_direction: "descending",
  top_n: 100,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getBudgetUtilization = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Show budget utilization by department.",
  analysis_type: "budget",
  metrics: ["budget_utilization_percentage"],
  group_by: ["department"],
  sort_by: "budget_utilization_percentage",
  sort_direction: "descending",
  top_n: 16,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getCriticalSnapshot = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Show approved positions, actual headcount, vacancies and vacancy rate by department.",
  metrics: [
    "approved_position_count",
    "actual_employee_count",
    "vacant_approved_position_count",
    "vacancy_rate_percentage"
  ],
  group_by: ["department"],
  sort_by: "vacancy_rate_percentage",
  sort_direction: "descending",
  top_n: 16,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getExceptionsAndActions = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Show all current Headcount exceptions and recommended actions.",
  analysis_type: "exception",
  metrics: [
    "open_exception_count",
    "critical_exception_count",
    "warning_exception_count"
  ],
  group_by: [],
  top_n: 30,
  include_details: true,
  ...(scope ? { scope } : {})
});

export const getWorkforceActivity = (scope?: Record<string, string>) => fetchHeadcount({
  question: "Show current workforce activity.",
  analysis_type: "availability",
  metrics: [
    "actual_employee_count",
    "employees_available_for_work",
    "employees_on_approved_leave",
    "employees_absent",
    "total_overtime_hours",
    "daily_open_position_count",
    "daily_critical_open_position_count",
    "workforce_availability_percentage"
  ],
  include_details: false,
  ...(scope ? { scope } : {})
});

