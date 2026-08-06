import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  Users2, BadgeCheck, Wallet, DoorOpen, PiggyBank, Percent, Gauge, Coins, Target,
  Repeat, UserPlus, UserMinus, Sparkle, MessageSquare, Table2, BarChart3, Search, RotateCcw, Check,
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
  getWorkforceActivity
} from "@/services/headcount";
import { Link } from "@tanstack/react-router";
import { CenterPanel } from "@/components/CenterPanel";
import { cn } from "@/lib/utils";
import {
  aiInsights, businessUnits, criticalSnapshot, dateRanges, departments, employmentTypes,
  headcountTrend, jobLevelMix, jobLevels, kpis, locations, skills, suggestedActions,
  todayActivity, vacancyAgeing, movementTrend, type RiskLevel,
} from "@/lib/headcount-data";

const chartTooltip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 };

const kpiIcons: Record<string, typeof Users2> = {
  actual: Users2, approved: BadgeCheck, budgeted: Wallet, vacant: DoorOpen, funded: PiggyBank,
  vacancyRate: Percent, budgetUse: Gauge, cost: Coins, hiring: Target, mobility: Repeat,
  newHires: UserPlus, exits: UserMinus,
};

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

  const kpisQuery = useQuery({ queryKey: ["headcount", "kpis"], queryFn: getHeadcountKPIs, enabled: open });
  const deptQuery = useQuery({ queryKey: ["headcount", "dept"], queryFn: getHeadcountByDepartment, enabled: open });
  const trendQuery = useQuery({ queryKey: ["headcount", "trend"], queryFn: getHeadcountTrend, enabled: open });
  const movementQuery = useQuery({ queryKey: ["headcount", "movement"], queryFn: getMovementTrend, enabled: open });
  const jobLevelQuery = useQuery({ queryKey: ["headcount", "jobLevel"], queryFn: getCompositionByJobLevel, enabled: open });
  const vacancyAgeingQuery = useQuery({ queryKey: ["headcount", "vacancyAgeing"], queryFn: getVacancyAgeing, enabled: open });
  const budgetQuery = useQuery({ queryKey: ["headcount", "budget"], queryFn: getBudgetUtilization, enabled: open });
  const criticalQuery = useQuery({ queryKey: ["headcount", "critical"], queryFn: getCriticalSnapshot, enabled: open });
  const exceptionsQuery = useQuery({ queryKey: ["headcount", "exceptions"], queryFn: getExceptionsAndActions, enabled: open });
  const activityQuery = useQuery({ queryKey: ["headcount", "activity"], queryFn: getWorkforceActivity, enabled: open });

  // Map Real Data to mock shapes where possible to preserve UI
  const realDepartments = useMemo(() => {
    if (!deptQuery.data?.records || !budgetQuery.data?.records || !criticalQuery.data?.records) return departments;
    
    // Combine department data from multiple endpoints
    const budgetMap = new Map(budgetQuery.data.records.map(r => [r.department, r.budget_utilization_percentage]));
    const criticalMap = new Map(criticalQuery.data.records.map(r => [r.department, r.vacant_approved_position_count]));

    return deptQuery.data.records.map(r => {
      const deptName = r.department;
      return {
        name: deptName,
        businessUnit: "Technology", // Mock fallback for filters
        location: "Remote", // Mock fallback for filters
        approved: r.approved_position_count,
        budgeted: r.budgeted_position_count,
        actual: r.actual_employee_count,
        vacancies: criticalMap.get(deptName) ?? 0,
        utilization: budgetMap.get(deptName) ?? 0,
        utilizationDelta: 0,
      };
    });
  }, [deptQuery.data, budgetQuery.data, criticalQuery.data]);

  const filteredDepartments = useMemo(() => {
    return realDepartments.filter((dept) => {
      if (applied.department !== "All" && dept.name !== applied.department) return false;
      if (applied.businessUnit !== "All" && dept.businessUnit !== applied.businessUnit) return false;
      if (applied.location !== "All" && dept.location !== applied.location) return false;
      if (applied.search.trim() && !dept.name.toLowerCase().includes(applied.search.trim().toLowerCase())) return false;
      return true;
    });
  }, [applied, realDepartments]);

  const scale = filteredDepartments.length
    ? filteredDepartments.reduce((sum, dept) => sum + dept.actual, 0) /
      (realDepartments.reduce((sum, dept) => sum + dept.actual, 0) || 1)
    : 0;

  const levels = useMemo(
    () =>
      (jobLevelQuery.data?.records ? jobLevelQuery.data.records.map(r => ({ level: r.job_level, count: r.actual_employee_count, color: "var(--pastel-blue)" })) : jobLevelMix)
        .filter((row: any) => applied.jobLevel === "All" || row.level === applied.jobLevel)
        .map((row: any) => ({ ...row, count: Math.max(1, Math.round(row.count * scale)) })),
    [applied.jobLevel, scale, jobLevelQuery.data],
  );

  const realHeadcountTrend = useMemo(() => {
    if (!trendQuery.data?.records) return headcountTrend;
    return trendQuery.data.records.map((r: any) => ({
      month: r.snapshot_month.substring(0, 7),
      people: r.actual_employee_count
    }));
  }, [trendQuery.data]);

  const realMovementTrend = useMemo(() => {
    if (!movementQuery.data?.records) return movementTrend;
    return movementQuery.data.records.map((r: any) => ({
      month: r.month.substring(0, 7),
      joiners: r.joiner_count,
      leavers: r.leaver_count,
      promotions: r.promotion_count,
      transfers: r.transfer_count
    }));
  }, [movementQuery.data]);

  const realVacancyAgeing = useMemo(() => {
    if (!vacancyAgeingQuery.data?.records) return vacancyAgeing;
    // Map numerical days into buckets
    const buckets = [
      { bucket: "0–30 days", count: 0, color: "var(--pastel-mint)" },
      { bucket: "31–60 days", count: 0, color: "var(--pastel-teal)" },
      { bucket: "61–90 days", count: 0, color: "var(--pastel-yellow)" },
      { bucket: "90+ days", count: 0, color: "var(--pastel-peach)" }
    ];
    for (const r of vacancyAgeingQuery.data.records) {
      const days = r.vacancy_age_in_days;
      if (days <= 30) buckets[0].count++;
      else if (days <= 60) buckets[1].count++;
      else if (days <= 90) buckets[2].count++;
      else buckets[3].count++;
    }
    return buckets;
  }, [vacancyAgeingQuery.data]);

  const realCriticalSnapshot = useMemo(() => {
    if (!criticalQuery.data?.records) return criticalSnapshot;
    return criticalQuery.data.records.map((r: any) => {
      const riskLevel = r.vacancy_rate_percentage >= 20 ? "Critical" : r.vacancy_rate_percentage >= 14 ? "High" : r.vacancy_rate_percentage >= 8 ? "Medium" : "Low";
      return {
        dept: r.department,
        current: r.actual_employee_count,
        approved: r.approved_position_count,
        vacancies: r.vacant_approved_position_count,
        risk: riskLevel as RiskLevel
      };
    });
  }, [criticalQuery.data]);

  const realAiInsights = useMemo(() => {
    if (!exceptionsQuery.data?.records) return aiInsights;
    return exceptionsQuery.data.records.map((r: any) => {
      const tint = r.severity === "Critical" ? "bg-pastel-peach" : r.severity === "Warning" ? "bg-pastel-yellow" : "bg-pastel-mint";
      return {
        title: r.exception_type,
        body: r.exception_description,
        tint
      };
    });
  }, [exceptionsQuery.data]);

  const realSuggestedActions = useMemo(() => {
    if (!exceptionsQuery.data?.records) return suggestedActions;
    return exceptionsQuery.data.records.map((r: any) => r.recommended_action);
  }, [exceptionsQuery.data]);

  const realTodayActivity = useMemo(() => {
    if (!activityQuery.data?.metrics) return todayActivity;
    const m = activityQuery.data.metrics;
    const getVal = (name: string) => m.find((x: any) => x.metric_name === name)?.value ?? 0;
    
    return [
      { label: "Total employees", value: getVal("actual_employee_count").toString(), percent: "100%", change: 0 },
      { label: "Available for work", value: getVal("employees_available_for_work").toString(), percent: getVal("workforce_availability_percentage").toFixed(1) + "%", change: 0 },
      { label: "On approved leave", value: getVal("employees_on_approved_leave").toString(), percent: "", change: 0 },
      { label: "Absent", value: getVal("employees_absent").toString(), percent: "", change: 0 },
      { label: "Overtime hours", value: getVal("total_overtime_hours").toString(), percent: "", change: 0 },
      { label: "Open positions", value: getVal("daily_open_position_count").toString(), percent: "", change: 0 },
      { label: "Critical openings", value: getVal("daily_critical_open_position_count").toString(), percent: "", change: 0 },
    ];
  }, [activityQuery.data]);

  const trendMonths = { "Last 30 days": 6, "This quarter": 6, "This year": 12, "Last 24 months": 24 }[applied.dateRange] ?? 24;

  const totalActual = filteredDepartments.reduce((sum, dept) => sum + dept.actual, 0);
  const totalApproved = filteredDepartments.reduce((sum, dept) => sum + dept.approved, 0);
  const totalVacancies = filteredDepartments.reduce((sum, dept) => sum + dept.vacancies, 0);
  const isFiltered = JSON.stringify(applied) !== JSON.stringify(emptyFilters);

  const realKpis = useMemo(() => {
    if (!kpisQuery.data?.metrics) return kpis;
    const m = kpisQuery.data.metrics;
    const getVal = (name: string) => m.find(x => x.metric_name === name)?.value ?? 0;
    
    return kpis.map(k => {
      let val = k.value;
      if (k.key === "actual") val = getVal("actual_employee_count").toString();
      if (k.key === "approved") val = getVal("approved_position_count").toString();
      if (k.key === "budgeted") val = getVal("budgeted_position_count").toString();
      if (k.key === "vacant") val = getVal("vacant_approved_position_count").toString();
      if (k.key === "vacancyRate") val = getVal("vacancy_rate_percentage").toFixed(1) + "%";
      if (k.key === "budgetUse") val = getVal("budget_utilization_percentage").toFixed(1) + "%";
      
      return { ...k, value: val };
    });
  }, [kpisQuery.data]);

  return (
    <CenterPanel
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Headcount Management Dashboard"
      description="Executive overview of workforce planning, staffing, organizational distribution and budget allocation."
      size="lg"
    >
      <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-pastel-teal/70 px-3 py-1 text-[11px] font-medium">
        <Sparkle className="h-3 w-3" /> Powered by Data
      </div>

      {/* Global filters */}
      <div className="mb-6 rounded-2xl border bg-muted/30 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Department" value={draft.department} options={realDepartments.map((d) => d.name)} onChange={(v) => setDraft({ ...draft, department: v })} />
          <Select label="Business unit" value={draft.businessUnit} options={businessUnits} onChange={(v) => setDraft({ ...draft, businessUnit: v })} />
          <Select label="Work location" value={draft.location} options={locations} onChange={(v) => setDraft({ ...draft, location: v })} />
          <Select label="Employment type" value={draft.employmentType} options={employmentTypes} onChange={(v) => setDraft({ ...draft, employmentType: v })} />
          <Select label="Job level" value={draft.jobLevel} options={jobLevels} onChange={(v) => setDraft({ ...draft, jobLevel: v })} />
          <Select label="Date range" value={draft.dateRange} options={dateRanges} allowAll={false} onChange={(v) => setDraft({ ...draft, dateRange: v })} />
          <label className="sm:col-span-2 lg:col-span-2">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Search employees</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Name or department"
                className="w-full rounded-xl border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
              />
            </span>
          </label>
          <div className="flex items-end gap-2">
            <button
              onClick={() => { setDraft(emptyFilters); setApplied(emptyFilters); }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear
            </button>
            <button
              onClick={() => setApplied(draft)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
        </div>
        {isFiltered && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing {filteredDepartments.length} department(s) · {totalActual} people · {totalVacancies} vacancies.
          </p>
        )}
      </div>

      {/* Section 1 — KPI cards */}
      <SectionTitle>Key workforce numbers</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {realKpis.map((kpi) => {
          const Icon = kpiIcons[kpi.key] ?? Users2;
          const value = isFiltered && kpi.key === "actual" ? String(totalActual) : isFiltered && kpi.key === "approved" ? String(totalApproved) : isFiltered && kpi.key === "vacant" ? String(totalVacancies) : kpi.value;
          return (
            <div key={kpi.key} title={kpi.tooltip} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full", kpi.tint)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={cn("text-xs font-medium", kpi.delta >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                  {kpi.delta >= 0 ? "▲" : "▼"} {Math.abs(kpi.delta)}%
                </span>
              </div>
              <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{kpi.title}</div>
              <div className="text-2xl font-semibold tracking-tight">{value}</div>
              <Sparkline points={kpi.spark} />
            </div>
          );
        })}
      </div>

      {/* Section 2 */}
      <SectionTitle>Approved vs Budgeted vs Actual Headcount by Department</SectionTitle>
      <DeptComparison rows={filteredDepartments} />

      {/* Section 3 & Movement */}
      <SectionTitle>Headcount Trend</SectionTitle>
      <TrendChart months={trendMonths} trendData={realHeadcountTrend} />

      <SectionTitle>Workforce Dynamics</SectionTitle>
      <MovementTrendChart months={trendMonths} movementData={realMovementTrend} />

      {/* Sections 4 & 5 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutCard
          title="Workforce Composition by Job Level"
          data={levels.map((row: any) => ({ label: row.level, value: row.count, color: row.color }))}
          footer={`Total headcount: ${levels.reduce((sum: number, row: any) => sum + row.count, 0)}`}
        />
        <DonutCard
          title="Vacancy Ageing"
          data={realVacancyAgeing.map((row) => ({ label: row.bucket, value: row.count, color: row.color }))}
          footer={`${realVacancyAgeing.reduce((sum, row) => sum + row.count, 0)} open vacancies`}
        />
      </div>

      {/* Section 6 */}
      <SectionTitle>Department Budget Utilization</SectionTitle>
      <div className="space-y-2 rounded-2xl border bg-card p-4">
        {filteredDepartments.map((dept) => {
          const tone = dept.utilization >= 95 ? "bg-rose-400" : dept.utilization >= 90 ? "bg-orange-400" : dept.utilization >= 80 ? "bg-amber-400" : "bg-emerald-400";
          const status = dept.utilization >= 95 ? "Critical" : dept.utilization >= 90 ? "High usage" : dept.utilization >= 80 ? "Needs attention" : "Healthy";
          return (
            <div key={dept.name} className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[10rem_1fr_4rem_5rem_7rem]">
              <span className="truncate text-sm">{dept.name}</span>
              <div className="col-span-2 h-2 overflow-hidden rounded-full bg-foreground/5 sm:col-span-1">
                <div className={cn("h-full rounded-full", tone)} style={{ width: `${dept.utilization}%` }} />
              </div>
              <span className="hidden text-right text-sm sm:block">{dept.utilization}%</span>
              <span className={cn("hidden text-right text-xs sm:block", dept.utilizationDelta >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                {dept.utilizationDelta >= 0 ? "+" : ""}{dept.utilizationDelta}%
              </span>
              <span className="hidden justify-self-end rounded-full bg-muted px-2 py-0.5 text-[11px] sm:block">{status}</span>
            </div>
          );
        })}
      </div>

      {/* Section 7 */}
      <SectionTitle>Critical Department Snapshot</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Department</th>
              <th className="px-4 py-2.5">Current</th>
              <th className="px-4 py-2.5">Approved</th>
              <th className="px-4 py-2.5">Variance</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Vacancies</th>
              <th className="px-4 py-2.5">Risk</th>
            </tr>
          </thead>
          <tbody>
            {realCriticalSnapshot
              .filter((row: any) => filteredDepartments.some((dept: any) => dept.name === row.dept))
              .map((row: any) => (
                <tr key={row.dept} className={cn("border-t", row.risk === "Critical" && "bg-pastel-peach/25")}>
                  <td className="px-4 py-2.5">{row.dept}</td>
                  <td className="px-4 py-2.5">{row.current}</td>
                  <td className="px-4 py-2.5">{row.approved}</td>
                  <td className="px-4 py-2.5">{row.current - row.approved}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {row.current > row.approved ? (
                      <span className="text-pastel-rose">Overstaffed</span>
                    ) : row.current < row.approved ? (
                      <span className="text-pastel-peach">Understaffed</span>
                    ) : (
                      <span className="text-pastel-mint">Balanced</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{row.vacancies}</td>
                  <td className="px-4 py-2.5"><RiskBadge level={row.risk} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Section 8 */}
      <SectionTitle>AI Insights & Recommendations</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {realAiInsights.map((insight: any) => (
          <div key={insight.title} className={cn("rounded-2xl p-4", insight.tint)}>
            <div className="text-sm font-semibold">{insight.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">{insight.body}</p>
            <Link
              to="/chatbot"
              className="mt-3 inline-block text-xs font-medium underline underline-offset-4"
            >
              View analysis
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border bg-card p-4">
        <div className="text-sm font-semibold">Suggested actions</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {realSuggestedActions.map((action: any) => (
            <span key={action} className="rounded-full bg-muted px-3 py-1 text-xs">{action}</span>
          ))}
        </div>
        {onAskAssistant ? (
          <button
            onClick={onAskAssistant}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MessageSquare className="h-4 w-4" /> Ask AI Assistant
          </button>
        ) : (
          <Link
            to="/chatbot"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MessageSquare className="h-4 w-4" /> Ask AI Assistant
          </Link>
        )}
      </div>

      {/* Section 9 */}
      <SectionTitle>Today's Workforce Activity</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {realTodayActivity.map((item: any) => (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <div className="text-[11px] text-muted-foreground">{item.label}</div>
            <div className="text-xl font-semibold tracking-tight">{item.value}</div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{item.percent}</span>
              <span className={item.change >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}>
                {item.change >= 0 ? "+" : ""}{item.change}% vs yesterday
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Section 10 */}
      <SectionTitle>Top Skills Across Workforce</SectionTitle>
      <SkillsSection />
    </CenterPanel>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">{children}</h3>;
}

function Select({
  label, value, options, onChange, allowAll = true,
}: { label: string; value: string; options: string[]; onChange: (value: string) => void; allowAll?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
      >
        {allowAll && <option value="All">All</option>}
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const path = points
    .map((point, index) => `${(index / (points.length - 1)) * 100},${28 - ((point - min) / span) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-2 h-7 w-full">
      <polyline points={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const tone = {
    Low: "bg-pastel-mint", Medium: "bg-pastel-yellow", High: "bg-pastel-peach", Critical: "bg-pastel-rose",
  }[level];
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>{level}</span>;
}

function DeptComparison({ rows }: { rows: typeof departments }) {
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
                  <td className="py-2">{row.name}</td>
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

function TrendChart({ months, trendData = headcountTrend }: { months: number, trendData?: any[] }) {
  const [range, setRange] = useState<number | null>(null);
  const window = range ?? months;
  const data = trendData.slice(-window);
  const first = data[0]?.people ?? 0;
  const last = data[data.length - 1]?.people ?? 0;
  const growth = first ? ((last - first) / first) * 100 : 0;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Latest: {last} people</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", growth >= 0 ? "bg-pastel-mint" : "bg-pastel-peach")}>
            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}% growth
          </span>
        </div>
        <div className="flex gap-1">
          {[["6M", 6], ["12M", 12], ["24M", 24], ["All", headcountTrend.length]].map(([label, value]) => (
            <ToggleButton key={label as string} active={window === value} onClick={() => setRange(value as number)} label={label as string} />
          ))}
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
            <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={["dataMin - 8", "dataMax + 6"]} />
            <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
            <Area type="monotone" dataKey="people" stroke="var(--primary)" strokeWidth={2.5} fill="url(#hcFill)" animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MovementTrendChart({ months, movementData = movementTrend }: { months: number, movementData?: any[] }) {
  const [range, setRange] = useState<number | null>(null);
  const window = range ?? months;
  const data = movementData.slice(-window);
  
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Joiners vs Leavers vs Promotions vs Transfers</span>
        </div>
        <div className="flex gap-1">
          {[["6M", 6], ["12M", 12], ["24M", 24], ["All", movementTrend.length]].map(([label, value]) => (
            <ToggleButton key={label as string} active={window === value} onClick={() => setRange(value as number)} label={label as string} />
          ))}
        </div>
      </div>
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

function SkillsSection() {
  const [sort, setSort] = useState<"common" | "growing" | "demand">("common");
  const sorted = [...skills].sort((a, b) =>
    sort === "common" ? b.employees - a.employees : sort === "growing" ? b.growth - a.growth : b.demand - a.demand,
  );
  const max = Math.max(...skills.map((skill) => skill.employees));
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap justify-end gap-1">
        <ToggleButton active={sort === "common"} onClick={() => setSort("common")} label="Most common" />
        <ToggleButton active={sort === "growing"} onClick={() => setSort("growing")} label="Fastest growing" />
        <ToggleButton active={sort === "demand"} onClick={() => setSort("demand")} label="Highest demand" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sorted.map((skill) => (
          <div key={skill.name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-sm">{skill.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/5">
              <div className="h-full rounded-full bg-primary/60" style={{ width: `${(skill.employees / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right text-xs text-muted-foreground">{skill.employees}</span>
            <span className="w-12 text-right text-[11px] text-emerald-600 dark:text-emerald-500">+{skill.growth}%</span>
          </div>
        ))}
      </div>
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
