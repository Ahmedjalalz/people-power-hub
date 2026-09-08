/**
 * PeopleLens Action Center API Client
 * Connects frontend workflows to the backend workforce API (FastAPI / Render).
 */

import { useState, useEffect, useCallback, useMemo } from "react";

export const CARD_TO_PROCESS_CODE: Record<string, string> = {
  "probation-confirmation": "PROB_CONFIRM",
  "probation-extension": "PROB_EXTEND",
  "contract-renewal-extension": "CONTRACT_RENEW",
  "rejoining-rehire": "REHIRE",
  "promotion": "PROMOTION",
  "transfer": "TRANSFER",
  "acting-additional-charge": "ACTING_CHARGE",
  "demotion": "DEMOTION",
  "deputation-secondment": "SECONDMENT",
  "contract-end-non-renewal": "CONTRACT_END",
  "final-settlement": "FINAL_SETTLEMENT",
  "resignation": "RESIGNATION",
  "retirement": "RETIREMENT",
  "termination": "TERMINATION",
  "resignation-withdrawal": "RESIGN_WITHDRAW",
};

export const PROCESS_CODE_TO_CARD_ID: Record<string, string> = Object.entries(
  CARD_TO_PROCESS_CODE
).reduce((acc, [cardId, code]) => {
  acc[code] = cardId;
  return acc;
}, {} as Record<string, string>);

export interface ActionProcessStatistics {
  recorded_all_time: number;
  recorded_last_30_days: number;
  last_performed_at: string | null;
  last_performed_by: string | null;
  status_counts: Record<string, number>;
}

export interface ActionProcessItem {
  Process_Code: string;
  Process_Name: string;
  Process_Group: "ENTRY" | "MOVEMENT" | "EXIT" | string;
  Purpose: string;
  Execution_Mode: string;
  Core_Impact: string;
  Form_Field_Count: number;
  statistics: ActionProcessStatistics;
}

export interface ActionProcessField {
  Process_Code: string;
  Field_Order: number;
  Field_Key: string;
  Field_Label: string;
  Field_Type: string;
  Required: "Yes" | "No";
  Lookup_Source?: string;
  Validation_Rule?: string;
  Default_Source?: string;
  Notes?: string;
}

export interface ActionProcessDetail extends ActionProcessItem {
  Why_Kept?: string;
  Existing_Data_Reused?: string;
  Requires_Effective_Date?: string;
  Sort_Order?: number;
  fields: ActionProcessField[];
}

export interface ActionRecordItem {
  Action_Record_ID: string;
  Process_Code: string;
  Process_Name: string;
  Employee_ID: string;
  Employee_Name: string;
  Department_Name: string;
  Recorded_DateTime: string;
  Effective_Date: string;
  Record_Status: "APPLIED" | "SCHEDULED" | "WITHDRAWN" | string;
  Performed_By_Name: string;
  Reason_Category?: string;
  Reason_Details?: string;
  Target_Department_Name?: string;
  Target_Position_Title?: string;
  Action_Data_JSON?: string;
}

export interface ActionActivityEvent {
  Event_ID: string;
  Action_Record_ID: string;
  Process_Code: string;
  Employee_ID: string;
  Event_Type: string;
  Event_DateTime: string;
  Performed_By_Name: string;
  Previous_Status: string;
  New_Status: string;
  Effect: string;
  Note: string;
}

export interface ActionSummaryResponse {
  status: string;
  total_action_records: number;
  applied: number;
  scheduled: number;
  withdrawn: number;
  active_operational_employees: number;
  inactive_operational_employees: number;
  process_count: number;
  by_process: Array<{
    Process_Code: string;
    Process_Name: string;
    count: number;
  }>;
  by_group: Array<{
    Process_Group: string;
    count: number;
  }>;
}

export interface ActionOptionsResponse {
  status: string;
  process_code: string;
  employee?: any;
  departments?: Array<{
    Department_ID: string;
    Department_Name: string;
    Business_Unit_Name: string;
  }>;
  positions?: Array<{
    Position_ID: string;
    Position_Title: string;
    Designation: string;
    Department_ID: string;
    Department: string;
    Job_Level: string;
    Position_Status: string;
    Budgeted_Position: string;
    Position_Criticality: string;
  }>;
}

export interface ActionExecutePayload {
  employee_id?: string;
  employee_name?: string;
  fields: Record<string, any>;
}

// Helper to query our proxy
async function proxyRequest<T>(
  subpath: string,
  options: {
    method?: string;
    params?: Record<string, string | number | undefined | null>;
    body?: any;
  } = {}
): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const origin = isBrowser ? window.location.origin : "http://localhost:3000";
  const url = new URL("/api/action-center", origin);
  url.searchParams.set("path", subpath);

  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch top-level Action Center summary
 */
export async function fetchActionCenterSummary(): Promise<ActionSummaryResponse> {
  return proxyRequest<ActionSummaryResponse>("/summary");
}

/**
 * Fetch list of all 15 operational processes and their statistics
 */
export async function fetchActionProcesses(limit = 100): Promise<{
  status: string;
  count: number;
  records: ActionProcessItem[];
}> {
  return proxyRequest("/processes", { params: { limit } });
}

/**
 * Fetch detailed specification and form fields for a single process
 */
export async function fetchActionProcessDetail(
  processCode: string
): Promise<ActionProcessDetail> {
  return proxyRequest(`/processes/${encodeURIComponent(processCode)}`);
}

/**
 * Fetch dynamic dropdown options (vacant positions, target departments, etc.) for a process
 */
export async function fetchActionProcessOptions(
  processCode: string,
  employeeId?: string,
  employeeName?: string
): Promise<ActionOptionsResponse> {
  return proxyRequest(`/processes/${encodeURIComponent(processCode)}/options`, {
    params: {
      employee_id: employeeId,
      employee_name: employeeName,
    },
  });
}

/**
 * Fetch action records with optional filters
 */
export async function fetchActionRecords(filters?: {
  process_code?: string;
  employee_id?: string;
  employee_name?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<{
  status: string;
  count: number;
  employee: any;
  records: ActionRecordItem[];
}> {
  return proxyRequest("/records", { params: filters as any });
}

/**
 * Fetch audit activity events with optional filters
 */
export async function fetchActionActivity(filters?: {
  process_code?: string;
  employee_id?: string;
  employee_name?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<{
  status: string;
  count: number;
  records: ActionActivityEvent[];
}> {
  return proxyRequest("/activity", { params: filters as any });
}

/**
 * Preview action impact prior to submission
 */
export async function previewAction(
  processCode: string,
  payload: ActionExecutePayload
): Promise<any> {
  return proxyRequest(`/processes/${encodeURIComponent(processCode)}/preview`, {
    method: "POST",
    body: payload,
  });
}

/**
 * Execute and record an operational action
 */
export async function executeAction(
  processCode: string,
  payload: ActionExecutePayload
): Promise<any> {
  return proxyRequest(`/processes/${encodeURIComponent(processCode)}/execute`, {
    method: "POST",
    body: payload,
  });
}

/* ─────────────────────────────────────────────────────────────
 * React Hooks for Components
 * ───────────────────────────────────────────────────────────── */

/**
 * Hook to load backend statistics and live records for a single action process
 */
export function useActionProcess(processCode: string) {
  const [processInfo, setProcessInfo] = useState<ActionProcessItem | null>(null);
  const [records, setRecords] = useState<ActionRecordItem[]>([]);
  const [options, setOptions] = useState<ActionOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [procDetail, recsResult, optsResult] = await Promise.allSettled([
        fetchActionProcessDetail(processCode),
        fetchActionRecords({ process_code: processCode, limit: 100 }),
        fetchActionProcessOptions(processCode),
      ]);

      if (procDetail.status === "fulfilled") {
        setProcessInfo(procDetail.value);
      }
      if (recsResult.status === "fulfilled") {
        setRecords(recsResult.value.records || []);
      }
      if (optsResult.status === "fulfilled") {
        setOptions(optsResult.value);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load process data");
    } finally {
      setIsLoading(false);
    }
  }, [processCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const execute = useCallback(
    async (payload: ActionExecutePayload) => {
      const result = await executeAction(processCode, payload);
      // Reload records after execution
      loadData();
      return result;
    },
    [processCode, loadData]
  );

  return {
    processInfo,
    records,
    options,
    isLoading,
    error,
    refresh: loadData,
    execute,
  };
}

/**
 * Hook to load all process statistics across the Action Center
 */
export function useActionCenterOverview() {
  const [summary, setSummary] = useState<ActionSummaryResponse | null>(null);
  const [processes, setProcesses] = useState<ActionProcessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, procsRes] = await Promise.allSettled([
        fetchActionCenterSummary(),
        fetchActionProcesses(100),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (procsRes.status === "fulfilled") setProcesses(procsRes.value.records || []);
    } catch (err: any) {
      setError(err.message || "Failed to load Action Center overview");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return {
    summary,
    processes,
    isLoading,
    error,
    refresh: loadOverview,
  };
}

/**
 * Hook to load full live audit activity events from backend
 */
export function useBackendActivity(limit = 100) {
  const [events, setEvents] = useState<ActionActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchActionActivity({ limit });
      setEvents(res.records || []);
    } catch (err: any) {
      setError(err.message || "Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    isLoading,
    error,
    refresh: loadEvents,
  };
}

/* ─────────────────────────────────────────────────────────────
 * Normalized Record & High-Level Process Hook
 * ───────────────────────────────────────────────────────────── */

export interface NormalizedActionRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  effectiveDate: string;
  status: string; // "APPLIED" | "SCHEDULED" | "WITHDRAWN" | "Completed"
  performedBy?: string;
  recordedAt: string;
  reasonCategory?: string;
  reasonDetails?: string;
  targetDepartment?: string;
  targetPosition?: string;
  actionData: Record<string, any>;
  raw?: any;
  recordNumber?: string;
  source?: string;
  renewalTermMonths?: string | number;
  newContractEndDate?: string;
  currentContractEnds?: string;
  revisedGrossSalary?: string | number;
  signedContractFileName?: string;
  signedContractFileSize?: string;
  designationOnRejoining?: string;
  rejoiningDate?: string;
  reasonForBreak?: string;
  remarks?: string;
  previousEmployeeCode?: string;
  note?: string;
  [key: string]: any;
}

export function normalizeBackendRecord(item: ActionRecordItem): NormalizedActionRecord {
  let parsedData: Record<string, any> = {};
  if (item.Action_Data_JSON) {
    try {
      parsedData = JSON.parse(item.Action_Data_JSON);
    } catch {
      parsedData = {};
    }
  }

  return {
    id: item.Action_Record_ID,
    employeeName: item.Employee_Name || "Unnamed Employee",
    employeeId: item.Employee_ID || "",
    department: item.Department_Name || "General",
    effectiveDate: item.Effective_Date || (item.Recorded_DateTime ? item.Recorded_DateTime.split("T")[0] : ""),
    status: item.Record_Status || "APPLIED",
    performedBy: item.Performed_By_Name || "HR Operations",
    recordedAt: item.Recorded_DateTime || new Date().toISOString(),
    reasonCategory: item.Reason_Category,
    reasonDetails: item.Reason_Details,
    targetDepartment: item.Target_Department_Name,
    targetPosition: item.Target_Position_Title,
    actionData: parsedData,
    raw: item,
  };
}

/**
 * High-level hook that combines live backend data with local storage persistence,
 * automatically prepares formatted metrics, options, and handles action execution.
 */
export function useActionProcessData({
  processCode,
  storageKey,
  onSaveLabel = "Updates the record",
  defaultFieldCount = 8,
}: {
  processCode: string;
  storageKey: string;
  onSaveLabel?: string;
  defaultFieldCount?: number;
}) {
  const {
    processInfo,
    records: backendRecords,
    options,
    isLoading,
    error,
    refresh,
  } = useActionProcess(processCode);

  // Local storage records fallback / cache
  const [localRecords, setLocalRecords] = useState<NormalizedActionRecord[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save local records on update
  useEffect(() => {
    if (typeof window !== "undefined" && localRecords.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(localRecords));
      } catch (err) {
        console.error(`Failed to save local records for ${storageKey}`, err);
      }
    }
  }, [localRecords, storageKey]);

  // Combined records: local new records placed first, followed by live backend records
  const combinedRecords = useMemo(() => {
    const backendNormalized = backendRecords.map(normalizeBackendRecord);
    const backendIds = new Set(backendNormalized.map((r) => r.id));

    // Keep local records that aren't already represented by the backend ID
    const uniqueLocal = localRecords.filter((r) => !backendIds.has(r.id));
    return [...uniqueLocal, ...backendNormalized];
  }, [backendRecords, localRecords]);

  // Metrics computation
  const metrics = useMemo(() => {
    const backendStats = processInfo?.statistics;
    const allTime = backendStats?.recorded_all_time ?? combinedRecords.length;

    // Calculate last 30 days
    let last30Days = backendStats?.recorded_last_30_days ?? 0;
    if (last30Days === 0 && combinedRecords.length > 0) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      last30Days = combinedRecords.filter(
        (r) => new Date(r.recordedAt).getTime() >= thirtyDaysAgo
      ).length;
    }

    // Last performed date/time
    let lastPerformedStr = "—";
    const rawTimestamp = backendStats?.last_performed_at || (combinedRecords[0]?.recordedAt ?? null);
    if (rawTimestamp) {
      try {
        const d = new Date(rawTimestamp);
        const now = Date.now();
        const diffDays = Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          lastPerformedStr = "Today";
        } else if (diffDays === 1) {
          lastPerformedStr = "Yesterday";
        } else if (diffDays < 30) {
          lastPerformedStr = `${diffDays} days ago`;
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30);
          lastPerformedStr = `${months} ${months === 1 ? "month" : "months"} ago`;
        } else {
          lastPerformedStr = rawTimestamp.split("T")[0];
        }
      } catch {
        lastPerformedStr = String(rawTimestamp).split("T")[0];
      }
    }

    const onSave =
      processInfo?.Execution_Mode === "UPDATE_OPERATIONAL_STATE"
        ? "Logged only"
        : onSaveLabel;

    const fieldCount = processInfo?.Form_Field_Count ?? defaultFieldCount;

    return {
      allTime,
      last30Days,
      lastPerformed: lastPerformedStr,
      onSave,
      fieldCount,
    };
  }, [processInfo, combinedRecords, onSaveLabel, defaultFieldCount]);

  // Record action (submits to backend and saves locally)
  const recordAction = useCallback(
    async ({
      employeeId,
      employeeName,
      fields,
      localRecord,
    }: {
      employeeId?: string;
      employeeName: string;
      fields: Record<string, any>;
      localRecord: NormalizedActionRecord;
    }) => {
      let backendError: string | null = null;
      let backendSuccess = false;

      try {
        await executeAction(processCode, {
          employee_id: employeeId,
          employee_name: employeeName,
          fields,
        });
        backendSuccess = true;
        refresh();
      } catch (err: any) {
        backendError = err.message || "Action logged locally (backend validation notice)";
      }

      // Always prepend to local records for instant feedback
      setLocalRecords((prev) => [localRecord, ...prev]);

      return {
        success: true,
        backendSuccess,
        backendError,
      };
    },
    [processCode, refresh]
  );

  const deleteRecord = useCallback((recordId: string) => {
    setLocalRecords((prev) => prev.filter((r) => r.id !== recordId));
  }, []);

  return {
    processInfo,
    records: combinedRecords,
    options,
    metrics,
    isLoading,
    error,
    refresh,
    recordAction,
    deleteRecord,
  };
}
