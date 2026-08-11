import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  PlayCircle,
  Search,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { CenterPanel } from "@/components/CenterPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/performance/PerformanceUI";
import { cn } from "@/lib/utils";
import {
  fetchEmployeeContext,
  fetchOptions,
  fetchScenarios,
  runSimulation,
  searchDepartments,
  searchEmployees,
  type DepartmentHit,
  type EmployeeContext,
  type EmployeeHit,
  type OptionItem,
  type ScenarioCard,
  type ScenarioType,
  type SimulationRequest,
  type SimulationResponse,
} from "@/services/scenario";

// ─── Scenario-type metadata (UI only — no business logic) ────────────────────

const SCENARIO_TINT: Record<string, string> = {
  employee_promotion: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  employee_transfer: "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
  headcount_reduction: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
  workforce_expansion: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300",
  budget_change: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  skill_reskilling: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
  business_demand_change: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
};

const SCENARIO_BORDER: Record<string, string> = {
  employee_promotion: "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400",
  employee_transfer: "border-sky-200 dark:border-sky-800 hover:border-sky-400",
  headcount_reduction: "border-rose-200 dark:border-rose-800 hover:border-rose-400",
  workforce_expansion: "border-teal-200 dark:border-teal-800 hover:border-teal-400",
  budget_change: "border-amber-200 dark:border-amber-800 hover:border-amber-400",
  skill_reskilling: "border-violet-200 dark:border-violet-800 hover:border-violet-400",
  business_demand_change: "border-orange-200 dark:border-orange-800 hover:border-orange-400",
};

// Numeric parameters per scenario type — the ONLY frontend knowledge of params.
const NUMERIC_PARAMS: Record<string, { name: string; label: string; suffix?: string; placeholder?: string }[]> = {
  employee_promotion: [
    { name: "salary_change_percent", label: "Salary change", suffix: "%", placeholder: "e.g. 15" },
  ],
  employee_transfer: [],
  headcount_reduction: [
    { name: "reduce_by", label: "Positions to remove", placeholder: "e.g. 5" },
  ],
  workforce_expansion: [
    { name: "add_headcount", label: "Positions to add", placeholder: "e.g. 8" },
  ],
  budget_change: [
    { name: "change_percentage", label: "Budget change", suffix: "%", placeholder: "e.g. -10" },
  ],
  skill_reskilling: [],
  business_demand_change: [
    { name: "demand_change_percentage", label: "Workload change", suffix: "%", placeholder: "e.g. 25" },
    { name: "duration_months", label: "Duration", suffix: "months", placeholder: "e.g. 6" },
  ],
};

// ─── Panel root ───────────────────────────────────────────────────────────────

type Props = { open: boolean; onClose: () => void };

export function ScenarioSimulatorPanel({ open, onClose }: Props) {
  const [scenario, setScenario] = useState<ScenarioCard | null>(null);

  const { data: scenariosData, isLoading, error } = useQuery({
    queryKey: ["simulation-scenarios"],
    queryFn: fetchScenarios,
    staleTime: 5 * 60 * 1000,
  });

  const scenarios = scenariosData ?? [];

  const close = () => {
    onClose();
    setScenario(null);
  };

  return (
    <CenterPanel
      open={open}
      onOpenChange={(next) => !next && close()}
      size="lg"
      title={scenario ? scenario.title : "Scenario Simulator"}
      description={
        scenario
          ? scenario.description
          : "Pick a scenario, configure the parameters, and the backend returns the impact, risks and recommendations."
      }
      {...(scenario ? { onBack: () => setScenario(null) } : {})}
    >
      {scenario ? (
        <ScenarioForm key={scenario.key} scenario={scenario} />
      ) : (
        <ScenarioGrid
          scenarios={scenarios}
          isLoading={isLoading}
          error={error}
          onSelect={setScenario}
        />
      )}
    </CenterPanel>
  );
}

// ─── Step 1: Scenario selection grid ─────────────────────────────────────────

function ScenarioGrid({
  scenarios,
  isLoading,
  error,
  onSelect,
}: {
  scenarios: ScenarioCard[];
  isLoading: boolean;
  error: unknown;
  onSelect: (s: ScenarioCard) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4" />
          Failed to load scenarios
        </div>
        <p className="mt-1 text-xs opacity-80">
          {error instanceof Error ? error.message : "Could not reach the simulation service."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {scenarios.map((item) => {
        const tint = SCENARIO_TINT[item.key] ?? "bg-muted text-muted-foreground";
        const border = SCENARIO_BORDER[item.key] ?? "border-border";
        const isEmployee = item.subject === "employee";
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item)}
            className={cn(
              "group rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
              border,
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                  tint,
                )}
              >
                {isEmployee ? (
                  <UserIcon className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                  <Building2 className="h-4 w-4" strokeWidth={2.25} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                  {item.title}
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {isEmployee ? "Employee based" : "Department based"}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 2 → 6: Full scenario form ──────────────────────────────────────────

function ScenarioForm({ scenario }: { scenario: ScenarioCard }) {
  const isEmployee = scenario.subject === "employee";

  // Employee flow state
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeeResults, setEmployeeResults] = useState<EmployeeHit[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHit | null>(null);
  const [employeeContext, setEmployeeContext] = useState<EmployeeContext | null>(null);

  // Department flow state
  const [deptQuery, setDeptQuery] = useState("");
  const [deptResults, setDeptResults] = useState<DepartmentHit[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentHit | null>(null);

  // Options (target position, target department, courses) from backend
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionItem | null>(null);

  // For employee_transfer nested target position options
  const [targetPositions, setTargetPositions] = useState<OptionItem[]>([]);
  const [selectedTargetPosition, setSelectedTargetPosition] = useState<OptionItem | null>(null);
  const [loadingPositions, setLoadingPositions] = useState(false);

  // Numeric / text parameters
  const [params, setParams] = useState<Record<string, string>>({});

  // Loading states
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [searchingDepts, setSearchingDepts] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Simulation mutation
  const simulate = useMutation({ mutationFn: runSimulation });

  // ── Debounced employee search ────────────────────────────────────────────
  const employeeSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmployeeQueryChange = useCallback((value: string) => {
    setEmployeeQuery(value);
    setSearchError(null);
    if (employeeSearchTimer.current) clearTimeout(employeeSearchTimer.current);
    if (!value.trim()) {
      setEmployeeResults([]);
      return;
    }
    employeeSearchTimer.current = setTimeout(async () => {
      setSearchingEmployees(true);
      try {
        const hits = await searchEmployees(value.trim());
        setEmployeeResults(hits);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed.");
        setEmployeeResults([]);
      } finally {
        setSearchingEmployees(false);
      }
    }, 350);
  }, []);

  // ── Select employee → load context + options ─────────────────────────────
  const handleSelectEmployee = useCallback(
    async (hit: EmployeeHit) => {
      setSelectedEmployee(hit);
      setEmployeeResults([]);
      setEmployeeContext(null);
      setOptions([]);
      setSelectedOption(null);

      // Load context
      setLoadingContext(true);
      try {
        const ctx = await fetchEmployeeContext(hit.employee_id);
        setEmployeeContext(ctx);
      } catch {
        // Context load failed — we still have the basic hit fields
      } finally {
        setLoadingContext(false);
      }

      // Load scenario options (e.g. target positions for promotion, target departments for transfer)
      setLoadingOptions(true);
      try {
        const opts = await fetchOptions({
          scenario_type: scenario.key as ScenarioType,
          employee_id: hit.employee_id,
        });
        setOptions(opts);
      } catch {
        setOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    },
    [scenario.key],
  );

  // ── Debounced department search ──────────────────────────────────────────
  const deptSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all departments on mount for department-based scenarios
  useEffect(() => {
    if (!isEmployee) {
      setSearchingDepts(true);
      searchDepartments("", 50)
        .then(setDeptResults)
        .catch(() => setDeptResults([]))
        .finally(() => setSearchingDepts(false));
    }
  }, [isEmployee]);

  const handleDeptQueryChange = useCallback((value: string) => {
    setDeptQuery(value);
    if (deptSearchTimer.current) clearTimeout(deptSearchTimer.current);
    deptSearchTimer.current = setTimeout(async () => {
      setSearchingDepts(true);
      try {
        const hits = await searchDepartments(value.trim());
        setDeptResults(hits);
      } catch {
        setDeptResults([]);
      } finally {
        setSearchingDepts(false);
      }
    }, 300);
  }, []);

  // ── Select department → load options ────────────────────────────────────
  const handleSelectDept = useCallback(
    async (dept: DepartmentHit) => {
      setSelectedDept(dept);
      setOptions([]);
      setSelectedOption(null);

      setLoadingOptions(true);
      try {
        const opts = await fetchOptions({
          scenario_type: scenario.key as ScenarioType,
          department_id: dept.department_id,
        });
        setOptions(opts);
      } catch {
        setOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    },
    [scenario.key],
  );

  // ── Load nested target positions for employee transfer ───────────────────
  useEffect(() => {
    if (scenario.key === "employee_transfer" && selectedEmployee && selectedOption) {
      setLoadingPositions(true);
      fetchOptions({
        scenario_type: "employee_transfer",
        employee_id: selectedEmployee.employee_id,
        target_department_id: selectedOption.id,
      })
        .then(setTargetPositions)
        .catch(() => setTargetPositions([]))
        .finally(() => setLoadingPositions(false));
    } else {
      setTargetPositions([]);
      setSelectedTargetPosition(null);
    }
  }, [scenario.key, selectedEmployee, selectedOption]);

  // ── Build and fire the simulation request ────────────────────────────────
  const canRun = isEmployee
    ? selectedEmployee &&
      (scenario.key === "employee_promotion"
        ? Boolean(selectedOption)
        : scenario.key === "employee_transfer"
          ? Boolean(selectedOption && selectedTargetPosition)
          : scenario.key === "skill_reskilling"
            ? Boolean(selectedOption)
            : true)
    : Boolean(selectedDept);

  const handleRun = () => {
    const cleanParams: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      const trimmed = v?.trim();
      if (!trimmed) continue;
      const asNum = Number(trimmed);
      cleanParams[k] = isNaN(asNum) ? trimmed : asNum;
    }

    const request: SimulationRequest = {
      scenario_type: scenario.key as ScenarioType,
      parameters: cleanParams,
    };

    if (isEmployee && selectedEmployee) {
      request.employee_id = selectedEmployee.employee_id;
      if (scenario.key === "employee_promotion" && selectedOption) {
        request.target_position_id = selectedOption.id;
      } else if (scenario.key === "employee_transfer" && selectedOption && selectedTargetPosition) {
        request.target_department_id = selectedOption.id;
        request.target_position_id = selectedTargetPosition.id;
      } else if (scenario.key === "skill_reskilling" && selectedOption) {
        cleanParams["course_id"] = selectedOption.id;
      }
    } else if (!isEmployee && selectedDept) {
      request.department_id = selectedDept.department_id;
    }

    simulate.mutate(request);
  };

  const numericFields = NUMERIC_PARAMS[scenario.key] ?? [];
  const tint = SCENARIO_TINT[scenario.key] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* ── Step 2: Subject selector ── */}
      {isEmployee ? (
        <EmployeeSelector
          query={employeeQuery}
          onQueryChange={handleEmployeeQueryChange}
          results={employeeResults}
          selected={selectedEmployee}
          context={employeeContext}
          isSearching={searchingEmployees}
          isLoadingContext={loadingContext}
          searchError={searchError}
          onSelect={handleSelectEmployee}
          onClear={() => {
            setSelectedEmployee(null);
            setEmployeeContext(null);
            setOptions([]);
            setSelectedOption(null);
            setEmployeeQuery("");
            setEmployeeResults([]);
            simulate.reset();
          }}
        />
      ) : (
        <DepartmentSelector
          query={deptQuery}
          onQueryChange={handleDeptQueryChange}
          results={deptResults}
          selected={selectedDept}
          isSearching={searchingDepts}
          onSelect={handleSelectDept}
          onClear={() => {
            setSelectedDept(null);
            setOptions([]);
            setSelectedOption(null);
            simulate.reset();
          }}
        />
      )}

      {/* ── Step 3: Backend-supplied options ── */}
      {(selectedEmployee || selectedDept) && (
        <div className="space-y-4">
          <OptionsSelector
            options={options}
            selected={selectedOption}
            isLoading={loadingOptions}
            scenarioType={scenario.key as ScenarioType}
            tint={tint}
            onSelect={setSelectedOption}
          />

          {scenario.key === "employee_transfer" && selectedOption && (
            <OptionsSelector
              options={targetPositions}
              selected={selectedTargetPosition}
              isLoading={loadingPositions}
              scenarioType="employee_promotion" // Reuses the "Target position" label styling
              tint={tint}
              onSelect={setSelectedTargetPosition}
            />
          )}
        </div>
      )}

      {/* ── Step 4: Numeric parameters + Run button ── */}
      {(selectedEmployee || selectedDept) && (
        <SectionCard
          title="Simulation parameters"
          subtitle="Configure parameters to run this scenario simulation."
          tint="bg-pastel-lavender"
        >
          {numericFields.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {numericFields.map((field) => (
                <label key={field.name} className="block text-xs">
                  <span className="mb-1 block font-medium text-muted-foreground">
                    {field.label}
                    {field.suffix ? ` (${field.suffix})` : ""}
                  </span>
                  <Input
                    type="number"
                    value={params[field.name] ?? ""}
                    placeholder={field.placeholder ?? ""}
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No additional parameters required — the backend will compute the impact from the context above.
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={handleRun}
              disabled={!canRun || simulate.isPending}
              className="rounded-xl"
            >
              {simulate.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-1.5 h-4 w-4" />
              )}
              Run Simulation
            </Button>
            {!canRun && (
              <span className="text-xs text-muted-foreground">
                {isEmployee ? "Select an employee first." : "Select a department first."}
              </span>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Step 5 / 6: Results ── */}
      {(simulate.isPending || simulate.isError || simulate.isSuccess) && (
        <SimulationResult
          isPending={simulate.isPending}
          error={simulate.error}
          data={simulate.data ?? null}
          subjectName={
            isEmployee
              ? (selectedEmployee?.employee_name ?? null)
              : (selectedDept?.department_name ?? null)
          }
        />
      )}
    </div>
  );
}

// ─── Employee selector ────────────────────────────────────────────────────────

function EmployeeSelector({
  query,
  onQueryChange,
  results,
  selected,
  context,
  isSearching,
  isLoadingContext,
  searchError,
  onSelect,
  onClear,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  results: EmployeeHit[];
  selected: EmployeeHit | null;
  context: EmployeeContext | null;
  isSearching: boolean;
  isLoadingContext: boolean;
  searchError: string | null;
  onSelect: (hit: EmployeeHit) => void;
  onClear: () => void;
}) {
  return (
    <SectionCard title="Find employee" subtitle="Search by Employee ID or name." tint="bg-pastel-teal">
      {selected ? (
        <EmployeeProfile
          hit={selected}
          context={context}
          isLoadingContext={isLoadingContext}
          onClear={onClear}
        />
      ) : (
        <>
          <div className="relative flex items-center gap-2">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="e.g. EMP1042 or Usman Ali"
              className="rounded-xl pl-9"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {searchError && (
            <p className="mt-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {searchError}
            </p>
          )}

          {results.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {results.slice(0, 10).map((hit) => (
                <button
                  key={hit.employee_id}
                  onClick={() => onSelect(hit)}
                  className="w-full rounded-xl border border-transparent p-3 text-left text-sm transition-colors hover:border-border hover:bg-muted/60"
                >
                  <div className="font-medium">{hit.employee_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[hit.employee_id, hit.department, hit.position_title]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() && !isSearching && results.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">No matching employee found.</p>
          )}
        </>
      )}
    </SectionCard>
  );
}

// ─── Employee profile card ────────────────────────────────────────────────────

function EmployeeProfile({
  hit,
  context,
  isLoadingContext,
  onClear,
}: {
  hit: EmployeeHit;
  context: EmployeeContext | null;
  isLoadingContext: boolean;
  onClear: () => void;
}) {
  const profile = context ?? hit;
  const name = (profile as Record<string, unknown>)["employee_name"] as string | undefined;
  const empId = (profile as Record<string, unknown>)["employee_id"] as string | undefined;
  const dept = (profile as Record<string, unknown>)["department"] as string | undefined;
  const title = (profile as Record<string, unknown>)["position_title"] as string | undefined;
  const level = (profile as Record<string, unknown>)["job_level"] as string | undefined;
  const perf = (profile as Record<string, unknown>)["performance_score"];
  const readiness = (profile as Record<string, unknown>)["readiness"] as string | undefined;
  const skills = (profile as Record<string, unknown>)["skills"];
  const skillList = Array.isArray(skills) ? (skills as string[]) : [];

  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {(name ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="font-semibold text-sm">{name ?? hit.employee_name}</div>
            <div className="text-xs text-muted-foreground">
              {[empId, dept, title].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {empId && (
            <Link
              to="/employee/$employeeId"
              params={{ employeeId: empId }}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Full profile
            </Link>
          )}
          <button
            onClick={onClear}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Change employee"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isLoadingContext && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading employee context…
        </div>
      )}

      {!isLoadingContext && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
          {level && <ProfileRow label="Level" value={level} />}
          {perf !== undefined && perf !== null && (
            <ProfileRow label="Performance" value={String(perf)} />
          )}
          {readiness && <ProfileRow label="Readiness" value={readiness} />}
        </dl>
      )}

      {skillList.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skillList.slice(0, 8).map((s) => (
            <span
              key={s}
              className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/40 pb-1">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium truncate">{value}</dd>
    </div>
  );
}

// ─── Department selector ──────────────────────────────────────────────────────

function DepartmentSelector({
  query,
  onQueryChange,
  results,
  selected,
  isSearching,
  onSelect,
  onClear,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  results: DepartmentHit[];
  selected: DepartmentHit | null;
  isSearching: boolean;
  onSelect: (d: DepartmentHit) => void;
  onClear: () => void;
}) {
  return (
    <SectionCard title="Select department" subtitle="Choose which department this scenario applies to." tint="bg-pastel-sky">
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold">{selected.department_name}</div>
              {selected.headcount != null && (
                <div className="text-xs text-muted-foreground">{selected.headcount} employees</div>
              )}
            </div>
          </div>
          <button
            onClick={onClear}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Change department"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search departments…"
              className="rounded-xl pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {results.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {results.map((dept) => (
                <button
                  key={dept.department_id}
                  onClick={() => onSelect(dept)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-950/30 dark:hover:border-sky-700"
                >
                  {dept.department_name}
                  {dept.headcount != null && (
                    <span className="ml-1.5 text-muted-foreground">({dept.headcount})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

// ─── Options selector (target position / target dept / courses) ───────────────

function OptionsSelector({
  options,
  selected,
  isLoading,
  scenarioType,
  tint,
  onSelect,
}: {
  options: OptionItem[];
  selected: OptionItem | null;
  isLoading: boolean;
  scenarioType: ScenarioType;
  tint: string;
  onSelect: (o: OptionItem | null) => void;
}) {
  const label: Record<ScenarioType, string> = {
    employee_promotion: "Target position",
    employee_transfer: "Target department",
    headcount_reduction: "Target role (optional)",
    workforce_expansion: "Role to hire (optional)",
    budget_change: "Focus area (optional)",
    skill_reskilling: "Training programme",
    business_demand_change: "Affected team (optional)",
  };

  const title = label[scenarioType] ?? "Select option";

  if (isLoading) {
    return (
      <SectionCard title={title} tint={tint}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading options from backend…
        </div>
      </SectionCard>
    );
  }

  if (options.length === 0) return null;

  return (
    <SectionCard title={title} tint={tint}>
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {options.map((opt) => {
          const active = selected?.id === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(active ? null : opt)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                active
                  ? "border-primary/40 bg-primary/5 font-medium"
                  : "border-transparent hover:border-border hover:bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                )}
              >
                {active && <Check className="h-3 w-3" />}
              </span>
              <span className="flex-1 leading-snug">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Simulation result ────────────────────────────────────────────────────────

function SimulationResult({
  isPending,
  error,
  data,
  subjectName,
}: {
  isPending: boolean;
  error: unknown;
  data: SimulationResponse | null;
  subjectName: string | null;
}) {
  if (isPending) {
    return (
      <div className="grid h-36 place-items-center rounded-2xl border border-dashed bg-muted/30 text-xs text-muted-foreground">
        <span className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Running simulation…
          <span className="opacity-60">This may take a few seconds</span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
        <div className="flex items-center gap-2 font-medium text-sm mb-1">
          <AlertTriangle className="h-4 w-4" />
          Simulation failed
        </div>
        <p>{error instanceof Error ? error.message : "Something went wrong. Please try again."}</p>
      </div>
    );
  }

  if (!data) return null;

  const heading = subjectName ? `Simulation result — ${subjectName}` : "Simulation result";

  return (
    <div className="space-y-4">
      {/* Baseline vs Simulated side-by-side */}
      <StateComparison
        baseline={data.baseline}
        simulated={data.simulated_state}
        title={heading}
      />

      {/* Impact */}
      {Object.keys(data.impact ?? {}).length > 0 && (
        <ImpactCard impact={data.impact} />
      )}

      {/* Warnings */}
      {data.warnings && data.warnings.length > 0 && (
        <SectionCard title="Warnings" tint="bg-pastel-rose">
          <ul className="space-y-2">
            {data.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {w}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Assumptions (collapsible) */}
      {data.assumptions && Object.keys(data.assumptions).length > 0 && (
        <AssumptionsCard assumptions={data.assumptions} />
      )}
    </div>
  );
}

// ─── Baseline vs Simulated comparison ────────────────────────────────────────

function StateComparison({
  baseline,
  simulated,
  title,
}: {
  baseline: Record<string, unknown>;
  simulated: Record<string, unknown>;
  title: string;
}) {
  // Collect all keys from both states
  const allKeys = Array.from(new Set([...Object.keys(baseline), ...Object.keys(simulated)])).filter(
    (k) => {
      const b = baseline[k];
      const s = simulated[k];
      return (
        (b !== null && b !== undefined && typeof b !== "object") ||
        (s !== null && s !== undefined && typeof s !== "object")
      );
    },
  );

  return (
    <SectionCard title={title} tint="bg-pastel-mint">
      {allKeys.length > 0 ? (
        <div className="overflow-hidden rounded-xl border">
          {/* Header */}
          <div className="grid grid-cols-3 border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <div>Metric</div>
            <div className="text-center">Current</div>
            <div className="text-center">Simulated</div>
          </div>
          {/* Rows */}
          {allKeys.map((key, i) => {
            const bVal = formatVal(baseline[key]);
            const sVal = formatVal(simulated[key]);
            const changed = bVal !== sVal;
            return (
              <div
                key={key}
                className={cn(
                  "grid grid-cols-3 px-3 py-2.5 text-sm",
                  i % 2 === 0 ? "bg-background" : "bg-muted/20",
                  changed && "bg-emerald-50/50 dark:bg-emerald-950/20",
                )}
              >
                <div className="text-xs text-muted-foreground pr-2 truncate">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-center font-medium tabular-nums">{bVal ?? "—"}</div>
                <div
                  className={cn(
                    "text-center font-semibold tabular-nums flex items-center justify-center gap-1",
                    changed && "text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {changed && <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />}
                  {sVal ?? "—"}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <RawJson label="Baseline" data={baseline} />
      )}
    </SectionCard>
  );
}

function formatVal(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") return v;
  return null;
}

// ─── Impact card ──────────────────────────────────────────────────────────────

function ImpactCard({ impact }: { impact: Record<string, unknown> }) {
  // Separate scalars from nested objects
  const scalarEntries = Object.entries(impact).filter(([, v]) => v !== null && typeof v !== "object");
  const listEntries = Object.entries(impact).filter(([, v]) => Array.isArray(v));
  const objectEntries = Object.entries(impact).filter(
    ([, v]) => v && typeof v === "object" && !Array.isArray(v),
  );

  return (
    <SectionCard title="Impact" tint="bg-pastel-sky">
      {scalarEntries.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-3">
          {scalarEntries.map(([key, value]) => (
            <div key={key} className="rounded-xl border p-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
                {key.replace(/_/g, " ")}
              </div>
              <div className="text-lg font-semibold tabular-nums">{formatVal(value) ?? "—"}</div>
            </div>
          ))}
        </div>
      )}

      {listEntries.map(([key, value]) => (
        <div key={key} className="mt-2">
          <div className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {key.replace(/_/g, " ")}
          </div>
          <ul className="space-y-1.5">
            {(value as unknown[]).map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {typeof item === "string" ? (
                  item
                ) : (
                  <span className="text-xs text-muted-foreground">{JSON.stringify(item)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {objectEntries.map(([key, value]) => (
        <div key={key} className="mt-2">
          <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {key.replace(/_/g, " ")}
          </div>
          <RawJson label="" data={value as Record<string, unknown>} />
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Assumptions collapsible ──────────────────────────────────────────────────

function AssumptionsCard({ assumptions }: { assumptions: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  return (
    <SectionCard title="Assumptions" tint="bg-pastel-yellow">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{open ? "Hide" : "Show"} assumptions used by the simulation</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(assumptions)
            .filter(([, v]) => v !== null && typeof v !== "object")
            .map(([key, value]) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-3 border-b border-border/30 py-1 text-xs"
              >
                <dt className="text-muted-foreground">{key.replace(/_/g, " ")}</dt>
                <dd className="font-medium text-right">{String(value)}</dd>
              </div>
            ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Raw JSON fallback ────────────────────────────────────────────────────────

function RawJson({ label, data }: { label: string; data: unknown }) {
  return (
    <div>
      {label && (
        <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
      )}
      <pre className="max-h-52 overflow-auto rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
