import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  Loader2,
  PlayCircle,
  Search,
  Sparkles,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import { CenterPanel } from "@/components/CenterPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/performance/PerformanceUI";
import { cn } from "@/lib/utils";
import { employees } from "@/lib/employees";
import {
  pickArray,
  pickObject,
  pickString,
  runScenarioSimulation,
  scenarioDefinitions,
  searchEmployees,
  toLines,
  type ScenarioDefinition,
} from "@/services/scenario";

const departments = Array.from(new Set(employees.map((person) => person.department))).sort();

type Props = { open: boolean; onClose: () => void };

export function ScenarioSimulatorPanel({ open, onClose }: Props) {
  const [scenario, setScenario] = useState<ScenarioDefinition | null>(null);

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
          ? scenario.blurb
          : "Pick a scenario, enter the details, and the backend returns the impact, risks and recommendations."
      }
      {...(scenario ? { onBack: () => setScenario(null) } : {})}
    >
      {scenario ? (
        <ScenarioForm scenario={scenario} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {scenarioDefinitions.map((item) => (
            <button
              key={item.key}
              onClick={() => setScenario(item)}
              className="group rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", item.tint)}>
                  {item.subject === "employee" ? (
                    <UserIcon className="h-4 w-4" strokeWidth={2.25} />
                  ) : (
                    <Building2 className="h-4 w-4" strokeWidth={2.25} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                    {item.title}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.blurb}</p>
                  <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {item.subject === "employee" ? "Employee based" : "Department based"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </CenterPanel>
  );
}

function ScenarioForm({ scenario }: { scenario: ScenarioDefinition }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [department, setDepartment] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const search = useMutation({ mutationFn: (value: string) => searchEmployees(value) });
  const simulate = useMutation({ mutationFn: runScenarioSimulation });

  const results = useMemo(() => {
    const rows = pickArray<Record<string, unknown>>(search.data, "employees", "results", "records", "matches");
    if (rows?.length) return rows;
    const single = pickObject<Record<string, unknown>>(search.data, "employee", "data", "result");
    return single ? [single] : [];
  }, [search.data]);

  const employeeId = selected ? pickString(selected, "Employee_ID", "employee_id", "id") : null;
  const employeeName = selected ? pickString(selected, "Employee_Name", "employee_name", "name") : null;

  const canRun =
    scenario.subject === "employee" ? Boolean(employeeId) : Boolean(department);

  const run = () => {
    const parameters: Record<string, string | number> = {};
    for (const field of scenario.fields) {
      const raw = values[field.name]?.trim();
      if (!raw) continue;
      parameters[field.name] = field.type === "number" ? Number(raw) : raw;
    }
    simulate.mutate({
      scenario_type: scenario.key,
      ...(scenario.subject === "employee" && employeeId ? { employee_id: employeeId } : {}),
      ...(scenario.subject === "department"
        ? { department }
        : selected
          ? { department: pickString(selected, "Department", "department") ?? "" }
          : {}),
      parameters,
    });
  };

  return (
    <div className="space-y-4">
      {scenario.subject === "employee" ? (
        <SectionCard title="Find the employee" subtitle="Search by Employee ID or name." tint="bg-pastel-teal">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (query.trim()) search.mutate(query.trim());
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. EMP1042 or Usman Ali"
              className="rounded-xl"
            />
            <Button type="submit" variant="secondary" className="rounded-xl" disabled={search.isPending}>
              {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">Search</span>
            </Button>
          </form>

          {search.error && (
            <p className="mt-3 rounded-xl bg-pastel-rose/50 p-3 text-xs">
              {search.error instanceof Error ? search.error.message : "Search failed."}
            </p>
          )}

          {!search.isPending && search.isSuccess && results.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">No matching employee found.</p>
          )}

          {results.length > 0 && (
            <div className="mt-3 space-y-2">
              {results.slice(0, 8).map((row, index) => {
                const id = pickString(row, "Employee_ID", "employee_id", "id") ?? String(index);
                const isActive = employeeId === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelected(row)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left text-sm transition-colors",
                      isActive ? "bg-pastel-teal/70" : "hover:bg-muted/60",
                    )}
                  >
                    <div className="font-medium">
                      {pickString(row, "Employee_Name", "employee_name", "name") ?? id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[
                        id,
                        pickString(row, "Department", "department"),
                        pickString(row, "Position_Title", "position_title", "Designation"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selected && (
            <div className="mt-4 rounded-2xl bg-muted/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Current data</h4>
                {employeeId && (
                  <Link
                    to="/employee/$employeeId"
                    params={{ employeeId }}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Full profile
                  </Link>
                )}
              </div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                {Object.entries(selected)
                  .filter(([, value]) => value !== null && typeof value !== "object")
                  .slice(0, 16)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1">
                      <dt className="text-muted-foreground">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-right font-medium">{String(value)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Select the department" tint="bg-pastel-sky">
          <div className="flex flex-wrap gap-2">
            {departments.map((item) => (
              <button
                key={item}
                onClick={() => setDepartment(item)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  department === item ? "bg-pastel-sky" : "hover:bg-muted/60",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <Input
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Or type a department name"
            className="mt-3 rounded-xl"
          />
        </SectionCard>
      )}

      <SectionCard title="Scenario details" subtitle="These values are sent to the simulation service." tint="bg-pastel-lavender">
        <div className="grid gap-3 sm:grid-cols-2">
          {scenario.fields.map((field) => (
            <label
              key={field.name}
              className={cn("block text-xs", field.type === "textarea" && "sm:col-span-2")}
            >
              <span className="mb-1 block font-medium text-muted-foreground">
                {field.label}
                {field.suffix ? ` (${field.suffix})` : ""}
              </span>
              {field.type === "textarea" ? (
                <Textarea
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  className="rounded-xl"
                  rows={2}
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  className="rounded-xl"
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={run} disabled={!canRun || simulate.isPending} className="rounded-xl">
            {simulate.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-1.5 h-4 w-4" />
            )}
            Run Simulation
          </Button>
          {!canRun && (
            <span className="text-xs text-muted-foreground">
              {scenario.subject === "employee" ? "Select an employee first." : "Select a department first."}
            </span>
          )}
        </div>
      </SectionCard>

      {(simulate.isPending || Boolean(simulate.error) || Boolean(simulate.data)) && (
        <ScenarioResult
          isPending={simulate.isPending}
          error={simulate.error}
          data={simulate.data}
          employeeName={employeeName}
        />
      )}
    </div>
  );
}

function ScenarioResult({
  isPending,
  error,
  data,
  employeeName,
}: {
  isPending: boolean;
  error: unknown;
  data: unknown;
  employeeName: string | null;
}) {
  if (isPending) {
    return (
      <div className="grid h-32 place-items-center rounded-2xl bg-muted/40 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Running simulation…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-pastel-rose/50 p-4 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <TriangleAlert className="h-4 w-4" /> Simulation unavailable
        </div>
        <p className="mt-1.5">{error instanceof Error ? error.message : "Something went wrong."}</p>
      </div>
    );
  }

  const root = (data && typeof data === "object" ? (data as Record<string, unknown>) : {}) as Record<string, unknown>;
  const result = pickObject<Record<string, unknown>>(root, "result", "simulation", "data") ?? root;

  const summary = pickString(result, "summary", "narrative", "message", "explanation") ?? undefined;
  const metrics = pickArray<Record<string, unknown>>(result, "metrics", "impact_metrics", "impacts", "kpis") ?? [];
  const risks = toLines(result["risks"] ?? result["risk_factors"] ?? result["warnings"]);
  const reasons = toLines(result["reasons"] ?? result["drivers"] ?? result["reasoning"]);
  const recommendations = toLines(result["recommendations"] ?? result["actions"] ?? result["next_steps"]);

  const nothing = !summary && !metrics.length && !risks.length && !reasons.length && !recommendations.length;

  return (
    <div className="space-y-4">
      <SectionCard
        title={employeeName ? `Simulation result — ${employeeName}` : "Simulation result"}
        tint="bg-pastel-mint"
      >
        {summary ? (
          <p className="text-sm leading-relaxed">{summary}</p>
        ) : (
          <p className="text-xs text-muted-foreground">The service returned a result without a summary.</p>
        )}

        {metrics.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => (
              <div key={index} className="rounded-xl border p-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {(pickString(metric, "display_name", "metric_name", "label", "name") ?? "Metric").replace(/_/g, " ")}
                </div>
                <div className="mt-0.5 text-lg font-semibold">
                  {pickString(metric, "value", "amount", "score") ?? "—"}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {pickString(metric, "unit", "suffix") ?? ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {reasons.length > 0 && <LineCard title="Why" tint="bg-pastel-sky" lines={reasons} />}
      {risks.length > 0 && <LineCard title="Risks" tint="bg-pastel-rose" lines={risks} />}
      {recommendations.length > 0 && (
        <LineCard title="Recommendations" tint="bg-pastel-teal" lines={recommendations} icon />
      )}

      {nothing && (
        <pre className="max-h-64 overflow-auto rounded-2xl bg-muted/40 p-3 text-[11px]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function LineCard({
  title,
  tint,
  lines,
  icon,
}: {
  title: string;
  tint: string;
  lines: { title: string; detail?: string }[];
  icon?: boolean;
}) {
  return (
    <SectionCard title={title} tint={tint}>
      <ul className="space-y-2">
        {lines.map((line, index) => (
          <li key={index} className="rounded-xl border p-3 text-sm">
            <div className="flex items-start gap-2 font-medium">
              {icon && <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
              {line.title}
            </div>
            {line.detail && <p className="mt-1 text-xs text-muted-foreground">{line.detail}</p>}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
