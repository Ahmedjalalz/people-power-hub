import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BadgePlus,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FlaskConical,
  Loader2,
  Minus,
  Plus,
  PlayCircle,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

type ScenarioMeta = {
  icon: React.ReactNode;
  gradient: string;
  activeTab: string;
  badgeColor: string;
  accentBg: string;
  accentText: string;
  ringGlow: string;
};

const SCENARIO_META: Record<string, ScenarioMeta> = {
  employee_promotion: {
    icon: <TrendingUp className="h-4 w-4" />,
    gradient: "from-emerald-500/12 via-teal-500/6 to-transparent",
    activeTab: "border-emerald-500 shadow-xs",
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    accentBg: "bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/20",
    accentText: "text-emerald-700 dark:text-emerald-300",
    ringGlow: "glow-emerald",
  },
  employee_transfer: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    gradient: "from-blue-500/12 via-sky-500/6 to-transparent",
    activeTab: "border-blue-500 shadow-xs",
    badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30",
    accentBg: "bg-blue-50/80 dark:bg-blue-950/30 border border-blue-500/20",
    accentText: "text-blue-700 dark:text-blue-300",
    ringGlow: "glow-subtle",
  },
  headcount_reduction: {
    icon: <TrendingDown className="h-4 w-4" />,
    gradient: "from-rose-500/12 via-red-500/6 to-transparent",
    activeTab: "border-rose-500 shadow-xs",
    badgeColor: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30",
    accentBg: "bg-rose-50/80 dark:bg-rose-950/30 border border-rose-500/20",
    accentText: "text-rose-700 dark:text-rose-300",
    ringGlow: "glow-rose",
  },
  workforce_expansion: {
    icon: <BadgePlus className="h-4 w-4" />,
    gradient: "from-teal-500/12 via-cyan-500/6 to-transparent",
    activeTab: "border-teal-500 shadow-xs",
    badgeColor: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30",
    accentBg: "bg-teal-50/80 dark:bg-teal-950/30 border border-teal-500/20",
    accentText: "text-teal-700 dark:text-teal-300",
    ringGlow: "glow-emerald",
  },
  budget_change: {
    icon: <Wallet className="h-4 w-4" />,
    gradient: "from-amber-500/12 via-yellow-500/6 to-transparent",
    activeTab: "border-amber-500 shadow-xs",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
    accentBg: "bg-amber-50/80 dark:bg-amber-950/30 border border-amber-500/20",
    accentText: "text-amber-700 dark:text-amber-300",
    ringGlow: "glow-amber",
  },
  skill_reskilling: {
    icon: <BookOpen className="h-4 w-4" />,
    gradient: "from-violet-500/12 via-purple-500/6 to-transparent",
    activeTab: "border-violet-500 shadow-xs",
    badgeColor: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30",
    accentBg: "bg-violet-50/80 dark:bg-violet-950/30 border border-violet-500/20",
    accentText: "text-violet-700 dark:text-violet-300",
    ringGlow: "glow-violet",
  },
  business_demand_change: {
    icon: <Zap className="h-4 w-4" />,
    gradient: "from-orange-500/12 via-amber-500/6 to-transparent",
    activeTab: "border-orange-500 shadow-xs",
    badgeColor: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30",
    accentBg: "bg-orange-50/80 dark:bg-orange-950/30 border border-orange-500/20",
    accentText: "text-orange-700 dark:text-orange-300",
    ringGlow: "glow-amber",
  },
};

const DEFAULT_META = SCENARIO_META["employee_promotion"] as ScenarioMeta;
function getMeta(key: string): ScenarioMeta {
  return SCENARIO_META[key] ?? DEFAULT_META;
}

type ParamField = {
  name: string;
  label: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  inputType: "slider" | "stepper";
};

const NUMERIC_PARAMS: Record<string, ParamField[]> = {
  employee_promotion: [
    { name: "salary_change_percent", label: "Salary increase", suffix: "%", min: 0, max: 50, step: 1, placeholder: "15", inputType: "slider" },
  ],
  employee_transfer: [],
  headcount_reduction: [
    { name: "reduce_by", label: "Positions to remove", min: 1, max: 50, step: 1, placeholder: "5", inputType: "stepper" },
  ],
  workforce_expansion: [
    { name: "add_headcount", label: "Positions to add", min: 1, max: 50, step: 1, placeholder: "8", inputType: "stepper" },
  ],
  budget_change: [
    { name: "change_percentage", label: "Budget change", suffix: "%", min: -50, max: 50, step: 1, placeholder: "-10", inputType: "slider" },
  ],
  skill_reskilling: [],
  business_demand_change: [
    { name: "demand_change_percentage", label: "Workload change", suffix: "%", min: -50, max: 100, step: 5, placeholder: "25", inputType: "slider" },
    { name: "duration_months", label: "Duration", suffix: " months", min: 1, max: 24, step: 1, placeholder: "6", inputType: "stepper" },
  ],
};

export function ScenarioPage() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const { data: scenariosData, isLoading, error } = useQuery({
    queryKey: ["simulation-scenarios"],
    queryFn: fetchScenarios,
    staleTime: 5 * 60 * 1000,
  });

  const scenarios = scenariosData ?? [];

  useEffect(() => {
    if (scenarios.length > 0 && !activeKey) setActiveKey(scenarios[0].key);
  }, [scenarios, activeKey]);

  const active = scenarios.find((s) => s.key === activeKey) ?? null;
  const meta = active ? getMeta(active.key) : DEFAULT_META;

  const scrollTabs = (dir: "left" | "right") => {
    if (!tabsRef.current) return;
    tabsRef.current.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-teal/70 px-3 py-1 text-xs font-semibold text-foreground">
            <FlaskConical className="h-3.5 w-3.5 text-primary" />
            Scenario Simulator
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Workforce Modeling</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a scenario, configure the parameters, and see the projected impact and recommendations.
          </p>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <button
            onClick={() => scrollTabs("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden h-7 w-7 place-items-center rounded-full bg-background/90 shadow border border-border text-muted-foreground hover:text-foreground sm:grid md:hidden"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scrollTabs("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden h-7 w-7 place-items-center rounded-full bg-background/90 shadow border border-border text-muted-foreground hover:text-foreground sm:grid md:hidden"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <div
            ref={tabsRef}
            className="flex overflow-x-auto px-6"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mr-1 h-11 w-36 shrink-0 animate-pulse rounded-t-lg bg-muted/40" />
              ))}

            {!isLoading &&
              scenarios.map((scenario) => {
                const m = getMeta(scenario.key);
                const isActive = scenario.key === activeKey;
                return (
                  <button
                    key={scenario.key}
                    onClick={() => setActiveKey(scenario.key)}
                    className={cn(
                      "group mr-0.5 flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap",
                      isActive
                        ? cn("border-b-2 text-foreground", m.badgeColor, m.activeTab)
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs transition-colors",
                        isActive ? m.badgeColor : "bg-muted text-muted-foreground group-hover:bg-background"
                      )}
                    >
                      {m.icon}
                    </span>
                    {scenario.title}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-800 dark:bg-rose-950/30">
            <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" /> Failed to load scenarios
            </div>
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
              {error instanceof Error ? error.message : "Could not reach the simulation service."}
            </p>
          </div>
        </div>
      )}

      {active && (
        <div key={active.key} className={cn("min-h-[calc(100vh-12rem)] bg-gradient-to-br", meta.gradient)}>
          <div className="mx-auto max-w-7xl px-6 py-6">
            <div className={cn("mb-6 rounded-2xl border border-border p-4", meta.accentBg)}>
              <div className="flex items-center gap-3">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", meta.badgeColor)}>
                  {meta.icon}
                </span>
                <div>
                  <div className={cn("font-semibold", meta.accentText)}>{active.title}</div>
                  <div className="text-sm text-muted-foreground">{active.description}</div>
                </div>
                <span className="ml-auto rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  {active.subject === "employee" ? "Employee-based" : "Department-based"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
              <ScenarioInputPanel key={active.key} scenario={active} meta={meta} />
            </div>
          </div>
        </div>
      )}

      {!active && !isLoading && !error && (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <FlaskConical className="mr-2 h-6 w-6 opacity-40" />
          Select a scenario tab to get started
        </div>
      )}
    </div>
  );
}

function ScenarioInputPanel({ scenario, meta }: { scenario: ScenarioCard; meta: ScenarioMeta }) {
  const isEmployee = scenario.subject === "employee";

  // Employee search state
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeeResults, setEmployeeResults] = useState<EmployeeHit[]>([]);
  const [initialEmployees, setInitialEmployees] = useState<EmployeeHit[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHit | null>(null);
  const [employeeContext, setEmployeeContext] = useState<EmployeeContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Department state
  const [deptQuery, setDeptQuery] = useState("");
  const [deptResults, setDeptResults] = useState<DepartmentHit[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentHit | null>(null);
  const [searchingDepts, setSearchingDepts] = useState(false);

  // Options state
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionItem | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Transfer nested position options
  const [targetPositions, setTargetPositions] = useState<OptionItem[]>([]);
  const [selectedTargetPosition, setSelectedTargetPosition] = useState<OptionItem | null>(null);
  const [loadingPositions, setLoadingPositions] = useState(false);

  // Numeric parameters
  const numericFields = NUMERIC_PARAMS[scenario.key] ?? [];
  const [params, setParams] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of numericFields) init[f.name] = f.placeholder ?? "";
    return init;
  });

  const simulate = useMutation({ mutationFn: runSimulation });

  // Preload initial employees on mount for employee-based scenarios
  useEffect(() => {
    if (isEmployee) {
      setSearchingEmployees(true);
      searchEmployees("EMP", 50)
        .then((hits) => {
          setEmployeeResults(hits);
          setInitialEmployees(hits);
        })
        .catch(() => {})
        .finally(() => setSearchingEmployees(false));
    }
  }, [isEmployee]);

  // Preload general options for scenarios that don't strictly require employee_id
  useEffect(() => {
    if (scenario.key === "skill_reskilling") {
      setLoadingOptions(true);
      fetchOptions({ scenario_type: "skill_reskilling" })
        .then(setOptions)
        .catch(() => setOptions([]))
        .finally(() => setLoadingOptions(false));
    } else if (scenario.key === "employee_transfer") {
      setLoadingOptions(true);
      fetchOptions({ scenario_type: "employee_transfer" })
        .then(setOptions)
        .catch(() => setOptions([]))
        .finally(() => setLoadingOptions(false));
    }
  }, [scenario.key]);

  // Debounced search for employee
  const empTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleEmployeeQueryChange = useCallback((value: string) => {
    setEmployeeQuery(value);
    setSearchError(null);
    if (empTimer.current) clearTimeout(empTimer.current);
    if (!value.trim()) {
      setEmployeeResults(initialEmployees);
      return;
    }
    empTimer.current = setTimeout(async () => {
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
    }, 300);
  }, [initialEmployees]);

  const handleSelectEmployee = useCallback(async (hit: EmployeeHit) => {
    setSelectedEmployee(hit);
    setEmployeeContext(null);
    simulate.reset();

    // Reset option selections when employee changes
    if (scenario.key === "employee_promotion") {
      setOptions([]);
      setSelectedOption(null);
    } else if (scenario.key === "employee_transfer") {
      // Keep destination department options, but reset the selected target department and position
      setSelectedOption(null);
      setSelectedTargetPosition(null);
      // Ensure target departments are fetched if not yet loaded
      if (options.length === 0) {
        setLoadingOptions(true);
        fetchOptions({ scenario_type: "employee_transfer" })
          .then(setOptions)
          .catch(() => setOptions([]))
          .finally(() => setLoadingOptions(false));
      }
    } else if (scenario.key !== "skill_reskilling") {
      setOptions([]);
      setSelectedOption(null);
    }

    setLoadingContext(true);
    try {
      setEmployeeContext(await fetchEmployeeContext(hit.employee_id));
    } catch {
      // ignore
    } finally {
      setLoadingContext(false);
    }

    // Load employee-specific options (e.g. eligible target positions for promotion)
    if (scenario.key === "employee_promotion") {
      setLoadingOptions(true);
      try {
        setOptions(await fetchOptions({ scenario_type: "employee_promotion", employee_id: hit.employee_id }));
      } catch {
        setOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    }
  }, [scenario.key, simulate, options.length]);

  // Preload departments for department-based scenarios
  useEffect(() => {
    if (!isEmployee) {
      setSearchingDepts(true);
      searchDepartments("", 50)
        .then(setDeptResults)
        .catch(() => setDeptResults([]))
        .finally(() => setSearchingDepts(false));
    }
  }, [isEmployee]);

  const deptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDeptQueryChange = useCallback((value: string) => {
    setDeptQuery(value);
    if (deptTimer.current) clearTimeout(deptTimer.current);
    deptTimer.current = setTimeout(async () => {
      setSearchingDepts(true);
      try {
        setDeptResults(await searchDepartments(value.trim()));
      } catch {
        setDeptResults([]);
      } finally {
        setSearchingDepts(false);
      }
    }, 300);
  }, []);

  const handleSelectDept = useCallback(async (dept: DepartmentHit) => {
    setSelectedDept(dept);
    setOptions([]);
    setSelectedOption(null);
    simulate.reset();
    setLoadingOptions(true);
    try {
      setOptions(await fetchOptions({ scenario_type: scenario.key as ScenarioType, department_id: dept.department_id }));
    } catch {
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [scenario.key, simulate]);

  // Nested target positions for transfer
  useEffect(() => {
    if (scenario.key === "employee_transfer" && selectedOption) {
      setLoadingPositions(true);
      fetchOptions({
        scenario_type: "employee_transfer",
        target_department_id: selectedOption.id,
      })
        .then(setTargetPositions)
        .catch(() => setTargetPositions([]))
        .finally(() => setLoadingPositions(false));
    } else {
      setTargetPositions([]);
      setSelectedTargetPosition(null);
    }
  }, [scenario.key, selectedOption]);

  const canRun = isEmployee
    ? selectedEmployee && (
        scenario.key === "employee_promotion" ? Boolean(selectedOption)
        : scenario.key === "employee_transfer" ? Boolean(selectedOption && selectedTargetPosition)
        : scenario.key === "skill_reskilling" ? Boolean(selectedOption)
        : true
      )
    : Boolean(selectedDept);

  const handleRun = () => {
    const cleanParams: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      const trimmed = v?.trim();
      if (!trimmed) continue;
      const asNum = Number(trimmed);
      cleanParams[k] = isNaN(asNum) ? trimmed : asNum;
    }
    const request: SimulationRequest = { scenario_type: scenario.key as ScenarioType, parameters: cleanParams };
    if (isEmployee && selectedEmployee) {
      request.employee_id = selectedEmployee.employee_id;
      if (scenario.key === "employee_promotion" && selectedOption) request.target_position_id = selectedOption.id;
      else if (scenario.key === "employee_transfer" && selectedOption && selectedTargetPosition) {
        request.target_department_id = selectedOption.id;
        request.target_position_id = selectedTargetPosition.id;
      } else if (scenario.key === "skill_reskilling" && selectedOption) cleanParams["course_id"] = selectedOption.id;
    } else if (!isEmployee && selectedDept) {
      request.department_id = selectedDept.department_id;
    }
    simulate.mutate(request);
  };

  const hasSubject = isEmployee ? Boolean(selectedEmployee) : Boolean(selectedDept);

  // Helper text explaining what is needed before running
  const runDisabledReason = isEmployee
    ? !selectedEmployee
      ? "Select an employee above to run simulation"
      : scenario.key === "employee_promotion" && !selectedOption
        ? "Select a target position above to run"
        : scenario.key === "employee_transfer" && !selectedOption
          ? "Select a target department above to run"
          : scenario.key === "employee_transfer" && !selectedTargetPosition
            ? "Select a target position in the destination department"
            : scenario.key === "skill_reskilling" && !selectedOption
              ? "Select a training programme above to run"
              : null
    : !selectedDept
      ? "Select a department above to run simulation"
      : null;

  return (
    <>
      {/* ── Left Column: All Input Fields Shown Simultaneously ── */}
      <div className="space-y-4">
        {/* Step 1: Employee or Department Selection */}
        {isEmployee ? (
          <EmployeePickerCard
            query={employeeQuery}
            onQueryChange={handleEmployeeQueryChange}
            results={employeeResults}
            selected={selectedEmployee}
            context={employeeContext}
            isSearching={searchingEmployees}
            isLoadingContext={loadingContext}
            searchError={searchError}
            meta={meta}
            onSelect={handleSelectEmployee}
            onClear={() => {
              setSelectedEmployee(null);
              setEmployeeContext(null);
              if (scenario.key === "employee_promotion") {
                setOptions([]);
                setSelectedOption(null);
              } else if (scenario.key === "employee_transfer") {
                setSelectedOption(null);
                setSelectedTargetPosition(null);
              } else if (scenario.key !== "skill_reskilling") {
                setOptions([]);
                setSelectedOption(null);
              }
              setEmployeeQuery("");
              setEmployeeResults(initialEmployees);
              simulate.reset();
            }}
          />
        ) : (
          <DepartmentPickerCard
            query={deptQuery}
            onQueryChange={handleDeptQueryChange}
            results={deptResults}
            selected={selectedDept}
            isSearching={searchingDepts}
            meta={meta}
            onSelect={handleSelectDept}
            onClear={() => {
              setSelectedDept(null);
              setOptions([]);
              setSelectedOption(null);
              simulate.reset();
            }}
          />
        )}

        {/* Step 2: Options Picker (Always rendered simultaneously) */}
        {(scenario.key === "employee_promotion" ||
          scenario.key === "employee_transfer" ||
          scenario.key === "skill_reskilling" ||
          options.length > 0) && (
          <OptionsPickerCard
            options={options}
            selected={selectedOption}
            isLoading={loadingOptions}
            scenarioKey={scenario.key}
            meta={meta}
            label={scenario.key === "employee_transfer" ? "Destination Department" : undefined}
            placeholderText={
              !selectedEmployee
                ? scenario.key === "employee_promotion"
                  ? "Select an employee above to load eligible target positions"
                  : scenario.key === "employee_transfer"
                    ? "Select an employee above to choose a destination department"
                    : "Select an option from the list"
                : "No available options for this selection"
            }
            onSelect={(opt) => {
              setSelectedOption(opt);
              setSelectedTargetPosition(null);
            }}
          />
        )}

        {/* Transfer step 2b: nested target position in destination */}
        {scenario.key === "employee_transfer" && (
          <OptionsPickerCard
            options={targetPositions}
            selected={selectedTargetPosition}
            isLoading={loadingPositions}
            scenarioKey="employee_promotion"
            meta={meta}
            label="Target Position in Destination Department"
            placeholderText={
              !selectedOption
                ? "Select a destination department above first to view available positions"
                : "No available positions found in this department"
            }
            onSelect={setSelectedTargetPosition}
          />
        )}

        {/* Step 3: Simulation Parameters (Always rendered simultaneously) */}
        {numericFields.length > 0 && (
          <CreativeParamsCard
            fields={numericFields}
            params={params}
            meta={meta}
            scenarioKey={scenario.key}
            onChange={(name, value) => setParams((prev) => ({ ...prev, [name]: value }))}
          />
        )}

        {/* Step 4: Run Simulation Button (Always visible) */}
        <RunButton
          canRun={Boolean(canRun)}
          isPending={simulate.isPending}
          meta={meta}
          disabledReason={runDisabledReason}
          onClick={handleRun}
        />
      </div>

      {/* ── Right Column: Simulation Results ── */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <SimulationResultPanel
          isPending={simulate.isPending}
          error={simulate.error}
          data={simulate.data ?? null}
          subjectName={isEmployee ? (selectedEmployee?.employee_name ?? null) : (selectedDept?.department_name ?? null)}
          meta={meta}
          hasSubject={hasSubject}
        />
      </div>
    </>
  );
}

// ─── Employee picker with Combobox Dropdown + Search Bar ──────────────────────

function EmployeePickerCard({
  query,
  onQueryChange,
  results,
  selected,
  context,
  isSearching,
  isLoadingContext,
  searchError,
  meta,
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
  meta: ScenarioMeta;
  onSelect: (h: EmployeeHit) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Autofocus the search bar inside dropdown when it opens
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleItemSelect = (hit: EmployeeHit) => {
    onSelect(hit);
    setIsOpen(false);
  };

  return (
    <Card
      title="Select Employee"
      subtitle="Choose an employee for this simulation"
      icon={<Users className="h-3.5 w-3.5" />}
      meta={meta}
      overflowVisible
      className={cn("transition-all", isOpen ? "relative z-30" : "relative z-10")}
    >
      <div className="space-y-4">
        {/* Dropdown Container */}
        <div ref={dropdownRef} className="relative">
          {/* Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border bg-background px-4 py-3 text-left text-sm transition-all cursor-pointer",
              "hover:border-primary/50 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs",
              isOpen ? "border-primary ring-2 ring-primary/20 bg-muted/20" : "border-border"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition-colors",
                  selected ? meta.badgeColor : "bg-muted text-muted-foreground"
                )}
              >
                {selected ? selected.employee_name.charAt(0).toUpperCase() : <Users className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                {selected ? (
                  <>
                    <div className="font-semibold text-foreground truncate">{selected.employee_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[selected.employee_id, selected.department, selected.position_title].filter(Boolean).join(" · ")}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium text-foreground">Select an employee...</div>
                    <div className="text-xs text-muted-foreground">Click to browse or search</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              {selected && (
                <span className={cn("text-[11px] font-semibold rounded-full px-2 py-0.5", meta.badgeColor)}>
                  Selected
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-70" />
            </div>
          </button>

          {/* ── Dropdown Menu with Embedded Search Bar ── */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              {/* Search Bar at Top of Dropdown */}
              <div className="p-3 border-b border-border bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search by name, ID, department, or role..."
                    className="pl-9 pr-8 h-9 text-xs rounded-xl border-border bg-background shadow-none focus-visible:ring-1"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => onQueryChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Error */}
              {searchError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-b border-border">
                  {searchError}
                </div>
              )}

              {/* Scrollable Results List (comfortably fits at least 3-5 employees with smooth scrolling) */}
              <div className="max-h-80 min-h-[190px] space-y-1 overflow-y-auto p-2">
                {isSearching ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching employees...</span>
                  </div>
                ) : results.length > 0 ? (
                  results.map((hit) => {
                    const isCurrent = selected?.employee_id === hit.employee_id;
                    return (
                      <button
                        key={hit.employee_id}
                        type="button"
                        onClick={() => handleItemSelect(hit)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-all cursor-pointer group",
                          isCurrent
                            ? cn("border border-primary/40 font-medium", meta.accentBg)
                            : "border border-transparent hover:bg-muted/70 hover:border-border/60"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                              meta.badgeColor
                            )}
                          >
                            {(hit.employee_name ?? "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{hit.employee_name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {[hit.employee_id, hit.department, hit.position_title].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs ml-2">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No employees found matching "{query}"
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{results.length} employees available</span>
                <span className="opacity-70">Click to select</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Employee Detailed Profile Preview */}
        {selected && (
          <SelectedEmployeeCard
            hit={selected}
            context={context}
            isLoadingContext={isLoadingContext}
            onClear={onClear}
            onChangeClick={() => setIsOpen(true)}
            meta={meta}
          />
        )}
      </div>
    </Card>
  );
}

function SelectedEmployeeCard({
  hit,
  context,
  isLoadingContext,
  onClear,
  onChangeClick,
  meta,
}: {
  hit: EmployeeHit;
  context: EmployeeContext | null;
  isLoadingContext: boolean;
  onClear: () => void;
  onChangeClick: () => void;
  meta: ScenarioMeta;
}) {
  const p = (context ?? hit) as Record<string, unknown>;
  const name = String(p["employee_name"] ?? hit.employee_name);
  const empId = String(p["employee_id"] ?? hit.employee_id);
  const dept = String(p["department"] ?? hit.department ?? "");
  const title = String(p["position_title"] ?? hit.position_title ?? "");
  const level = p["job_level"] as string | undefined;
  const perf = p["performance_score"];
  const readiness = p["readiness"] as string | undefined;
  const skills = p["skills"];
  const skillList = Array.isArray(skills) ? (skills as string[]) : [];

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold shadow-xs", meta.badgeColor)}>
            {name.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="font-semibold text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">
              {[empId, dept, title].filter(Boolean).join(" · ")}
            </div>
            {empId && (
              <Link
                to="/employee/$employeeId"
                params={{ employeeId: empId }}
                className={cn("text-xs font-medium underline-offset-2 hover:underline inline-block mt-0.5", meta.accentText)}
              >
                View full profile →
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onChangeClick}
            className="rounded-lg px-2.5 py-1 text-xs font-medium border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Clear employee selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoadingContext && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading employee context...
        </div>
      )}

      {!isLoadingContext && (level || perf !== undefined || readiness) && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-background p-3">
          {level && <StatCell label="Level" value={level} />}
          {perf !== undefined && perf !== null && <StatCell label="Perf." value={String(perf)} />}
          {readiness && <StatCell label="Readiness" value={readiness} />}
        </div>
      )}

      {skillList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skillList.slice(0, 8).map((s) => (
            <span key={s} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}

// ─── Department picker ────────────────────────────────────────────────────────

function DepartmentPickerCard({
  query,
  onQueryChange,
  results,
  selected,
  isSearching,
  meta,
  onSelect,
  onClear,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  results: DepartmentHit[];
  selected: DepartmentHit | null;
  isSearching: boolean;
  meta: ScenarioMeta;
  onSelect: (d: DepartmentHit) => void;
  onClear: () => void;
}) {
  const filtered = query.trim()
    ? results.filter((d) => d.department_name.toLowerCase().includes(query.toLowerCase()))
    : results;

  return (
    <Card
      title="Select Department"
      subtitle="This scenario applies to a whole department"
      icon={<Building2 className="h-3.5 w-3.5" />}
      meta={meta}
    >
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", meta.badgeColor)}>
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold text-sm">{selected.department_name}</div>
              {selected.headcount != null && (
                <div className="text-xs text-muted-foreground">{selected.headcount} employees</div>
              )}
            </div>
          </div>
          <button
            onClick={onClear}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Filter departments..."
            isLoading={isSearching}
          />
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto sm:grid-cols-3">
              {filtered.map((dept) => (
                <button
                  key={dept.department_id}
                  onClick={() => onSelect(dept)}
                  className="group flex flex-col items-start rounded-xl border border-border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm hover:bg-muted/50"
                >
                  <span className={cn("mb-2 grid h-8 w-8 place-items-center rounded-lg", meta.badgeColor)}>
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="text-xs font-semibold text-foreground leading-tight">{dept.department_name}</div>
                  {dept.headcount != null && (
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{dept.headcount} staff</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            !isSearching && <p className="text-xs text-muted-foreground px-1">{query ? "No departments matched." : "Loading departments..."}</p>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Options picker (Always rendered simultaneously) ─────────────────────────

const OPTIONS_LABEL: Record<string, string> = {
  employee_promotion: "Target position",
  employee_transfer: "Target department",
  headcount_reduction: "Target role (optional)",
  workforce_expansion: "Role to hire (optional)",
  budget_change: "Focus area (optional)",
  skill_reskilling: "Training programme",
  business_demand_change: "Affected team (optional)",
};

function OptionsPickerCard({
  options,
  selected,
  isLoading,
  scenarioKey,
  meta,
  label,
  placeholderText,
  onSelect,
}: {
  options: OptionItem[];
  selected: OptionItem | null;
  isLoading: boolean;
  scenarioKey: string;
  meta: ScenarioMeta;
  label?: string;
  placeholderText?: string;
  onSelect: (o: OptionItem | null) => void;
}) {
  const title = label ?? OPTIONS_LABEL[scenarioKey] ?? "Select option";

  return (
    <Card title={title} meta={meta}>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading options from backend...
        </div>
      ) : options.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          {placeholderText ?? "Select an employee above to load eligible options"}
        </div>
      ) : (
        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {options.map((opt) => {
            const active = selected?.id === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(active ? null : opt)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all cursor-pointer",
                  active
                    ? "border-primary/40 bg-primary/5 font-medium shadow-xs"
                    : "border-transparent hover:border-border hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-background"
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 leading-snug">
                  <span className="font-medium text-foreground block">{opt.label}</span>
                  {Boolean(
                    opt["business_unit"] ||
                    opt["department"] ||
                    opt["job_level"] ||
                    opt["position_criticality"] ||
                    opt["vacancies"] !== undefined
                  ) && (
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {[
                        opt["business_unit"],
                        opt["department"],
                        opt["job_level"],
                        opt["position_criticality"] ? `${opt["position_criticality"]} criticality` : null,
                        opt["vacancies"] !== undefined ? `${opt["vacancies"]} vacancies` : null,
                        opt["position_status"],
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                {active && (
                  <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 self-center", meta.badgeColor)}>
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Creative Parameters Card ─────────────────────────────────────────────────

function CreativeParamsCard({
  fields,
  params,
  meta,
  scenarioKey,
  onChange,
}: {
  fields: ParamField[];
  params: Record<string, string>;
  meta: ScenarioMeta;
  scenarioKey: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <Card title="Simulation Parameters" subtitle="Configure the scenario specifics" meta={meta}>
      <div className="space-y-6">
        {fields.map((field) => {
          const raw = parseFloat(params[field.name] ?? "");
          const val = isNaN(raw) ? (field.min ?? 0) : raw;
          if (field.inputType === "slider") {
            return (
              <SliderInput
                key={field.name}
                field={field}
                value={val}
                meta={meta}
                scenarioKey={scenarioKey}
                onChange={(v) => onChange(field.name, String(v))}
              />
            );
          }
          if (field.inputType === "stepper") {
            return (
              <StepperInput
                key={field.name}
                field={field}
                value={val}
                meta={meta}
                onChange={(v) => onChange(field.name, String(v))}
              />
            );
          }
          return null;
        })}
      </div>
    </Card>
  );
}

function SliderInput({
  field,
  value,
  meta,
  scenarioKey,
  onChange,
}: {
  field: ParamField;
  value: number;
  meta: ScenarioMeta;
  scenarioKey: string;
  onChange: (v: number) => void;
}) {
  const min = field.min ?? -50;
  const max = field.max ?? 100;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const isBudget = scenarioKey === "budget_change";
  const isNeg = value < 0;
  const presets = isBudget ? [-20, -10, -5, 5, 10, 20] : [5, 10, 15, 20, 30];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{field.label}</label>
        <span className={cn("rounded-lg px-3 py-1 text-xl font-bold tabular-nums", meta.badgeColor)}>
          {value > 0 && min < 0 ? "+" : ""}{value}{field.suffix ?? ""}
        </span>
      </div>
      <div className="relative h-3 w-full">
        <div className="absolute inset-0 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute top-0 h-full rounded-full transition-all duration-75"
            style={{
              left: isBudget && min < 0 ? `${((-min) / (max - min)) * 100}%` : "0%",
              width: isBudget && min < 0 ? `${Math.abs(value / (max - min)) * 100}%` : `${pct}%`,
              marginLeft: isBudget && min < 0 && isNeg ? `-${Math.abs(value / (max - min)) * 100}%` : 0,
              background: isBudget ? (isNeg ? "hsl(0 70% 55%)" : "hsl(145 60% 45%)") : "hsl(var(--primary))",
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={field.step ?? 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: 1 }}
        />
        <div
          className={cn("pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md transition-all", meta.badgeColor)}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{field.suffix}</span>
        {min < 0 && <span className="font-medium">0{field.suffix}</span>}
        <span>{max}{field.suffix}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer",
              value === p ? cn(meta.badgeColor, "border-transparent") : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {p > 0 && min < 0 ? "+" : ""}{p}{field.suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepperInput({
  field,
  value,
  meta,
  onChange,
}: {
  field: ParamField;
  value: number;
  meta: ScenarioMeta;
  onChange: (v: number) => void;
}) {
  const min = field.min ?? 1;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const quickSteps = field.suffix?.trim() === "months" ? [1, 3, 6, 12, 24] : [1, 2, 5, 10];

  return (
    <div>
      <div className="mb-3">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{field.label}</label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background transition-all hover:bg-muted disabled:opacity-30 cursor-pointer"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 px-4", meta.badgeColor)}>
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {field.suffix && <span className="text-sm font-medium opacity-70">{field.suffix}</span>}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background transition-all hover:bg-muted disabled:opacity-30 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-1.5">
        {quickSteps.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(Math.min(max, Math.max(min, v)))}
            className={cn(
              "flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors cursor-pointer",
              value === v ? cn(meta.badgeColor, "border-transparent") : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Run Button (Always visible) ──────────────────────────────────────────────

function RunButton({
  canRun,
  isPending,
  meta,
  disabledReason,
  onClick,
}: {
  canRun: boolean;
  isPending: boolean;
  meta: ScenarioMeta;
  disabledReason?: string | null;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={!canRun || isPending}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl px-6 py-4 text-left font-semibold transition-all duration-200",
          canRun && !isPending
            ? "btn-premium cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            : "cursor-not-allowed opacity-50 bg-muted text-muted-foreground border border-border"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <PlayCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
            )}
            <span className="text-base">{isPending ? "Computing Simulation..." : "Run Workforce Simulation"}</span>
          </div>
          {!isPending && canRun && (
            <ArrowRight className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-1" />
          )}
        </div>
      </button>

      {!canRun && !isPending && disabledReason && (
        <div className="mt-2 text-center text-xs text-muted-foreground font-medium">
          {disabledReason}
        </div>
      )}
    </div>
  );
}

// ─── Results panel ────────────────────────────────────────────────────────────

function SimulationResultPanel({
  isPending,
  error,
  data,
  subjectName,
  meta,
  hasSubject,
}: {
  isPending: boolean;
  error: unknown;
  data: SimulationResponse | null;
  subjectName: string | null;
  meta: ScenarioMeta;
  hasSubject: boolean;
}) {
  if (!isPending && !data && !error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 backdrop-blur-md p-8 text-center relative overflow-hidden">
        <div className={cn("mb-4 grid h-16 w-16 place-items-center rounded-2xl shadow-sm", meta.badgeColor)}>
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
        <div className="text-base font-semibold text-foreground">Simulation Engine Ready</div>
        <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
          Configure employee or department parameters on the left and run the simulation to compute live predictive impact.
        </p>

        <div className="mt-6 flex flex-col gap-2 text-left w-full max-w-xs">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/50 px-3.5 py-2 text-xs text-muted-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
            <span>Select target employee or department</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/50 px-3.5 py-2 text-xs text-muted-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
            <span>Fine-tune simulation parameters</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/50 px-3.5 py-2 text-xs text-muted-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
            <span>Execute model & review executive deltas</span>
          </div>
        </div>
      </div>
    );
  }

  if (isPending) {
    return <SimulationRadarHud meta={meta} />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200/90 bg-rose-50/60 p-6 shadow-md dark:border-rose-900/60 dark:bg-rose-950/30 backdrop-blur-md">
        <div className="flex items-center gap-2.5 font-semibold text-rose-700 dark:text-rose-300 mb-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>Simulation Computation Error</span>
        </div>
        <p className="text-sm text-rose-600/90 dark:text-rose-400/90 leading-relaxed">
          {error instanceof Error ? error.message : "An unexpected error occurred while computing the simulation."}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return <RichResultDisplay data={data} subjectName={subjectName} meta={meta} />;
}

// ─── High-Tech Simulation Radar HUD ──────────────────────────────────────────

function SimulationRadarHud({ meta }: { meta: ScenarioMeta }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const steps = [{ delay: 300 }, { delay: 900 }, { delay: 1700 }, { delay: 2300 }];
    const timers = steps.map((s, idx) =>
      setTimeout(() => setActiveStep(idx), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const stages = [
    "Retrieving workforce telemetry & baseline",
    "Running organizational prediction models",
    "Computing fiscal, retention & capacity deltas",
    "Synthesizing executive guidance roadmap",
  ];

  return (
    <div className="flex min-h-[440px] flex-col items-center justify-center rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-8 text-center relative overflow-hidden shadow-xl">
      {/* Background ambient radar rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 dark:opacity-30">
        <div className="absolute h-72 w-72 rounded-full border border-primary/25 pulse-ring" />
        <div className="absolute h-96 w-96 rounded-full border border-primary/15" />
        <div className="absolute h-48 w-48 rounded-full border border-primary/35" />
        <div className="absolute h-72 w-72 rounded-full border-t-2 border-primary/50 radar-sweep" />
      </div>

      {/* Center glowing core */}
      <div className="relative mb-5">
        <div className={cn("relative grid h-20 w-20 place-items-center rounded-3xl shadow-lg border border-primary/30", meta.badgeColor, meta.ringGlow)}>
          <FlaskConical className="h-9 w-9 text-primary animate-pulse" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
        </span>
      </div>

      <div className="relative text-lg font-bold tracking-tight text-foreground">
        Simulating Organizational Impact
      </div>
      <p className="relative mt-1 text-xs text-muted-foreground max-w-xs">
        Predictive intelligence engine is modeling organizational dynamics and evaluating scenario vectors.
      </p>

      {/* Stages stepper */}
      <div className="relative mt-6 w-full max-w-sm space-y-2 text-left">
        {stages.map((stageText, idx) => {
          const isDone = activeStep > idx;
          const isCurrent = activeStep === idx;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-300",
                isCurrent
                  ? "bg-primary/10 border border-primary/20 font-medium text-foreground"
                  : isDone
                  ? "text-muted-foreground opacity-90"
                  : "text-muted-foreground/50 opacity-40"
              )}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                {isDone ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </div>
              <span className="truncate">{stageText}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom glowing progress bar */}
      <div className="relative mt-6 w-full max-w-xs overflow-hidden rounded-full bg-muted/60 h-1.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-500 to-primary transition-all duration-500"
          style={{ width: `${((activeStep + 1) / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Executive Rich Result Display ────────────────────────────────────────────

function RichResultDisplay({
  data,
  subjectName,
  meta,
}: {
  data: SimulationResponse;
  subjectName: string | null;
  meta: ScenarioMeta;
}) {
  const [assumOpen, setAssumOpen] = useState(false);

  // Only include comparison metrics where BOTH before (current) AND after (projected) have valid non-empty values
  const allKeys = Array.from(
    new Set([
      ...Object.keys(data.baseline ?? {}),
      ...Object.keys(data.simulated_state ?? {}),
    ])
  ).filter((k) => {
    const bVal = formatVal(data.baseline?.[k]);
    const sVal = formatVal(data.simulated_state?.[k]);
    return bVal !== null && sVal !== null;
  });

  const scalarImpact = Object.entries(data.impact ?? {}).filter(([, v]) => v !== null && typeof v !== "object");
  const listImpact = Object.entries(data.impact ?? {}).filter(([, v]) => Array.isArray(v));

  return (
    <div className="space-y-4 result-reveal">
      {/* ── Executive Result Header ── */}
      <div className={cn("relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 shadow-lg", meta.ringGlow)}>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--primary)" }}
        />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cn("grid h-10 w-10 place-items-center rounded-2xl shadow-xs", meta.badgeColor)}>
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground tracking-tight">
                  Executive Impact Analysis
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {data.status?.toUpperCase().replace(/_/g, " ") || "COMPLETED"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subjectName ? `Target Subject: ${subjectName}` : "Department Simulation Assessment"}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/60">
            Just modeled
          </span>
        </div>
      </div>

      {/* ── Scalar Key Performance Deltas Grid ── */}
      {scalarImpact.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {scalarImpact.map(([key, value]) => {
            const formatted = formatVal(value);
            const isPos = typeof value === "number" && value > 0;
            const isNeg = typeof value === "number" && value < 0;
            const label = key.replace(/_/g, " ");
            const displayVal = (isPos ? "+" : "") + (formatted ?? "—");

            return (
              <div
                key={key}
                className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 shadow-sm min-w-0 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground truncate flex-1 pr-2" title={label}>
                    {label}
                  </div>
                  {isPos ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isNeg ? (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 opacity-70" />
                  )}
                </div>

                <div
                  className={cn(
                    "text-xl sm:text-2xl font-black tabular-nums tracking-tight truncate",
                    isPos
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isNeg
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                  )}
                  title={displayVal}
                >
                  {displayVal}
                </div>

                <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 flex items-center gap-1">
                  <span className={cn("h-1 w-1 rounded-full", isPos ? "bg-emerald-500" : isNeg ? "bg-rose-500" : "bg-primary")} />
                  <span>Projected Delta</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Visual Comparison Matrix (Current vs Projected) ── */}
      {allKeys.length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="border-b border-border bg-muted/40 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Workforce Metrics Shift Analysis
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground bg-background px-2.5 py-0.5 rounded-full border border-border">
              {allKeys.length} Indicators Matched
            </span>
          </div>

          <div className="grid grid-cols-3 border-b border-border bg-muted/20 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground gap-2">
            <div className="truncate">Metric</div>
            <div className="text-center truncate">Current Baseline</div>
            <div className="text-center truncate">Projected State</div>
          </div>

          <div className="divide-y divide-border/60">
            {allKeys.map((key) => {
              const bVal = formatVal(data.baseline[key]) ?? "—";
              const sVal = formatVal(data.simulated_state[key]) ?? "—";
              const changed = bVal !== sVal;
              const metricLabel = key.replace(/_/g, " ");

              return (
                <div
                  key={key}
                  className={cn(
                    "grid grid-cols-3 px-5 py-3 text-sm items-center gap-2 transition-colors",
                    changed && "bg-emerald-500/5 dark:bg-emerald-950/15"
                  )}
                >
                  <div className="text-xs font-semibold text-foreground truncate min-w-0" title={metricLabel}>
                    {metricLabel}
                  </div>

                  <div className="text-center font-medium tabular-nums text-muted-foreground truncate min-w-0" title={bVal}>
                    <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs border border-border/60">
                      {bVal}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 font-bold tabular-nums min-w-0 overflow-hidden" title={sVal}>
                    {changed ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-xs">
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="truncate">{sVal}</span>
                      </span>
                    ) : (
                      <span className="rounded-lg bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground border border-transparent">
                        {sVal}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List Impact & Strategic Directives ── */}
      {listImpact.map(([key, value]) => (
        <div key={key} className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className={cn("px-5 py-3.5 border-b border-border flex items-center gap-2 font-bold text-xs uppercase tracking-wider", meta.accentBg, meta.accentText)}>
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="truncate" title={key.replace(/_/g, " ")}>
              {key.replace(/_/g, " ")}
            </span>
          </div>
          <ul className="divide-y divide-border/60 p-2">
            {(value as unknown[]).map((item, i) => (
              <li key={i} className="flex items-start gap-3 px-3 py-2.5 text-xs text-foreground/90 rounded-xl hover:bg-muted/30 transition-colors">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <span className="min-w-0 flex-1 break-words leading-relaxed font-normal">
                  {typeof item === "string" ? item : JSON.stringify(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* ── Warnings Box ── */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4.5 shadow-sm dark:border-amber-500/25 dark:bg-amber-950/20 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Operational Risk Warnings ({data.warnings.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            {data.warnings.map((w, i) => (
              <li key={i} className="break-words">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Model Assumptions Accordion ── */}
      {data.assumptions && Object.keys(data.assumptions).length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <button
            onClick={() => setAssumOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span>Model Assumptions & Constraints</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", assumOpen && "rotate-180")} />
          </button>
          {assumOpen && (
            <div className="border-t border-border divide-y divide-border/60">
              {Object.entries(data.assumptions)
                .filter(([, v]) => v !== null && typeof v !== "object")
                .map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-xs min-w-0">
                    <span className="text-muted-foreground truncate min-w-0" title={key.replace(/_/g, " ")}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-semibold text-right break-words min-w-0 max-w-[60%] text-foreground">
                      {String(value)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared Card wrapper ──────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  icon,
  meta,
  children,
  className,
  overflowVisible = false,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  meta: ScenarioMeta;
  children: React.ReactNode;
  className?: string;
  overflowVisible?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xs transition-all",
        overflowVisible ? "overflow-visible" : "overflow-hidden",
        className
      )}
    >
      <div className={cn("px-5 py-3.5 border-b border-border/80 rounded-t-3xl", meta.accentBg)}>
        <div className="flex items-center gap-2.5">
          {icon && <span className={cn("grid h-7 w-7 place-items-center rounded-xl shadow-2xs", meta.badgeColor)}>{icon}</span>}
          <div>
            <div className="text-sm font-semibold text-foreground">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  isLoading,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="rounded-xl pl-10 h-11 border-border bg-background"
      />
      {isLoading && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
    </div>
  );
}

function formatVal(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}
