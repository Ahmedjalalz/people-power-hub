import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  GraduationCap,
  BookOpen,
  Flag,
  CheckCircle2,
  AlertCircle,
  Award,
  Calendar,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { CenterPanel } from "@/components/CenterPanel";
import { AsyncState, SectionCard, bandTint, trendTint, num } from "@/components/performance/PerformanceUI";
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

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function priorityBadge(priority?: string) {
  const p = (priority ?? "").toLowerCase();
  if (p.includes("high") || p.includes("urgent")) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900";
  }
  if (p.includes("med")) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900";
  }
  return "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900";
}

function formatMonth(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

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

  const summaryQuery = useQuery({
    queryKey: ["perf", "emp", id],
    queryFn: () => getPerformanceEmployee(id),
    enabled,
  });

  const trendQuery = useQuery({
    queryKey: ["perf", "emp", id, "trend", months],
    queryFn: () => getPerformanceEmployeeTrend(id, months),
    enabled,
  });

  const kpiQuery = useQuery({
    queryKey: ["perf", "emp", id, "kpis"],
    queryFn: () => getPerformanceEmployeeKpis(id),
    enabled,
  });

  const recQuery = useQuery({
    queryKey: ["perf", "emp", id, "recs"],
    queryFn: () => getPerformanceEmployeeRecommendations(id),
    enabled,
  });

  const learnQuery = useQuery({
    queryKey: ["perf", "emp", id, "learning"],
    queryFn: () => getPerformanceEmployeeLearningHistory(id),
    enabled,
  });

  const rootData = summaryQuery.data as Record<string, any> | undefined;

  // ─── Employee summary resolution (supports both PascalCase and snake_case) ───
  const summary = useMemo(() => {
    return (
      rootData?.employee ??
      rootData?.employee_profile ??
      pickObject<Record<string, any>>(rootData, "employee", "employee_performance", "data") ??
      {}
    );
  }, [rootData]);

  const metricsList = useMemo(() => (Array.isArray(rootData?.metrics) ? rootData.metrics : []), [rootData]);
  const metricVal = (name: string) => metricsList.find((m: any) => m.metric_name === name)?.value;

  const empName = String(summary.Employee_Name ?? summary.employee_name ?? metricVal("employee_name") ?? "Employee");
  const empId = String(summary.Employee_ID ?? summary.employee_id ?? id);
  const dept = String(summary.Department ?? summary.department ?? "—");
  const bu = String(summary.Business_Unit ?? summary.business_unit ?? "");
  const title = String(summary.Position_Title ?? summary.Designation ?? summary.position_title ?? summary.role ?? "—");
  const jobLevel = String(summary.Job_Level ?? summary.job_level ?? "");
  const roleBand = String(summary.Role_Band ?? summary.role_band ?? "");

  const scoreNum = summary.Latest_Performance_Score ?? summary.latest_performance_score ?? summary.performance_score ?? metricVal("latest_performance_score");
  const band = String(summary.Latest_Performance_Band ?? summary.latest_performance_band ?? summary.performance_band ?? metricVal("latest_performance_band") ?? "—");
  const avg12m = summary.Average_12M_Performance_Score ?? summary.average_12m_performance_score ?? metricVal("average_12m_performance_score");

  const changeVal = summary.Three_Month_Change_Points ?? summary.three_month_change_points ?? summary.three_month_change ?? metricVal("three_month_change_points");
  const changeNum = typeof changeVal === "number" ? changeVal : parseFloat(String(changeVal ?? ""));

  const direction = String(summary.Performance_Trend ?? summary.performance_trend ?? metricVal("performance_trend") ?? "");
  const reviewStatus = String(summary.Review_Status ?? summary.review_status ?? "");
  const asOfDate = String(summary.Data_As_Of_Date ?? summary.data_as_of_date ?? rootData?.data_as_of_date ?? "");
  const notes = Array.isArray(rootData?.calculation_notes) ? rootData.calculation_notes : [];

  // ─── Trend points resolution ───────────────────────────────────────────────
  const trend = useMemo(() => {
    const rawList =
      Array.isArray(trendQuery.data) && trendQuery.data.length > 0
        ? trendQuery.data
        : pickArray<Record<string, any>>(trendQuery.data, "trend", "records", "points").length > 0
          ? pickArray<Record<string, any>>(trendQuery.data, "trend", "records", "points")
          : (rootData?.records?.find((r: any) => r.section === "monthly_trend")?.data ?? []);

    return rawList.map((p: any) => {
      const monthRaw = String(p.Performance_Month ?? p.month ?? p.Month ?? "");
      return {
        month: monthRaw,
        displayMonth: formatMonth(monthRaw),
        score: Number(p.Final_Performance_Score ?? p.Average_Performance_Score ?? p.average_performance_score ?? p.performance_score ?? 0),
        band: String(p.Performance_Band ?? p.performance_band ?? ""),
        evidenceQuality: p.Average_Evidence_Quality != null ? Number(p.Average_Evidence_Quality) : undefined,
        breachFlag: p.Critical_KPI_Breach_Flag === "Yes" || p.critical_kpi_breach === true,
      };
    });
  }, [trendQuery.data, rootData]);

  // Trend stats
  const trendScores = trend.map((t) => t.score).filter((s) => s > 0);
  const peakScore = trendScores.length > 0 ? Math.max(...trendScores) : null;
  const lowestScore = trendScores.length > 0 ? Math.min(...trendScores) : null;

  // ─── KPIs resolution ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const rawList =
      Array.isArray(kpiQuery.data) && kpiQuery.data.length > 0
        ? kpiQuery.data
        : pickArray<Record<string, any>>(kpiQuery.data, "kpis", "records").length > 0
          ? pickArray<Record<string, any>>(kpiQuery.data, "kpis", "records")
          : (rootData?.records?.find((r: any) => r.section === "kpi_breakdown")?.data ?? []);

    return rawList.map((k: any) => {
      const actual = Number(k.Operational_Actual_Value ?? k.Actual_KPI_Value ?? k.actual_value ?? 0);
      const target = Number(k.Operational_Target_Value ?? k.Target_Value ?? k.target_value ?? 0);
      const normalized = Number(k.Normalized_KPI_Score ?? k.normalized_score ?? k.normalized_kpi_score ?? 0);
      const weight = Number(k.KPI_Weight_pct ?? k.weight ?? 0);
      const weightedScore = Number(k.Weighted_Score ?? k.weighted_score ?? ((normalized * weight) / 100));

      return {
        id: String(k.KPI_ID ?? k.kpi_id ?? ""),
        name: String(k.KPI_Name ?? k.kpi_name ?? "KPI"),
        group: String(k.KPI_Group ?? k.kpi_group ?? "GENERAL"),
        actual,
        target,
        unit: String(k.Operational_Unit ?? k.Measurement_Unit ?? k.unit ?? ""),
        floor: k.Floor_Value != null ? Number(k.Floor_Value) : undefined,
        stretch: k.Stretch_Value != null ? Number(k.Stretch_Value) : undefined,
        normalizedScore: normalized,
        weight,
        weightedScore,
        direction: String(k.Scoring_Direction ?? k.scoring_direction ?? "HIGHER_BETTER"),
        evidenceSource: String(k.Evidence_Source_Mode ?? k.evidence_source_mode ?? ""),
        evidenceQuality: k.Evidence_Quality_Score != null ? Number(k.Evidence_Quality_Score) : undefined,
        productionSource: String(k.Production_Replacement_Source ?? ""),
      };
    });
  }, [kpiQuery.data, rootData]);

  const strengths = kpis.filter((k) => k.normalizedScore >= 70);
  const developmentAreas = kpis.filter((k) => k.normalizedScore < 70);

  // ─── Recommendations resolution ─────────────────────────────────────────────
  const recommendations = useMemo(() => {
    const rawList =
      Array.isArray(recQuery.data) && recQuery.data.length > 0
        ? recQuery.data
        : pickArray<Record<string, any>>(recQuery.data, "recommendations", "records").length > 0
          ? pickArray<Record<string, any>>(recQuery.data, "recommendations", "records")
          : (rootData?.recommendations ?? []);

    return rawList.map((r: any) => ({
      id: String(r.Recommendation_ID ?? r.recommendation_id ?? ""),
      courseId: String(r.Course_ID ?? r.course_id ?? ""),
      courseName: String(r.Course_Name ?? r.course_name ?? "Course"),
      courseLevel: String(r.Course_Level ?? r.course_level ?? "Foundation"),
      priority: String(r.Priority ?? r.priority ?? "Medium"),
      priorityScore: r.Priority_Score != null ? Number(r.Priority_Score) : undefined,
      rank: r.Recommendation_Rank != null ? Number(r.Recommendation_Rank) : undefined,
      basis: String(r.Recommendation_Basis ?? r.recommendation_reason ?? r.reason ?? ""),
      howSupports: String(r.How_Course_Supports_Performance ?? r.how_course_supports_performance ?? ""),
      growthInsight: String(r.Professional_Growth_Insight ?? r.growth_insight ?? ""),
      skillName: String(r.Skill_Name ?? r.linked_skill ?? ""),
      kpiName: String(r.Development_KPI_Name ?? r.linked_kpi ?? ""),
      reviewWindowDays: r.Recommended_Review_Window_Days ?? r.review_window,
      reviewMetric: String(r.Post_Course_Review_Metric ?? ""),
      isMandatory: r.Mandatory_Role_Skill === "Yes",
      trigger: String(r.Recommendation_Trigger ?? ""),
      curLevel: r.Current_Proficiency_Level,
      reqLevel: r.Required_Proficiency_Level,
      curScore: r.Current_Skill_Score,
      reqScore: r.Required_Minimum_Skill_Score,
      weightPct: r.Position_Skill_Weight_pct,
    }));
  }, [recQuery.data, rootData]);

  // ─── Learning history resolution ───────────────────────────────────────────
  const learning = useMemo(() => {
    const rawList =
      Array.isArray(learnQuery.data) && learnQuery.data.length > 0
        ? learnQuery.data
        : pickArray<Record<string, any>>(learnQuery.data, "learning_history", "records", "courses").length > 0
          ? pickArray<Record<string, any>>(learnQuery.data, "learning_history", "records", "courses")
          : (rootData?.learning_history ?? []);

    return rawList.map((row: any) => ({
      id: String(row.Learning_Record_ID ?? row.learning_record_id ?? ""),
      courseId: String(row.Course_ID ?? row.course_id ?? ""),
      courseName: String(row.Course_Name ?? row.course_name ?? "Course"),
      courseLevel: String(row.Course_Level ?? row.course_level ?? ""),
      skillName: String(row.Skill_Name ?? row.skill_name ?? ""),
      status: String(row.Learning_Status ?? row.status ?? "Completed"),
      certificationStatus: String(row.Certification_Status ?? row.certification_status ?? ""),
      completionDate: String(row.Completion_Date ?? row.completion_date ?? "No date"),
      isLMS: String(row.Is_Actual_LMS_Record ?? "").toLowerCase() === "yes",
      proficiencyLevel: row.Current_Proficiency_Level,
      skillScore: row.Current_Skill_Score,
      historyBasis: String(row.History_Basis ?? ""),
      requiredForRole: row.Position_Required_Skill === "Yes",
    }));
  }, [learnQuery.data, rootData]);

  return (
    <CenterPanel
      open={enabled}
      onOpenChange={(next) => !next && onClose()}
      onBack={onBack}
      size="lg"
      title={empName}
      description={`${title} · ${dept}${bu ? ` · ${bu}` : ""} — Complete Performance Dossier`}
    >
      <div className="space-y-5">
        {/* ─── Hero Overview Card ─── */}
        <AsyncState isPending={summaryQuery.isPending && !rootData} error={summaryQuery.error} height="h-32">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-pastel-teal/30 via-pastel-sky/15 to-card p-5 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Profile */}
              <div className="flex items-center gap-3.5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
                  {empName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{empName}</h2>
                    <span className="rounded-md border border-border bg-background/80 px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                      {empId}
                    </span>
                    {roleBand && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {roleBand}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{title}</span> · {dept}
                    {jobLevel ? ` · Level: ${jobLevel}` : ""}
                  </p>
                  {empId && (
                    <Link
                      to="/employee/$employeeId"
                      params={{ employeeId: empId }}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-2"
                    >
                      <span>View full employee dossier</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Key Indicators */}
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="flex items-baseline gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Score</span>
                  <span className="text-xl font-bold tabular-nums text-foreground">{num(scoreNum)}</span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>

                <span className={cn("rounded-xl border px-3 py-2 text-xs font-semibold shadow-xs", bandTint(band))}>
                  {band}
                </span>

                <span className={cn("flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold shadow-xs", trendTint(direction))}>
                  {direction.toLowerCase().includes("declin") ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                  {direction || "Stable"}
                </span>

                {avg12m != null && (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 text-center text-xs shadow-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">12M Avg</span>
                    <span className="font-semibold tabular-nums">{num(avg12m)}</span>
                  </div>
                )}

                {Number.isFinite(changeNum) && (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 text-center text-xs shadow-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">3M Change</span>
                    <span className={cn("font-bold tabular-nums", changeNum < 0 ? "text-rose-600 dark:text-rose-400" : changeNum > 0 ? "text-emerald-600 dark:text-emerald-400" : "")}>
                      {changeNum > 0 ? `+${changeNum.toFixed(1)}` : changeNum.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Status bar */}
            {(reviewStatus || asOfDate) && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                {reviewStatus && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Review Status: <strong className="font-medium text-foreground">{reviewStatus}</strong></span>
                  </div>
                )}
                {asOfDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Evaluation Period: <strong className="font-medium text-foreground">{formatMonth(asOfDate) || asOfDate}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </AsyncState>

        {/* ─── Performance Trend Section ─── */}
        <SectionCard
          title="Performance Trend & Evaluation History"
          subtitle="Historical performance trajectories and monthly evaluations."
          tint="bg-pastel-sky"
          right={
            <div className="flex gap-1 rounded-xl bg-muted/60 p-1 border border-border">
              {[6, 12, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                    months === m
                      ? "bg-card font-semibold text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          }
        >
          <AsyncState
            isPending={trendQuery.isPending && trend.length === 0}
            error={trendQuery.error}
            isEmpty={trend.length === 0}
            emptyLabel="No trend data available for this period."
          >
            <div className="h-60 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="displayMonth" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle} className="p-3 text-xs">
                          <div className="font-semibold text-foreground">{d.displayMonth || d.month}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-muted-foreground">Score:</span>
                            <span className="font-bold text-foreground">{num(d.score)}</span>
                            {d.band && (
                              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", bandTint(d.band))}>
                                {d.band}
                              </span>
                            )}
                          </div>
                          {d.evidenceQuality != null && (
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              Evidence quality: {Math.round(d.evidenceQuality * 100)}%
                            </div>
                          )}
                          {d.breachFlag && (
                            <div className="mt-1 font-semibold text-rose-600 dark:text-rose-400">
                              ⚠️ Critical KPI breach flagged
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Quick trend stat footer */}
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Peak Score</div>
                <div className="text-sm font-semibold tabular-nums text-foreground">{peakScore != null ? num(peakScore) : "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Lowest Score</div>
                <div className="text-sm font-semibold tabular-nums text-foreground">{lowestScore != null ? num(lowestScore) : "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Current Band</div>
                <div className="text-sm font-semibold text-foreground">{band}</div>
              </div>
            </div>
          </AsyncState>
        </SectionCard>

        {/* ─── KPI Breakdown Section (Actual vs Target) ─── */}
        <SectionCard
          title="KPI Performance Breakdown"
          subtitle="Operational actuals vs target values and normalized scores."
          tint="bg-pastel-mint"
        >
          <AsyncState
            isPending={kpiQuery.isPending && kpis.length === 0}
            error={kpiQuery.error}
            isEmpty={kpis.length === 0}
            emptyLabel="No KPI breakdown records available."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {/* Strengths Column */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Key Strengths ({strengths.length})</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    ≥ 70 Score
                  </span>
                </div>

                {strengths.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No KPIs currently rated in the strengths bracket.</p>
                ) : (
                  <div className="space-y-3.5">
                    {strengths.map((k) => (
                      <KpiCard key={k.id || k.name} kpi={k} isStrength={true} />
                    ))}
                  </div>
                )}
              </div>

              {/* Development Areas Column */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Development Areas ({developmentAreas.length})</span>
                  </div>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    &lt; 70 Score
                  </span>
                </div>

                {developmentAreas.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">All KPIs are currently meeting strength expectations.</p>
                ) : (
                  <div className="space-y-3.5">
                    {developmentAreas.map((k) => (
                      <KpiCard key={k.id || k.name} kpi={k} isStrength={false} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AsyncState>
        </SectionCard>

        {/* ─── Development Recommendations Section ─── */}
        <SectionCard
          title="Ranked Development Recommendations"
          subtitle="Targeted skill interventions and learning curricula based on role gaps."
          tint="bg-pastel-lavender"
        >
          <AsyncState
            isPending={recQuery.isPending && recommendations.length === 0}
            error={recQuery.error}
            isEmpty={recommendations.length === 0}
            emptyLabel="No development recommendations currently required — performance is on track."
          >
            <div className="grid gap-3.5 md:grid-cols-2">
              {recommendations.map((r, index) => (
                <div
                  key={r.id || `${r.courseName}-${index}`}
                  className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-pastel-lavender/10 p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <GraduationCap className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate">{r.courseName}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                            {r.courseLevel}
                          </span>
                          {r.isMandatory && (
                            <span className="rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 px-1.5 py-0.2 text-[10px] font-bold uppercase">
                              Mandatory Role Skill
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", priorityBadge(r.priority))}>
                        <Flag className="mr-1 inline h-2.5 w-2.5" />
                        {r.priority}
                      </span>
                      {r.rank != null && (
                        <span className="text-[10px] font-medium text-muted-foreground">Rank #{r.rank}</span>
                      )}
                    </div>
                  </div>

                  {/* Skill Gap details */}
                  {(r.skillName || r.kpiName) && (
                    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2 font-medium">
                        <span className="text-muted-foreground">Target Skill:</span>
                        <span className="font-semibold text-foreground">{r.skillName || r.kpiName}</span>
                      </div>
                      {(r.curLevel != null || r.reqLevel != null || r.reqScore != null) && (
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {r.curLevel != null && r.reqLevel != null && (
                            <span>Proficiency: <strong>{r.curLevel}/5</strong> → Req: <strong>{r.reqLevel}/5</strong></span>
                          )}
                          {r.reqScore != null && (
                            <span>Min Target Score: <strong>{r.reqScore}</strong></span>
                          )}
                          {r.weightPct != null && (
                            <span>Role Weight: <strong>{r.weightPct}%</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Why recommended */}
                  {r.basis && (
                    <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                      <strong className="font-semibold text-foreground">Why: </strong>{r.basis}
                    </p>
                  )}

                  {/* How course supports */}
                  {r.howSupports && (
                    <div className="mt-2 text-xs text-foreground/80 bg-pastel-mint/20 rounded-xl p-2.5 border border-pastel-mint/30">
                      <strong className="font-semibold text-foreground">Impact: </strong>{r.howSupports}
                    </div>
                  )}

                  {/* Growth Insight */}
                  {r.growthInsight && (
                    <p className="mt-2 text-[11px] text-muted-foreground italic">
                      💡 {r.growthInsight}
                    </p>
                  )}

                  {/* Footer review window */}
                  {(r.reviewWindowDays || r.reviewMetric) && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                      {r.reviewWindowDays && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          Review Window: {r.reviewWindowDays} days
                        </span>
                      )}
                      {r.reviewMetric && (
                        <span className="truncate max-w-[200px]" title={r.reviewMetric}>
                          Metric: {r.reviewMetric}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AsyncState>
        </SectionCard>

        {/* ─── Learning History Section ─── */}
        <SectionCard
          title="Completed & Active Learning History"
          subtitle="Training courses, LMS completions, and professional certifications."
          tint="bg-pastel-yellow"
        >
          <AsyncState
            isPending={learnQuery.isPending && learning.length === 0}
            error={learnQuery.error}
            isEmpty={learning.length === 0}
            emptyLabel="No learning records available for this employee."
          >
            <div className="space-y-2.5">
              {learning.map((row, index) => (
                <div
                  key={row.id || `${row.courseName}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-xs transition-all hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pastel-yellow text-foreground">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{row.courseName}</span>
                        {row.courseLevel && (
                          <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                            {row.courseLevel}
                          </span>
                        )}
                        {row.isLMS ? (
                          <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.2 text-[10px] font-bold">
                            LMS Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-pastel-peach px-2 py-0.2 text-[10px] font-medium">
                            Demo-derived
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {row.skillName && (
                          <span>Skill: <strong className="text-foreground">{row.skillName}</strong></span>
                        )}
                        {row.proficiencyLevel != null && (
                          <span>Level: <strong className="text-foreground">{row.proficiencyLevel}/5</strong></span>
                        )}
                        {row.completionDate && row.completionDate !== "No date" && (
                          <span>Completed: <strong className="text-foreground">{row.completionDate}</strong></span>
                        )}
                      </div>
                      {row.historyBasis && (
                        <p className="mt-1 text-[11px] text-muted-foreground/80">{row.historyBasis}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {row.certificationStatus && (
                      <span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        {row.certificationStatus}
                      </span>
                    )}
                    <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 text-xs font-semibold">
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AsyncState>
        </SectionCard>

        {/* ─── Calculation Notes & Audit Notice ─── */}
        {notes.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>Performance Calculation Principles</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {notes.map((note: string, i: number) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CenterPanel>
  );
}

// ─── KPI Card Component ───────────────────────────────────────────────────────

function KpiCard({ kpi, isStrength }: { kpi: any; isStrength: boolean }) {
  const actual = Number(kpi.actual ?? 0);
  const target = Number(kpi.target ?? 0);
  const max = Math.max(actual, target, 1);
  const pct = Math.min(100, Math.max(0, (actual / max) * 100));
  const targetPct = Math.min(100, Math.max(0, (target / max) * 100));

  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-3 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-xs text-foreground truncate">{kpi.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="rounded-md border border-border px-1.5 py-0.2 text-[9px] font-mono font-medium text-muted-foreground">
              {kpi.group}
            </span>
            {kpi.weight > 0 && (
              <span className="text-[10px] text-muted-foreground">
                Weight: {kpi.weight}% · Weighted: {num(kpi.weightedScore)} pts
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span
            className={cn(
              "rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums",
              isStrength
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            )}
          >
            {num(kpi.normalizedScore, 0)}/100
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {kpi.direction === "HIGHER_BETTER" ? "Higher is better" : "Lower is better"}
          </span>
        </div>
      </div>

      {/* Operational Actual vs Target values */}
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span>
          Actual: <strong className="text-foreground">{num(actual)}</strong> {kpi.unit}
        </span>
        <span>
          Target: <strong className="text-muted-foreground">{num(target)}</strong> {kpi.unit}
        </span>
      </div>

      {/* Visual progress bar with Target tick */}
      <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isStrength ? "bg-emerald-500" : "bg-amber-500"
          )}
          style={{ width: `${pct}%` }}
        />
        {/* Target tick marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground"
          style={{ left: `${targetPct}%` }}
          title={`Target: ${num(target)}`}
        />
      </div>

      {/* Floor & Stretch tags if available */}
      {(kpi.floor != null || kpi.stretch != null) && (
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
          <span>{kpi.floor != null ? `Floor: ${num(kpi.floor)}` : ""}</span>
          <span>{kpi.stretch != null ? `Stretch: ${num(kpi.stretch)}` : ""}</span>
        </div>
      )}
    </div>
  );
}

// ─── Recharts Components for Department & Distribution ───────────────────────

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
