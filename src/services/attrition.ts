import { getAuthHeader } from "@/lib/auth";

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

export type AttritionRateResponse = {
  status: "success";
  visual: "attrition_rate_overview";
  title: string;
  description: string;
  prediction_window: string;
  risk_threshold: number;
  total_employees: number;
  attrition_rate_percent: number;
  people_at_risk: number;
  people_not_at_risk: number;
  card: {
    label: string;
    value_percent: number;
    supporting_text: string;
  };
  chart: {
    type: string;
    name_key: string;
    value_key: string;
    segments: {
      risk_status: string;
      employee_count: number;
      percentage: number;
    }[];
  };
  interpretation_note: string;
  people_at_risk_endpoint: string;
};

export type AtRiskEmployee = {
  employee_id: string;
  employee_name: string;
  department: string;
  position_id?: string;
  position_title: string;
  designation?: string;
  job_level?: string;
  position_criticality?: string;
  attrition_status?: string;
  risk_score_percent: number;
  attrition_factors?: string[];
  detail_endpoint?: string;
  profile_endpoint?: string;
  retention_priority?: string;
  model_confidence?: string;
  tenure_months?: number;
  top_drivers?: { rank: number; feature_key: string; label: string; impact_direction: string; raw_value: string }[];
};

export type PeopleAtRiskResponse = {
  status: "success";
  visual?: string;
  total_at_risk?: number;
  returned_count?: number;
  risk_score_field?: string;
  total_matching?: number;
  offset?: number;
  limit?: number;
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`/api/attrition?${params.toString()}`, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
        ...(options?.headers ?? {}),
      },
    });
    clearTimeout(timeoutId);
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
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const defaultDepartmentRisk: DepartmentRiskResponse = {
  status: "success",
  visual: "attrition_risk_by_department",
  metric: "Attrition Risk",
  total_departments: 5,
  total_people_at_risk: 12,
  highest_risk_department: {
    rank: 1,
    department: "Sales",
    people_at_risk: 4,
    total_employees: 30,
    risk_rate_percent: 13.3,
    people_at_risk_endpoint: "/api/attrition?resource=people-at-risk&department=Sales",
  },
  departments: [
    { rank: 1, department: "Sales", people_at_risk: 4, total_employees: 30, risk_rate_percent: 13.3, people_at_risk_endpoint: "/api/attrition?resource=people-at-risk&department=Sales" },
    { rank: 2, department: "Technology", people_at_risk: 3, total_employees: 45, risk_rate_percent: 6.7, people_at_risk_endpoint: "/api/attrition?resource=people-at-risk&department=Technology" },
    { rank: 3, department: "Marketing", people_at_risk: 2, total_employees: 20, risk_rate_percent: 10.0, people_at_risk_endpoint: "/api/attrition?resource=people-at-risk&department=Marketing" },
    { rank: 4, department: "Customer Support", people_at_risk: 2, total_employees: 25, risk_rate_percent: 8.0, people_at_risk_endpoint: "/api/attrition?resource=people-at-risk&department=Customer%20Support" },
    { rank: 5, department: "Finance", people_at_risk: 1, total_employees: 15, risk_rate_percent: 6.7, people_at_risk_endpoint: "/api/attrition?resource=people-at-risk&department=Finance" },
  ],
};

export const defaultPeopleAtRisk: PeopleAtRiskResponse = {
  status: "success",
  visual: "people_at_risk_detail",
  total_at_risk: 10,
  returned_count: 10,
  total_matching: 10,
  offset: 0,
  limit: 10,
  risk_score_field: "risk_score_percent",
  employees: [
    {
      employee_id: "E1042",
      employee_name: "Usman Ali",
      department: "Operations",
      position_id: "POS-1042",
      position_title: "Senior Operations Analyst",
      designation: "Senior Operations Analyst",
      job_level: "L5",
      position_criticality: "High",
      attrition_status: "At Risk",
      risk_score_percent: 88,
      retention_priority: "Immediate Attention",
      model_confidence: "High",
      tenure_months: 106,
      attrition_factors: ["Frequent Overtime", "Below Market Ratio"],
      detail_endpoint: "/api/attrition?resource=detail&employeeId=E1042",
      profile_endpoint: "/api/attrition?resource=profile&employeeId=E1042",
      top_drivers: [
        { rank: 1, feature_key: "overtime", label: "Frequent Overtime", impact_direction: "increases_risk", raw_value: "Yes" },
        { rank: 2, feature_key: "compensation", label: "Below Market Ratio", impact_direction: "increases_risk", raw_value: "0.82" },
      ],
    },
    {
      employee_id: "E1088",
      employee_name: "Fatima Noor",
      department: "Technology",
      position_id: "POS-1088",
      position_title: "Lead Cloud Architect",
      designation: "Lead Cloud Architect",
      job_level: "L6",
      position_criticality: "High",
      attrition_status: "At Risk",
      risk_score_percent: 82,
      retention_priority: "Immediate Attention",
      model_confidence: "High",
      tenure_months: 48,
      attrition_factors: ["Project Load Spikes", "High Criticality Role"],
      detail_endpoint: "/api/attrition?resource=detail&employeeId=E1088",
      profile_endpoint: "/api/attrition?resource=profile&employeeId=E1088",
      top_drivers: [
        { rank: 1, feature_key: "workload", label: "Project Load Spikes", impact_direction: "increases_risk", raw_value: "Critical" },
      ],
    },
    {
      employee_id: "E1015",
      employee_name: "Sara Khan",
      department: "Customer Support",
      position_id: "POS-1015",
      position_title: "Tier 2 Support Specialist",
      designation: "Tier 2 Support Specialist",
      job_level: "L3",
      position_criticality: "Medium",
      attrition_status: "At Risk",
      risk_score_percent: 74,
      retention_priority: "Active Monitoring",
      model_confidence: "Medium",
      tenure_months: 28,
      attrition_factors: ["Extended Time in Role", "Limited Mobility"],
      detail_endpoint: "/api/attrition?resource=detail&employeeId=E1015",
      profile_endpoint: "/api/attrition?resource=profile&employeeId=E1015",
      top_drivers: [
        { rank: 1, feature_key: "promotions", label: "Time in Role", impact_direction: "increases_risk", raw_value: "28m" },
      ],
    },
  ],
};

export const getAttritionSummary = () => request<AttritionSummary>(new URLSearchParams({ resource: "summary" }));

export const getAttritionRate = () => request<AttritionRateResponse>(new URLSearchParams({ resource: "attrition-rate" }));

export const getPeopleAtRisk = (limit = 50) =>
  request<PeopleAtRiskResponse>(new URLSearchParams({ resource: "people-at-risk", offset: "0", limit: String(limit) }))
    .catch((err) => {
      console.warn("[Attrition] Using default people at risk:", err);
      return defaultPeopleAtRisk;
    });

export const getPersonAtRiskDetail = (employeeId: string) =>
  request<AtRiskDetail>(new URLSearchParams({ resource: "detail", employeeId }));

export const getEmployeeProfile = (employeeId: string) =>
  request<EmployeeProfileResponse>(new URLSearchParams({ resource: "profile", employeeId }));

export const getDepartmentRisk = () =>
  request<DepartmentRiskResponse>(new URLSearchParams({ resource: "department-risk" }))
    .catch((err) => {
      console.warn("[Attrition] Using default department risk:", err);
      return defaultDepartmentRisk;
    });

export const getTopRiskDrivers = (limit = 3) =>
  request<TopRiskDriversResponse>(new URLSearchParams({ resource: "top-risk-drivers", limit: String(limit) }));

export const refreshAttritionDashboard = () =>
  request<AttritionSummary>(new URLSearchParams({ resource: "refresh" }), { method: "POST" });
