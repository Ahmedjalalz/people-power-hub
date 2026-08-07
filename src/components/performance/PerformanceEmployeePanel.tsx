import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { Target, TrendingUp, TrendingDown, Sparkles, GraduationCap, BookOpen, Flag } from "lucide-react";
import { CenterPanel } from "@/components/CenterPanel";
import { AsyncState, SectionCard, StatTile, bandTint, trendTint, num } from "@/components/performance/PerformanceUI";
import {
  getPerformanceEmployee,
  getPerformanceEmployeeTrend,
  getPerformanceEmployeeKpis,
  getPerformanceEmployeeRecommendations,
  getPerformanceEmployeeLearningHistory,
  pickArray,
  pickObject,
  type EmployeeKpi,
  type LearningRecord,
  type Recommendation,
  type TrendPoint,
} from "@/services/performance";
import { cn } from "@/lib/utils";

const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 };

export function PerformanceEmployeePanel({
  employeeId,
  onClose,
  onBack,
}: {
  employeeId: string | null;
  onClose: () => void;
  onBack: () => void;
}) {
  const [months, setMonths] = useState(12);
  const enabled = !!employeeId;
  const id = employeeId ?? "";

  const summaryQuery = useQuery({ queryKey: ["perf", "emp", id], queryFn: () => getPerformanceEmployee(id), enabled });
  const trendQuery = useQuery({ queryKey: ["perf", "emp", id, "trend", months], queryFn: () => getPerformanceEmployeeTrend(id, months), enabled });
  const kpiQuery = useQuery({ queryKey: ["perf", "emp", id, "kpis"], queryFn: () => getPerformanceEmployeeKpis(id), enabled });
  const recQuery = useQuery({ queryKey: ["perf", "emp", id, "recs"], queryFn: () => getPerformanceEmployeeRecommendations(id), enabled });
  const learnQuery = useQuery({ queryKey: ["perf", "emp", id, "learning"], queryFn: () => getPerformanceEmployeeLearningHistory(id), enabled });

  const summary = useMemo(
    () => (pickObject<Record<string, any>>(summaryQuery.data, "employee", "employee_performance", "data") ?? {}) as Record<string, any>,
    [summaryQuery.data],
  );
  const trend = useMemo(
    () => pickArray<TrendPoint>(trendQuery.data, "trend", "records", "points").map((p) => ({
      month: String(p.Performance_Month ?? p["month"] ?? ""),
      score: Number(p.average_performance_score ?? p["performance_score"] ?? 0),
    })),
    [trendQuery.data],
  );
  const kpis = useMemo(() => pickArray<EmployeeKpi>(kpiQuery.data, "kpis", "records"), [kpiQuery.data]);
  const recommendations = useMemo(() => pickArray<Recommendation>(recQuery.data, "recommendations", "records"), [recQuery.data]);
  const learning = useMemo(() => pickArray<LearningRecord>(learnQuery.data, "learning_history", "records", "courses"), [learnQuery.data]);

  const direction = String(
    summary["performance_trend"] ?? pickObject<Record<string, any>>(trendQuery.data)?.["trend_direction"] ?? "",
  );
  const change = summary["three_month_change"] ?? summary["three_month_change_value"];

  const strengths = kpis.filter((k) => Number(k.normalized_score ?? 0) >= 70);
  const developmentAreas = kpis.filter((k) => Number(k.normalized_score ?? 0) < 70);

  return (
    <CenterPanel
      open={enabled}
      onOpenChange={(next) => !next && onClose()}
      onBack={onBack}
      size="lg"
      title={String(summary["employee_name"] ?? "Employee performance")}
      description="Performance summary, trend, KPI results, recommendations and learning history."
    >
      <div className="space-y-4">
        <AsyncState isPending={summaryQuery.isPending} error={summaryQuery.error} height="h-28">
          <div className="rounded-2xl border bg-pastel-teal/60 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-card text-lg font-semibold ring-2 ring-primary/30">
                {String(summary["employee_name"] ?? "?").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-tight">{String(summary["employee_name"] ?? "—")}</div>
                <div className="text-xs text-foreground/70">
                  {String(summary["position_title"] ?? summary["role"] ?? "—")} · {String(summary["department"] ?? "—")}
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-card px-3 py-1 text-sm font-semibold">
                  Score {num(summary["latest_performance_score"] ?? summary["performance_score"])}
                </span>
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", bandTint(summary["performance_band"]))}>
                  {String(summary["performance_band"] ?? "—")}
                </span>
                <span className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", trendTint(direction))}>
                  {direction.toLowerCase().includes("declin") ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  {direction || "—"}
                </span>
                <span className="rounded-full bg-card px-3 py-1 text-xs">
                  3-month change {typeof change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "—"}
                </span>
              </div>
            </div>
          </div>
        </AsyncState>

        <SectionCard
          title="Performance trend"
          subtitle="Monthly performance score from the backend."
          tint="bg-pastel-sky"
          right={
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {[6, 12, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    months === m ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          }
        >
          <AsyncState isPending={trendQuery.isPending} error={trendQuery.error} isEmpty={trend.length === 0} emptyLabel="No trend data available.">
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AsyncState>
        </SectionCard>

        <SectionCard title="KPI actual vs target" subtitle="Strengths and development areas as reported by the backend." tint="bg-pastel-mint">
          <AsyncState isPending={kpiQuery.isPending} error={kpiQuery.error} isEmpty={kpis.length === 0} emptyLabel="No KPI records for this employee.">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Strengths", rows: strengths, tint: "bg-pastel-mint" },
                { label: "Development areas", rows: developmentAreas, tint: "bg-pastel-peach" },
              ].map((group) => (
                <div key={group.label} className="rounded-xl border p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                    <span className={cn("h-2 w-2 rounded-full", group.tint)} />
                    {group.label} ({group.rows.length})
                  </div>
                  {group.rows.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">None reported.</p>
                  ) : (
                    <div className="space-y-3">
                      {group.rows.map((k, index) => {
                        const actual = Number(k.actual_value ?? 0);
                        const target = Number(k.target_value ?? 0);
                        const max = Math.max(actual, target, 1);
                        return (
                          <div key={`${k.kpi_name}-${index}`}>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="truncate font-medium">{String(k.kpi_name ?? "KPI")}</span>
                              <span className="text-muted-foreground">
                                {num(k.actual_value)} / {num(k.target_value)} · w {num(k.weight)}
                              </span>
                            </div>
                            <div className="relative mt-1 h-2.5 overflow-hidden rounded-full bg-foreground/5">
                              <div className="h-full rounded-full bg-primary/70" style={{ width: `${(actual / max) * 100}%` }} />
                              <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${(target / max) * 100}%` }} />
                            </div>
                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                              Normalized score {num(k.normalized_score)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AsyncState>
        </SectionCard>

        <SectionCard title="Development recommendations" subtitle="Ranked learning actions returned by the backend." tint="bg-pastel-lavender">
          <AsyncState
            isPending={recQuery.isPending}
            error={recQuery.error}
            isEmpty={recommendations.length === 0}
            emptyLabel="No recommendations right now — performance is on track."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendations.map((r, index) => (
                <div key={`${r.course_name}-${index}`} className="rounded-xl border bg-pastel-lavender/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <GraduationCap className="h-4 w-4" />
                      <span className="truncate">{String(r.course_name ?? "Course")}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-medium">
                      <Flag className="mr-1 inline h-3 w-3" />
                      {String(r.priority ?? "—")}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-foreground/70">Level: {String(r.course_level ?? "—")}</div>
                  {r.recommendation_reason && <p className="mt-2 text-xs">{String(r.recommendation_reason)}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                    {(r.linked_skill || r.linked_kpi) && (
                      <span className="rounded-full bg-card px-2 py-0.5">
                        Gap: {String(r.linked_skill ?? r.linked_kpi)}
                      </span>
                    )}
                    {r.review_window && <span className="rounded-full bg-card px-2 py-0.5">Review: {String(r.review_window)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </AsyncState>
        </SectionCard>

        <SectionCard title="Learning history" subtitle="Courses completed or in progress." tint="bg-pastel-yellow">
          <AsyncState
            isPending={learnQuery.isPending}
            error={learnQuery.error}
            isEmpty={learning.length === 0}
            emptyLabel="No learning records available."
          >
            <ol className="space-y-2.5">
              {learning.map((row, index) => (
                <li key={`${row.course_name}-${index}`} className="flex items-start gap-3 rounded-xl border p-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pastel-yellow">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{String(row.course_name ?? "Course")}</span>
                      {String(row.Is_Actual_LMS_Record ?? "").toLowerCase() === "no" && (
                        <span className="rounded-full bg-pastel-peach px-2 py-0.5 text-[10px] font-medium">Demo-derived</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {String(row.status ?? "—")} · {String(row.completion_date ?? row["Completion_Date"] ?? "No date")}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </AsyncState>
        </SectionCard>
      </div>
    </CenterPanel>
  );
}

export function DistributionDonut({ rows }: { rows: { band: string; count: number; percentage: number }[] }) {
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={rows} dataKey="count" nameKey="band" innerRadius={54} outerRadius={82} paddingAngle={2}>
            {rows.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentRankingChart({ rows }: { rows: { department: string; score: number }[] }) {
  return (
    <div style={{ height: Math.max(180, rows.length * 30) }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 16 }}>
          <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis type="category" dataKey="department" width={120} stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="score" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const performanceIcons = { Target, Sparkles };
