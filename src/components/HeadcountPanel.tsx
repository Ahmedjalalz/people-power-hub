import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  Users2, BadgeCheck, Wallet, DoorOpen, Percent, Gauge, Sparkle, MessageSquare, Table2, BarChart3, Search, RotateCcw, Check, Calendar, AlertTriangle
} from "lucide-react";
import {
  getHeadcountKPIs,
  getHeadcountByDepartment,
  getHeadcountTrend,
  getMovementTrend,
  getCompositionByJobLevel,
  getVacancyAgeing,
  getBudgetUtilization,
  getCriticalSnapshot,
  getExceptionsAndActions,
  getWorkforceActivity,
} from "@/services/headcount";
import { Link } from "@tanstack/react-router";
import { CenterPanel } from "@/components/CenterPanel";
import { cn } from "@/lib/utils";

const chartTooltip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 };

type Filters = {
  department: string;
  businessUnit: string;
  location: string;
  employmentType: string;
  jobLevel: string;
  dateRange: string;
  search: string;
};

const emptyFilters: Filters = {
  department: "All", businessUnit: "All", location: "All", employmentType: "All",
  jobLevel: "All", dateRange: "Last 24 months", search: "",
};

export function HeadcountPanel({
  open,
  onClose,
  onAskAssistant,
}: {
  open: boolean;
  onClose: () => void;
  onAskAssistant?: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);

  // Active scope from applied filter
  const activeScope = useMemo(() => {
    const s: Record<string, string> = {};
    if (applied.department !== "All") s.department = applied.department;
    if (applied.businessUnit !== "All") s.business_unit = applied.businessUnit;
    if (applied.jobLevel !== "All") s.job_level = applied.jobLevel;
    return Object.keys(s).length > 0 ? s : undefined;
  }, [applied]);

  // Real backend queries
  const kpisQuery = useQuery({ queryKey: ["headcount", "kpis", activeScope], queryFn: () => getHeadcountKPIs(activeScope), enabled: open });
  const deptQuery = useQuery({ queryKey: ["headcount", "dept", activeScope], queryFn: () => getHeadcountByDepartment(activeScope), enabled: open });
  const trendQuery = useQuery({ queryKey: ["headcount", "trend", activeScope], queryFn: () => getHeadcountTrend(activeScope), enabled: open });
  const movementQuery = useQuery({ queryKey: ["headcount", "movement", activeScope], queryFn: () => getMovementTrend(activeScope), enabled: open });
  const jobLevelQuery = useQuery({ queryKey: ["headcount", "jobLevel", activeScope], queryFn: () => getCompositionByJobLevel(activeScope), enabled: open });
  const vacancyAgeingQuery = useQuery({ queryKey: ["headcount", "vacancyAgeing", activeScope], queryFn: () => getVacancyAgeing(activeScope), enabled: open });
  const budgetQuery = useQuery({ queryKey: ["headcount", "budget", activeScope], queryFn: () => getBudgetUtilization(activeScope), enabled: open });
  const criticalQuery = useQuery({ queryKey: ["headcount", "critical", activeScope], queryFn: () => getCriticalSnapshot(activeScope), enabled: open });
  const exceptionsQuery = useQuery({ queryKey: ["headcount", "exceptions", activeScope], queryFn: () => getExceptionsAndActions(activeScope), enabled: open });
  const activityQuery = useQuery({ queryKey: ["headcount", "activity", activeScope], queryFn: () => getWorkforceActivity(activeScope), enabled: open });

  // Latest reporting date from backend
  const dataAsOfDate = kpisQuery.data?.data_as_of_date || deptQuery.data?.data_as_of_date || "2026-08-01";

  // Dynamic filter dropdown options extracted from real department backend response
  const departmentOptions = useMemo(() => {
    if (!deptQuery.data?.records) return [];
    return Array.from(new Set(deptQuery.data.records.map((r: any) => r.department))).filter(Boolean);
  }, [deptQuery.data]);

  const businessUnitOptions = useMemo(() => {
    if (!deptQuery.data?.records) return [];
    return Array.from(new Set(deptQuery.data.records.map((r: any) => r.business_unit))).filter(Boolean);
  }, [deptQuery.data]);

  // Section 1: Real Workforce KPI Cards (Only the 7 cards returned by backend API)
  const realKpiCards = useMemo(() => {
    if (!kpisQuery.data?.metrics) return [];
    
    return kpisQuery.data.metrics.map(m => {
      let tint = "bg-pastel-teal";
      let icon = Users2;
      let val = m.value !== null && m.value !== undefined ? m.value.toString() : "0";
      
      if (m.unit === "percentage" && typeof m.value === "number") {
        val = `${m.value.toFixed(1)}%`;
      }

      if (m.metric_name === "actual_employee_count") { tint = "bg-pastel-teal"; icon = Users2; }
      else if (m.metric_name === "approved_position_count") { tint = "bg-pastel-sky"; icon = BadgeCheck; }
      else if (m.metric_name === "budgeted_position_count") { tint = "bg-pastel-blue"; icon = Wallet; }
      else if (m.metric_name === "vacant_approved_position_count") { tint = "bg-pastel-peach"; icon = DoorOpen; }
      else if (m.metric_name === "vacancy_rate_percentage") { tint = "bg-pastel-yellow"; icon = Percent; }
      else if (m.metric_name === "budget_utilization_percentage") { tint = "bg-pastel-lavender"; icon = Gauge; }
      else if (m.metric_name === "workforce_availability_percentage") { tint = "bg-pastel-mint"; icon = Sparkle; }

      return {
        key: m.metric_name,
        title: m.display_name || m.metric_name.replace(/_/g, " "),
        value: val,
        unit: m.unit,
        tint,
        icon,
      };
    });
  }, [kpisQuery.data]);

  // Section 2: Department Comparison Rows
  const deptRows = useMemo(() => {
    if (!deptQuery.data?.records) return [];
    return deptQuery.data.records
      .filter((r: any) => !applied.search || r.department?.toLowerCase().includes(applied.search.toLowerCase()))
      .map((r: any) => ({
        name: r.department,
        approved: r.approved_position_count,
        budgeted: r.budgeted_position_count,
        actual: r.actual_employee_count,
      }));
  }, [deptQuery.data, applied.search]);

  // Section 3: Headcount Trend
  const trendData = useMemo(() => {
    if (!trendQuery.data?.records) return [];
    return trendQuery.data.records.map((r: any) => ({
      month: r.snapshot_month ? r.snapshot_month.substring(0, 7) : r.month,
      people: r.actual_employee_count,
      approved: r.approved_position_count,
      budgeted: r.budgeted_position_count,
    }));
  }, [trendQuery.data]);

  // Section 4: Movement Trend (Joiners, Leavers, Promotions, Transfers)
  const movementData = useMemo(() => {
    if (!movementQuery.data?.records) return [];
    const monthMap = new Map<string, { month: string; joiners: number; leavers: number; promotions: number; transfers: number }>();
    
    for (const r of movementQuery.data.records) {
      const monthKey = r.month ? r.month.substring(0, 7) : "Unknown";
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { month: monthKey, joiners: 0, leavers: 0, promotions: 0, transfers: 0 });
      }
      const item = monthMap.get(monthKey)!;
      const type = (r.Movement_Type || "").toLowerCase();
      if (type === "join") item.joiners += r.movement_count || 0;
      else if (type === "leave") item.leavers += r.movement_count || 0;
      else if (type === "promotion") item.promotions += r.movement_count || 0;
      else if (type === "transfer") item.transfers += r.movement_count || 0;
    }

    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [movementQuery.data]);

  // Section 5: Composition by Job Level
  const jobLevelData = useMemo(() => {
    if (!jobLevelQuery.data?.records) return [];
    const colors = ["var(--pastel-teal)", "var(--pastel-sky)", "var(--pastel-blue)", "var(--pastel-lavender)", "var(--pastel-peach)", "var(--pastel-rose)"];
    return jobLevelQuery.data.records.map((r: any, idx: number) => ({
      label: r.job_level,
      value: r.actual_employee_count,
      color: colors[idx % colors.length],
    }));
  }, [jobLevelQuery.data]);

  // Section 6: Vacancy Ageing Buckets (0-30, 31-60, 61-90, 90+ days)
  const vacancyAgeingData = useMemo(() => {
    if (!vacancyAgeingQuery.data?.records) return [];
    const buckets = [
      { label: "0–30 days", value: 0, color: "var(--pastel-mint)" },
      { label: "31–60 days", color: "var(--pastel-teal)", value: 0 },
      { label: "61–90 days", color: "var(--pastel-yellow)", value: 0 },
      { label: "90+ days", color: "var(--pastel-peach)", value: 0 },
    ];
    for (const r of vacancyAgeingQuery.data.records) {
      const days = r.vacancy_age_in_days || 0;
      if (days <= 30) buckets[0].value++;
      else if (days <= 60) buckets[1].value++;
      else if (days <= 90) buckets[2].value++;
      else buckets[3].value++;
    }
    return buckets;
  }, [vacancyAgeingQuery.data]);

  // Section 7: Department Budget Utilization
  const budgetRows = useMemo(() => {
    if (!budgetQuery.data?.records) return [];
    return budgetQuery.data.records.map((r: any) => ({
      name: r.department,
      utilization: typeof r.budget_utilization_percentage === "number" ? Number(r.budget_utilization_percentage.toFixed(1)) : 0,
      status: r.budget_status || (r.budget_utilization_percentage >= 95 ? "Critical" : r.budget_utilization_percentage >= 90 ? "Watch" : "Healthy"),
    }));
  }, [budgetQuery.data]);

  // Section 8: Critical Department Snapshot
  const criticalRows = useMemo(() => {
    if (!criticalQuery.data?.records) return [];
    return criticalQuery.data.records.map((r: any) => {
      const rate = r.vacancy_rate_percentage ?? 0;
      const risk = rate >= 20 ? "Critical" : rate >= 14 ? "High" : rate >= 8 ? "Medium" : "Low";
      return {
        dept: r.department,
        current: r.actual_employee_count,
        approved: r.approved_position_count,
        vacancies: r.vacant_approved_position_count,
        rate: typeof rate === "number" ? rate.toFixed(1) : rate,
        risk,
      };
    });
  }, [criticalQuery.data]);

  // Section 9: Exceptions & Suggested Actions
  const exceptionsList = useMemo(() => {
    if (!exceptionsQuery.data?.records) return [];
    return exceptionsQuery.data.records.map((r: any) => ({
      id: r.exception_id,
      title: r.exception_type,
      dept: r.department,
      body: r.exception_description,
      action: r.recommended_action,
      severity: r.severity,
      tint: r.severity === "Critical" ? "bg-pastel-peach" : r.severity === "Warning" ? "bg-pastel-yellow" : "bg-pastel-mint",
    }));
  }, [exceptionsQuery.data]);

  // Section 10: Today's Workforce Activity
  const activityList = useMemo(() => {
    if (!activityQuery.data?.metrics) return [];
    const m = activityQuery.data.metrics;
    const getVal = (name: string) => m.find((x: any) => x.metric_name === name)?.value ?? 0;

    return [
      { label: "Total Workforce", value: getVal("actual_employee_count").toString() },
      { label: "Available for Work", value: getVal("employees_available_for_work").toString() },
      { label: "On Approved Leave", value: getVal("employees_on_approved_leave").toString() },
      { label: "Absent", value: getVal("employees_absent").toString() },
      { label: "Total Overtime", value: `${getVal("total_overtime_hours")} hrs` },
      { label: "Open Positions", value: getVal("daily_open_position_count").toString() },
      { label: "Critical Openings", value: getVal("daily_critical_open_position_count").toString() },
      { label: "Workforce Availability", value: `${typeof getVal("workforce_availability_percentage") === "number" ? getVal("workforce_availability_percentage").toFixed(1) : getVal("workforce_availability_percentage")}%` },
    ];
  }, [activityQuery.data]);

  const isFiltered = JSON.stringify(applied) !== JSON.stringify(emptyFilters);
  const isPending = kpisQuery.isPending || deptQuery.isPending;

  return (
    <CenterPanel
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Headcount Management Dashboard"
      description="Executive overview of workforce planning, staffing, organizational distribution and budget allocation."
      size="lg"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-pastel-teal/70 px-3 py-1 text-[11px] font-medium">
          <Sparkle className="h-3 w-3" /> Live Backend Data
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" /> Data as of: <span className="font-semibold text-foreground">{dataAsOfDate}</span>
        </div>
      </div>

      {/* Global filters */}
      <div className="mb-6 rounded-2xl border bg-muted/30 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Department" value={draft.department} options={departmentOptions} onChange={(v) => setDraft({ ...draft, department: v })} />
          <Select label="Business unit" value={draft.businessUnit} options={businessUnitOptions} onChange={(v) => setDraft({ ...draft, businessUnit: v })} />
          <Select label="Search" value={draft.search} onChange={(v) => setDraft({ ...draft, search: v })} isInput placeholder="Filter by department name..." />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3 justify-end">
            <button
              onClick={() => { setDraft(emptyFilters); setApplied(emptyFilters); }}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
            </button>
            <button
              onClick={() => setApplied(draft)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> Apply Scope
            </button>
          </div>
        </div>
        {isFiltered && (
          <p className="mt-3 text-xs text-muted-foreground">
            Active Filter Scope: {applied.department !== "All" && `Dept: ${applied.department}`} {applied.businessUnit !== "All" && `BU: ${applied.businessUnit}`}
          </p>
        )}
      </div>

      {/* Section 1 — Workforce KPI cards (Only Backend 7 Metrics) */}
      <SectionTitle>Workforce KPI Cards</SectionTitle>
      {isPending ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading backend KPI metrics...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {realKpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.key} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-full", kpi.tint)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{kpi.unit}</span>
                </div>
                <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{kpi.title}</div>
                <div className="text-2xl font-semibold tracking-tight">{kpi.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 2 — Establishment comparison */}
      <SectionTitle>Approved vs Budgeted vs Actual Headcount by Department</SectionTitle>
      <DeptComparison rows={deptRows} />

      {/* Section 3 — Headcount trend & Movement */}
      <SectionTitle>Headcount Trend</SectionTitle>
      <TrendChart data={trendData} />

      <SectionTitle>Workforce Movement (Joiners, Leavers, Promotions, Transfers)</SectionTitle>
      <MovementTrendChart data={movementData} />

      {/* Section 4 & 5 — Donut Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutCard
          title="Workforce Composition by Job Level"
          data={jobLevelData}
          footer={`Total headcount across job levels: ${jobLevelData.reduce((sum, row) => sum + row.value, 0)}`}
        />
        <DonutCard
          title="Vacancy Ageing Breakdown"
          data={vacancyAgeingData}
          footer={`Total open vacancies tracked: ${vacancyAgeingData.reduce((sum, row) => sum + row.value, 0)}`}
        />
      </div>

      {/* Section 6 — Department budget utilization */}
      <SectionTitle>Department Budget Utilization</SectionTitle>
      <div className="space-y-2 rounded-2xl border bg-card p-4">
        {budgetRows.map((dept) => {
          const tone = dept.utilization >= 95 ? "bg-rose-400" : dept.utilization >= 90 ? "bg-orange-400" : dept.utilization >= 80 ? "bg-amber-400" : "bg-emerald-400";
          return (
            <div key={dept.name} className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[12rem_1fr_4rem_6rem]">
              <span className="truncate text-sm font-medium">{dept.name}</span>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/5">
                <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.min(100, dept.utilization)}%` }} />
              </div>
              <span className="text-right text-sm font-semibold">{dept.utilization}%</span>
              <span className="justify-self-end rounded-full bg-muted px-2 py-0.5 text-[11px]">{dept.status}</span>
            </div>
          );
        })}
      </div>

      {/* Section 7 — Critical department snapshot */}
      <SectionTitle>Critical Department Snapshot</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Department</th>
              <th className="px-4 py-2.5">Current</th>
              <th className="px-4 py-2.5">Approved</th>
              <th className="px-4 py-2.5">Gap</th>
              <th className="px-4 py-2.5">Vacancies</th>
              <th className="px-4 py-2.5">Vacancy Rate</th>
              <th className="px-4 py-2.5">Risk</th>
            </tr>
          </thead>
          <tbody>
            {criticalRows.map((row) => (
              <tr key={row.dept} className={cn("border-t", row.risk === "Critical" && "bg-pastel-peach/25")}>
                <td className="px-4 py-2.5 font-medium">{row.dept}</td>
                <td className="px-4 py-2.5">{row.current}</td>
                <td className="px-4 py-2.5">{row.approved}</td>
                <td className="px-4 py-2.5 font-medium">
                  {row.current - row.approved > 0 ? `+${row.current - row.approved}` : row.current - row.approved}
                </td>
                <td className="px-4 py-2.5">{row.vacancies}</td>
                <td className="px-4 py-2.5">{row.rate}%</td>
                <td className="px-4 py-2.5"><RiskBadge level={row.risk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 8 — Exceptions & Suggested Actions */}
      <SectionTitle>Headcount Exceptions & Recommended Actions</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {exceptionsList.map((exc) => (
          <div key={exc.id || exc.title} className={cn("rounded-2xl p-4 border", exc.tint)}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{exc.title}</div>
              <span className="text-[11px] font-semibold uppercase opacity-80">{exc.dept}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/90">{exc.body}</p>
            <div className="mt-3 rounded-xl bg-background/60 p-2.5 text-xs font-medium border border-border/50">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Recommended Action:</span>
              {exc.action}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border bg-card p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Need further workforce analysis?</div>
          <div className="text-xs text-muted-foreground">Ask the AI assistant regarding department staffing, exceptions, or hiring forecasts.</div>
        </div>
        {onAskAssistant ? (
          <button
            onClick={onAskAssistant}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 shrink-0"
          >
            <MessageSquare className="h-4 w-4" /> Ask HR Assistant
          </button>
        ) : (
          <Link
            to="/chatbot"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 shrink-0"
          >
            <MessageSquare className="h-4 w-4" /> Ask HR Assistant
          </Link>
        )}
      </div>

      {/* Section 9 — Today's workforce activity */}
      <SectionTitle>Today's Workforce Activity</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {activityList.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <div className="text-[11px] text-muted-foreground">{item.label}</div>
            <div className="text-xl font-semibold tracking-tight mt-1">{item.value}</div>
          </div>
        ))}
      </div>
    </CenterPanel>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">{children}</h3>;
}

function Select({
  label, value, options, onChange, allowAll = true, isInput = false, placeholder = ""
}: { label: string; value: string; options?: string[]; onChange: (value: string) => void; allowAll?: boolean; isInput?: boolean; placeholder?: string }) {
  if (isInput) {
    return (
      <label className="block">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </span>
      </label>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
      >
        {allowAll && <option value="All">All</option>}
        {options?.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function RiskBadge({ level }: { level: string }) {
  const tone = {
    Low: "bg-pastel-mint", Medium: "bg-pastel-yellow", High: "bg-pastel-peach", Critical: "bg-pastel-rose",
  }[level] || "bg-muted";
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>{level}</span>;
}

function DeptComparison({ rows }: { rows: { name: string; approved: number; budgeted: number; actual: number }[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex justify-end gap-1">
        <ToggleButton active={view === "chart"} onClick={() => setView("chart")} icon={<BarChart3 className="h-3.5 w-3.5" />} label="Chart" />
        <ToggleButton active={view === "table"} onClick={() => setView("table")} icon={<Table2 className="h-3.5 w-3.5" />} label="Table" />
      </div>
      {view === "chart" ? (
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={rows} margin={{ left: -18 }}>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar name="Approved" dataKey="approved" fill="var(--pastel-sky)" radius={[6, 6, 0, 0]} />
              <Bar name="Budgeted" dataKey="budgeted" fill="var(--pastel-teal)" radius={[6, 6, 0, 0]} />
              <Bar name="Actual" dataKey="actual" fill="var(--pastel-lavender)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr><th className="py-2">Department</th><th className="py-2">Approved</th><th className="py-2">Budgeted</th><th className="py-2">Actual</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2">{row.approved}</td>
                  <td className="py-2">{row.budgeted}</td>
                  <td className="py-2">{row.actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TrendChart({ data }: { data: { month: string; people: number; approved?: number; budgeted?: number }[] }) {
  const last = data[data.length - 1]?.people ?? 0;
  const first = data[0]?.people ?? 0;
  const growth = first ? ((last - first) / first) * 100 : 0;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Latest Headcount: {last} employees</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", growth >= 0 ? "bg-pastel-mint" : "bg-pastel-peach")}>
            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}% growth
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: -18 }}>
            <defs>
              <linearGradient id="hcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} interval={Math.max(0, Math.floor(data.length / 8))} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={["dataMin - 10", "dataMax + 10"]} />
            <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
            <Area type="monotone" name="Actual Employees" dataKey="people" stroke="var(--primary)" strokeWidth={2.5} fill="url(#hcFill)" animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MovementTrendChart({ data }: { data: { month: string; joiners: number; leavers: number; promotions: number; transfers: number }[] }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 text-sm font-medium">Monthly Workforce Movement</div>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: -18 }}>
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} interval={Math.max(0, Math.floor(data.length / 8))} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" name="Joiners" dataKey="joiners" stroke="var(--pastel-mint)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" name="Leavers" dataKey="leavers" stroke="var(--pastel-rose)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" name="Promotions" dataKey="promotions" stroke="var(--pastel-teal)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" name="Transfers" dataKey="transfers" stroke="var(--pastel-sky)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DonutCard({
  title, data, footer,
}: { title: string; data: { label: string; value: number; color: string }[]; footer: string }) {
  const total = data.reduce((sum, row) => sum + row.value, 0) || 1;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={42} outerRadius={68} paddingAngle={2}>
                {data.map((row) => <Cell key={row.label} fill={row.color} stroke="var(--card)" />)}
              </Pie>
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full space-y-1">
          {data.map((row) => (
            <div key={row.label} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.color }} />
              <span className="flex-1 truncate text-muted-foreground">{row.label}</span>
              <span className="font-medium">{row.value}</span>
              <span className="w-10 text-right text-muted-foreground">{((row.value / total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs font-medium">{footer}</div>
    </div>
  );
}

function ToggleButton({
  active, onClick, label, icon,
}: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
