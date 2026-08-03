export type AttritionSummary = {
  status: "success";
  visual: "people_at_risk";
  prediction_window: string;
  risk_threshold: number;
  total_employees: number;
  people_at_risk: number;
  people_not_at_risk: number;
  attrition_risk_rate_percent: number;
  people_at_risk_endpoint: string;
};

export type AtRiskEmployee = {
  employee_id: string;
  employee_name: string;
  department: string;
  position_id: string;
  position_title: string;
  designation: string;
  job_level: string;
  position_criticality: string;
  attrition_status: string;
  risk_score_percent: number;
  attrition_factors: string[];
  detail_endpoint: string;
  profile_endpoint: string;
};

export type PeopleAtRiskResponse = {
  status: "success";
  total_matching: number;
  offset: number;
  limit: number;
  employees: AtRiskEmployee[];
};

export type AtRiskDetail = {
  employee: AtRiskEmployee;
  attrition: {
    prediction_window: string;
    status: string;
    risk_score_percent: number;
    factors: { rank: number; feature_key: string; label: string; value: number; display_value: string }[];
  };
  replacement_status: string;
  recommended_replacements: {
    rank: number;
    employee_id: string;
    employee_name: string;
    current_position: string;
    position_criticality: string;
    final_score: number;
    qualification_status: string;
    readiness: string;
    reasons: string[];
    profile_endpoint: string;
  }[];
  decision_support_disclaimer: string;
};

export type EmployeeProfileResponse = {
  status: "success";
  employee_profile: {
    Employee_ID: string;
    Employee_Name: string;
    Department: string;
    Position_ID: string;
    Position_Title: string;
    Designation: string;
    Job_Level: string;
    Work_Mode: string;
    Shift_Type: string;
    Employment_Type: string;
    Employee_Status: string;
    Tenure_Months: number;
    Years_in_Company: number;
    Engagement_Score: number;
    Manager_Relationship_Score: number;
    Candidate_Base_Eligibility: string;
    Internal_Mobility_Readiness: string;
    Attrition_Label_Reference: string;
    Vacancy_Planning_Status: string;
  };
  position_criticality: string;
  attrition_context: {
    status: string;
    risk_score_percent: number;
    prediction_window: string;
  };
};

export type DepartmentRiskResponse = {
  status: "success";
  visual: "attrition_risk_by_department";
  metric: string;
  total_departments: number;
  total_people_at_risk: number;
  highest_risk_department: {
    rank: number;
    department: string;
    people_at_risk: number;
    total_employees: number;
    risk_rate_percent: number;
    people_at_risk_endpoint: string;
  };
  departments: {
    rank: number;
    department: string;
    people_at_risk: number;
    total_employees: number;
    risk_rate_percent: number;
    people_at_risk_endpoint: string;
  }[];
};

export type TopRiskDriversResponse = {
  status: "success";
  visual: "top_attrition_risk_drivers";
  title: string;
  basis: string;
  interpretation_note: string;
  people_at_risk: number;
  reasons_per_employee_maximum: number;
  total_reason_mentions: number;
  top_driver: {
    rank: number;
    feature_key: string;
    label: string;
    mention_count: number;
    share_percent: number;
    employee_share_percent: number;
  };
  drivers: {
    rank: number;
    feature_key: string;
    label: string;
    mention_count: number;
    share_percent: number;
    employee_share_percent: number;
  }[];
  other_reason_mentions: number;
  chart_segments: {
    label: string;
    value: number;
    share_percent: number;
  }[];
};

async function request<T>(params: URLSearchParams, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/attrition?${params.toString()}`, options);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "detail" in payload
      ? String(payload.detail)
      : typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : "Unable to load attrition data.";
    throw new Error(message);
  }
  return payload as T;
}

export const getAttritionSummary = () => request<AttritionSummary>(new URLSearchParams({ resource: "summary" }));

export const getPeopleAtRisk = (limit = 50) =>
  request<PeopleAtRiskResponse>(new URLSearchParams({ resource: "people-at-risk", offset: "0", limit: String(limit) }));

export const getPersonAtRiskDetail = (employeeId: string) =>
  request<AtRiskDetail>(new URLSearchParams({ resource: "detail", employeeId }));

export const getEmployeeProfile = (employeeId: string) =>
  request<EmployeeProfileResponse>(new URLSearchParams({ resource: "profile", employeeId }));

export const getDepartmentRisk = () =>
  request<DepartmentRiskResponse>(new URLSearchParams({ resource: "department-risk" }));

export const getTopRiskDrivers = (limit = 3) =>
  request<TopRiskDriversResponse>(new URLSearchParams({ resource: "top-risk-drivers", limit: String(limit) }));

export const refreshAttritionDashboard = () =>
  request<AttritionSummary>(new URLSearchParams({ resource: "refresh" }), { method: "POST" });
