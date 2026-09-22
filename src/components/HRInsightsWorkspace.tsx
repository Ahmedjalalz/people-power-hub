import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleGauge,
  FlaskConical,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AttritionPanel } from "@/components/AttritionPanel";
import { HeadcountPanel } from "@/components/HeadcountPanel";
import { PerformancePanel } from "@/components/performance/PerformancePanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getAttritionRate,
  getAttritionSummary,
  getDepartmentRisk,
  getPeopleAtRisk,
  getTopRiskDrivers,
} from "@/services/attrition";
import { getHeadcountByDepartment, getHeadcountKPIs, getHeadcountTrend } from "@/services/headcount";
import {
  getPerformanceAttention,
  getPerformanceDepartments,
  getPerformanceOverview,
  getPerformanceTrend,
  pickArray,
  pickObject,
  type AttentionRow,
  type DepartmentRow,
  type TrendPoint,
} from "@/services/performance";

type Topic = "attrition" | "headcount" | "performance";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
};

function Metric({ label, value, note, tone = "primary" }: { label: string; value: string; note: string; tone?: "primary" | "success" | "warning" | "danger" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="border-l-2 border-border px-4 py-1 first:border-l-0 first:pl-0 sm:px-6">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-2xl font-bold tabular-nums text-foreground">
        <span className={cn("size-2 rounded-full", tones[tone])} />{value}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Users2; title: string; description: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="size-4" /></span>
      <div><h2 className="text-base font-bold text-foreground">{title}</h2><p className="mt-0.5 text-sm text-muted-foreground">{description}</p></div>
    </div>
  );
}

function LoadingBlock() {
  return <div className="grid h-52 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">Loading current workforce data…</div>;
}

function ErrorBlock({ label }: { label: string }) {
  return <div role="alert" className="flex h-36 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"><AlertTriangle className="size-4" />{label}</div>;
}

export function HRInsightsWorkspace({ criticalTriggers }: { criticalTriggers: number }) {
  const [topic, setTopic] = useState<Topic>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tab");
      if (t === "attrition" || t === "headcount" || t === "performance") {
        return t as Topic;
      }
    }
    return "attrition";
  });
  const [fullView, setFullView] = useState<Topic | null>(null);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" />Your workforce, explained clearly</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">HR Insights</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Choose a topic to see what is happening, why it matters, and who may need attention.</p>
        </div>
        <Button asChild size="lg"><Link to="/scenario"><FlaskConical />Plan a workforce change</Link></Button>
      </section>

      {criticalTriggers > 0 && (
        <section className="mt-5 flex flex-col gap-3 border-l-4 border-destructive bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><ShieldAlert className="size-5 shrink-0 text-destructive" /><div><p className="text-sm font-bold">{criticalTriggers} urgent {criticalTriggers === 1 ? "case needs" : "cases need"} review</p><p className="text-xs text-muted-foreground">Open the Action centre when you are ready to decide what happens next.</p></div></div>
          <Button asChild variant="outline" size="sm"><Link to="/triggers">Review cases <ArrowRight /></Link></Button>
        </section>
      )}

      <Tabs value={topic} onValueChange={(value) => setTopic(value as Topic)} className="mt-6">
        <div className="overflow-x-auto border-b border-border">
          <TabsList className="h-auto min-w-max justify-start gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="attrition" className="gap-2 rounded-none border-b-2 border-transparent px-4 py-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><ShieldAlert className="size-4" />Attrition</TabsTrigger>
            <TabsTrigger value="headcount" className="gap-2 rounded-none border-b-2 border-transparent px-4 py-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><Users2 className="size-4" />Headcount</TabsTrigger>
            <TabsTrigger value="performance" className="gap-2 rounded-none border-b-2 border-transparent px-4 py-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><Target className="size-4" />Performance</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="attrition" className="mt-0"><AttritionView onOpenFull={() => setFullView("attrition")} /></TabsContent>
        <TabsContent value="headcount" className="mt-0"><HeadcountView onOpenFull={() => setFullView("headcount")} /></TabsContent>
        <TabsContent value="performance" className="mt-0"><PerformanceView onOpenFull={() => setFullView("performance")} /></TabsContent>
      </Tabs>

      <AttritionPanel open={fullView === "attrition"} onClose={() => setFullView(null)} />
      <HeadcountPanel open={fullView === "headcount"} onClose={() => setFullView(null)} />
      <PerformancePanel open={fullView === "performance"} onClose={() => setFullView(null)} />
    </main>
  );
}

function AttritionView({ onOpenFull }: { onOpenFull: () => void }) {
  const summary = useQuery({ queryKey: ["attrition", "summary"], queryFn: getAttritionSummary });
  const rate = useQuery({ queryKey: ["attrition", "rate"], queryFn: getAttritionRate });
  const people = useQuery({ queryKey: ["attrition", "people-at-risk"], queryFn: () => getPeopleAtRisk(8) });
  const drivers = useQuery({ queryKey: ["attrition", "top-risk-drivers"], queryFn: () => getTopRiskDrivers(5) });
  const departments = useQuery({ queryKey: ["attrition", "department-risk"], queryFn: getDepartmentRisk });
  const topDriver = drivers.data?.drivers.find((driver) => driver.label.toLowerCase() !== "other");
  const highestDepartment = departments.data?.highest_risk_department;

  return (
    <div className="space-y-6 pt-6">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="rounded-lg border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-semibold text-destructive">Retention outlook</p><h2 className="mt-1 text-2xl font-bold">{summary.isPending ? "Checking current risk…" : `${summary.data?.people_at_risk ?? "—"} people may leave`}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">This forecast helps HR start timely conversations. It supports a decision; it does not make one.</p></div>
            <span className="w-fit rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive">Next 90 days</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            <Metric label="People at risk" value={summary.data ? String(summary.data.people_at_risk) : "—"} note="Worth reviewing" tone="danger" />
            <Metric label="Risk rate" value={summary.data ? `${summary.data.attrition_risk_rate_percent.toFixed(1)}%` : "—"} note="Of current workforce" tone="warning" />
            <Metric label="Main reason" value={topDriver?.label ?? "—"} note={topDriver ? `${topDriver.employee_share_percent.toFixed(0)}% of at-risk people` : "Loading reasons"} />
            <Metric label="Most exposed team" value={highestDepartment?.department ?? "—"} note={highestDepartment ? `${highestDepartment.people_at_risk} people flagged` : "Loading teams"} tone="warning" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5 sm:p-6">
          <SectionHeading icon={CircleGauge} title="Risk at a glance" description="How the workforce splits today." />
          {rate.isPending ? <LoadingBlock /> : rate.isError ? <ErrorBlock label="Risk split is unavailable right now." /> : (
            <div className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
              <div className="h-36"><ResponsiveContainer><PieChart><Pie data={rate.data?.chart.segments ?? []} dataKey="employee_count" nameKey="risk_status" innerRadius={42} outerRadius={62} strokeWidth={0}>{rate.data?.chart.segments.map((segment) => <Cell key={segment.risk_status} fill={segment.risk_status === "At Risk" ? "var(--destructive)" : "var(--success)"} />)}</Pie><Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--popover-foreground)" }} labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600 }} /></PieChart></ResponsiveContainer></div>
              <div className="space-y-3">{rate.data?.chart.segments.map((segment) => <div key={segment.risk_status}><p className="text-xs text-muted-foreground">{segment.risk_status}</p><p className="text-lg font-bold tabular-nums">{segment.employee_count} <span className="text-xs font-medium text-muted-foreground">({segment.percentage.toFixed(1)}%)</span></p></div>)}</div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="rounded-lg border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><SectionHeading icon={Users2} title="People who may need attention" description="Highest model scores first. Select a name to see the employee profile." /><Button variant="ghost" size="sm" onClick={onOpenFull}>See all <ArrowRight /></Button></div>
          {people.isPending ? <LoadingBlock /> : people.isError ? <ErrorBlock label="The people-at-risk list is unavailable right now." /> : (
            <div className="divide-y divide-border">{people.data?.employees.slice(0, 6).map((employee) => (
              <div key={employee.employee_id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_7rem] sm:items-center">
                <div className="min-w-0"><Link to="/employee/$employeeId" params={{ employeeId: employee.employee_id }} className="font-bold text-foreground hover:text-primary hover:underline">{employee.employee_name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{employee.position_title} · {employee.department}</p></div>
                <p className="text-xs leading-5 text-muted-foreground">{employee.attrition_factors.slice(0, 2).join(" · ")}</p>
                <div className="sm:text-right"><p className="text-lg font-bold text-destructive tabular-nums">{employee.risk_score_percent}%</p><p className="text-[11px] text-muted-foreground">model score</p></div>
              </div>
            ))}</div>
          )}
        </div>
        <div className="rounded-lg border bg-card p-5 sm:p-6">
          <SectionHeading icon={BriefcaseBusiness} title="Where risk is concentrated" description="Teams with the highest share of people at risk." />
          {departments.isPending ? <LoadingBlock /> : departments.isError ? <ErrorBlock label="Department risk is unavailable right now." /> : (
            <div className="space-y-4">{departments.data?.departments.slice(0, 6).map((department) => (
              <div key={department.department}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-semibold">{department.department}</span><span className="text-muted-foreground">{department.people_at_risk} people · {department.risk_rate_percent.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-destructive" style={{ width: `${Math.min(department.risk_rate_percent, 100)}%` }} /></div></div>
            ))}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function HeadcountView({ onOpenFull }: { onOpenFull: () => void }) {
  const kpis = useQuery({ queryKey: ["headcount", "kpis"], queryFn: () => getHeadcountKPIs() });
  const departments = useQuery({ queryKey: ["headcount", "dept"], queryFn: () => getHeadcountByDepartment() });
  const trend = useQuery({ queryKey: ["headcount", "trend"], queryFn: () => getHeadcountTrend() });
  const metric = (name: string) => kpis.data?.metrics?.find((item) => item.metric_name === name)?.value;
  const trendRows = useMemo(() => trend.data?.records?.map((row) => ({ month: String(row.snapshot_month ?? row.month ?? "").slice(0, 7), people: Number(row.actual_employee_count ?? 0), approved: Number(row.approved_position_count ?? 0) })) ?? [], [trend.data]);
  const departmentRows = departments.data?.records?.slice(0, 8) ?? [];

  return (
    <div className="space-y-6 pt-6">
      <section className="rounded-lg border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-primary">Workforce capacity</p><h2 className="mt-1 text-2xl font-bold">Do we have the people we planned for?</h2><p className="mt-2 text-sm text-muted-foreground">Compare current staffing with approved positions and available budget.</p></div><Button variant="outline" size="sm" onClick={onOpenFull}>Explore filters and details <ArrowRight /></Button></div>
        <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
          <Metric label="Current employees" value={metric("actual_employee_count")?.toString() ?? "—"} note="People employed now" />
          <Metric label="Approved positions" value={metric("approved_position_count")?.toString() ?? "—"} note="Roles the plan allows" />
          <Metric label="Open approved roles" value={metric("vacant_approved_position_count")?.toString() ?? "—"} note="Positions still to fill" tone="warning" />
          <Metric label="Budget used" value={metric("budget_utilization_percentage") !== undefined ? `${Number(metric("budget_utilization_percentage")).toFixed(1)}%` : "—"} note="Of workforce budget" tone="success" />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="rounded-lg border bg-card p-5 sm:p-6"><SectionHeading icon={TrendingUp} title="Headcount over time" description="Actual employees compared with approved positions." />{trend.isPending ? <LoadingBlock /> : trend.isError ? <ErrorBlock label="Headcount history is unavailable right now." /> : <div className="h-72"><ResponsiveContainer><AreaChart data={trendRows}><defs><linearGradient id="peopleArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--popover-foreground)" }} labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600 }} /><Area type="monotone" dataKey="approved" stroke="var(--muted-foreground)" fill="transparent" strokeDasharray="5 5" /><Area type="monotone" dataKey="people" stroke="var(--primary)" strokeWidth={2.5} fill="url(#peopleArea)" /></AreaChart></ResponsiveContainer></div>}</div>
        <div className="rounded-lg border bg-card p-5 sm:p-6"><SectionHeading icon={Building2} title="Staffing by department" description="Current employees versus approved positions." />{departments.isPending ? <LoadingBlock /> : departments.isError ? <ErrorBlock label="Department staffing is unavailable right now." /> : <div className="space-y-4">{departmentRows.map((row) => { const actual = Number(row.actual_employee_count ?? 0); const approved = Math.max(Number(row.approved_position_count ?? 0), 1); return <div key={String(row.department)}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{String(row.department)}</span><span className="text-muted-foreground">{actual} of {approved}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((actual / approved) * 100, 100)}%` }} /></div></div>; })}</div>}</div>
      </section>
    </div>
  );
}

function PerformanceView({ onOpenFull }: { onOpenFull: () => void }) {
  const overviewQuery = useQuery({ queryKey: ["perf", "overview", {}], queryFn: () => getPerformanceOverview() });
  const trendQuery = useQuery({ queryKey: ["perf", "trend", {}], queryFn: () => getPerformanceTrend(12) });
  const departmentsQuery = useQuery({ queryKey: ["perf", "departments", {}], queryFn: () => getPerformanceDepartments() });
  const attentionQuery = useQuery({ queryKey: ["perf", "attention", {}], queryFn: () => getPerformanceAttention() });
  const overview = pickObject<Record<string, unknown>>(overviewQuery.data, "overview", "data") ?? {};
  const value = (...keys: string[]) => keys.map((key) => overview[key]).find((entry) => entry !== undefined);
  const trend = useMemo(() => pickArray<TrendPoint>(trendQuery.data, "trend", "records", "points").map((row) => ({ month: String(row.Performance_Month ?? row.month ?? ""), score: Number(row.Average_Performance_Score ?? row.average_performance_score ?? 0) })), [trendQuery.data]);
  const departments = useMemo(() => pickArray<DepartmentRow>(departmentsQuery.data, "departments", "records").map((row) => ({ department: String(row.Department ?? row.department ?? "—"), score: Number(row.Average_Performance_Score ?? row.average_performance_score ?? 0) })).sort((a, b) => b.score - a.score).slice(0, 8), [departmentsQuery.data]);
  const attention = useMemo(() => pickArray<AttentionRow>(attentionQuery.data, "employees", "records").slice(0, 6), [attentionQuery.data]);
  const format = (entry: unknown, digits = 0) => Number.isFinite(Number(entry)) ? Number(entry).toFixed(digits) : "—";

  return (
    <div className="space-y-6 pt-6">
      <section className="rounded-lg border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-success">Performance picture</p><h2 className="mt-1 text-2xl font-bold">How are people progressing?</h2><p className="mt-2 text-sm text-muted-foreground">See overall progress, team differences, and employees who may benefit from support.</p></div><Button variant="outline" size="sm" onClick={onOpenFull}>Explore performance details <ArrowRight /></Button></div>
        <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
          <Metric label="Average score" value={format(value("average_performance_score", "Average_Performance_Score"), 1)} note="Across reviewed employees" />
          <Metric label="Employees reviewed" value={format(value("total_employees", "employee_count", "Employee_Count"))} note="Included in this view" />
          <Metric label="Strong performers" value={format(value("strong_or_exceptional_count", "Strong_Or_Exceptional_Count", "strong_and_exceptional_count"))} note="Strong or exceptional" tone="success" />
          <Metric label="Declining" value={format(value("declining_count", "Declining_Count"))} note="May need support" tone="danger" />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="rounded-lg border bg-card p-5 sm:p-6"><SectionHeading icon={TrendingUp} title="Performance direction" description="Average score over the last 12 months." />{trendQuery.isPending ? <LoadingBlock /> : trendQuery.isError ? <ErrorBlock label="Performance history is unavailable right now." /> : <div className="h-72"><ResponsiveContainer><AreaChart data={trend}><defs><linearGradient id="performanceArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--success)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--popover-foreground)" }} labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600 }} /><Area type="monotone" dataKey="score" stroke="var(--success)" strokeWidth={2.5} fill="url(#performanceArea)" /></AreaChart></ResponsiveContainer></div>}</div>
        <div className="rounded-lg border bg-card p-5 sm:p-6"><SectionHeading icon={Building2} title="Team comparison" description="Average score by department." />{departmentsQuery.isPending ? <LoadingBlock /> : departmentsQuery.isError ? <ErrorBlock label="Team comparison is unavailable right now." /> : <div className="h-72"><ResponsiveContainer><BarChart data={departments} layout="vertical" margin={{ left: 12 }}><XAxis type="number" hide /><YAxis type="category" dataKey="department" width={92} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--popover-foreground)" }} labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600 }} /><Bar dataKey="score" fill="var(--primary)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}</div>
      </section>
      <section className="rounded-lg border bg-card p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><SectionHeading icon={Target} title="People who may benefit from support" description="Recent performance signals that deserve a human conversation." /><Button variant="ghost" size="sm" onClick={onOpenFull}>See all <ArrowRight /></Button></div>{attentionQuery.isPending ? <LoadingBlock /> : attentionQuery.isError ? <ErrorBlock label="The attention list is unavailable right now." /> : <div className="divide-y divide-border">{attention.map((row, index) => { const id = String(row.Employee_ID ?? row.employee_id ?? ""); const name = String(row.Employee_Name ?? row.employee_name ?? "Employee"); const department = String(row.Department ?? row.department ?? "—"); const score = Number(row.Latest_Performance_Score ?? row.latest_performance_score ?? row.performance_score ?? 0); const change = Number(row.Three_Month_Change_Points ?? row.three_month_change ?? 0); return <div key={id || `${name}-${index}`} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_8rem_7rem] sm:items-center"><div>{id ? <Link to="/employee/$employeeId" params={{ employeeId: id }} className="font-bold hover:text-primary hover:underline">{name}</Link> : <span className="font-bold">{name}</span>}<p className="mt-1 text-xs text-muted-foreground">{department}</p></div><p className="text-sm"><span className="font-bold tabular-nums">{score.toFixed(1)}</span> <span className="text-xs text-muted-foreground">score</span></p><p className={cn("text-sm font-bold tabular-nums", change < 0 ? "text-destructive" : "text-success")}>{change > 0 ? "+" : ""}{change.toFixed(1)} <span className="text-xs font-medium">3 mo.</span></p></div>; })}</div>}</section>
    </div>
  );
}