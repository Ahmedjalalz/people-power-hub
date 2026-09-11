import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ShieldAlert, Users2, Target, FlaskConical, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCriticalOpenCount } from "@/lib/trigger-engine";
import { InsightCard } from "@/components/InsightCard";
import { AttritionPanel } from "@/components/AttritionPanel";
import { HeadcountPanel } from "@/components/HeadcountPanel";
import { PerformancePanel } from "@/components/performance/PerformancePanel";
import { getPerformanceOverview, pickObject } from "@/services/performance";

import { attritionOverview } from "@/lib/attrition-data";
import { atRiskEmployees } from "@/lib/employees";
import { getAttritionSummary } from "@/services/attrition";
import { getHeadcountKPIs, getHeadcountByDepartment } from "@/services/headcount";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "HR Insights — PeopleLens" },
      {
        name: "description",
        content: "Attrition prediction, headcount, and workforce performance insights.",
      },
      { property: "og:title", content: "HR Insights — PeopleLens" },
      {
        property: "og:description",
        content: "Attrition prediction, headcount, and workforce performance insights.",
      },
    ],
  }),
  component: HRInsights,
});

type MainCard = "attrition" | "headcount" | "performance";

function HRInsights() {
  const [openCard, setOpenCard] = useState<MainCard | null>(null);
  const [criticalTriggers, setCriticalTriggers] = useState(() => getCriticalOpenCount());

  useEffect(() => {
    function handleUpdate() {
      setCriticalTriggers(getCriticalOpenCount());
    }
    window.addEventListener("trigger-cases-updated", handleUpdate);
    return () => window.removeEventListener("trigger-cases-updated", handleUpdate);
  }, []);
  const summaryQuery = useQuery({ queryKey: ["attrition", "summary"], queryFn: getAttritionSummary });
  const liveRiskCount = summaryQuery.data?.people_at_risk ?? atRiskEmployees().length;
  const liveRiskRate = summaryQuery.data?.attrition_risk_rate_percent ?? attritionOverview.overallRate;
  const summarySubText = summaryQuery.isPending
    ? "Loading live risk data"
    : summaryQuery.data
      ? `${liveRiskRate.toFixed(1)}% risk rate across ${summaryQuery.data.total_employees} employees`
      : `Attrition rate ${attritionOverview.overallRate}% · industry ${attritionOverview.industryAvg}%`;

  const headcountKPIsQuery = useQuery({ queryKey: ["headcount", "kpis"], queryFn: () => getHeadcountKPIs() });
  const headcountDeptQuery = useQuery({ queryKey: ["headcount", "dept"], queryFn: () => getHeadcountByDepartment() });

  const totalEmployees = headcountKPIsQuery.data?.metrics?.find(m => m.metric_name === "actual_employee_count")?.value ?? 0;
  const approved = headcountKPIsQuery.data?.metrics?.find(m => m.metric_name === "approved_position_count")?.value ?? 0;
  const vacant = headcountKPIsQuery.data?.metrics?.find(m => m.metric_name === "vacant_approved_position_count")?.value ?? 0;
  const budgetUse = headcountKPIsQuery.data?.metrics?.find(m => m.metric_name === "budget_utilization_percentage")?.value ?? 0;
  const hData = headcountDeptQuery.data?.records?.slice(0, 5).map(r => ({
    dept: r.department,
    people: r.actual_employee_count
  })) ?? [];
  const maxPeople = Math.max(...hData.map(r => r.people), 1);

  const perfQuery = useQuery({ queryKey: ["perf", "overview", {}], queryFn: () => getPerformanceOverview() });
  const perf = (pickObject<Record<string, unknown>>(perfQuery.data, "overview", "data") ?? {}) as Record<string, unknown>;
  const perfNum = (value: unknown, digits = 1) => {
    const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
    return Number.isFinite(parsed) ? (digits === 0 ? String(Math.round(parsed)) : parsed.toFixed(digits)) : "—";
  };

  const strongCount = perf["strong_or_exceptional_count"] ?? perf["Strong_Or_Exceptional_Count"] ?? perf["strong_and_exceptional_count"];
  const improvingCount = perf["improving_count"] ?? perf["Improving_Count"] ?? perf["improving"];
  const decliningCount = perf["declining_count"] ?? perf["Declining_Count"] ?? perf["declining"];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Focus: Attrition
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">HR Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with attrition — click a card to open its detail panel and explore drill-down telemetry.
          </p>
        </div>
        <Link
          to="/scenario"
          className="btn-premium inline-flex items-center gap-2.5 rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <FlaskConical className="h-4 w-4" strokeWidth={2.25} />
          <span>Scenario Simulator</span>
        </Link>
      </div>

      {/* ── Decision Trigger Engine Active Alert Banner ── */}
      {criticalTriggers > 0 && (
        <div className="mb-8 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-card/90 backdrop-blur-md p-5 shadow-xs transition-all hover:border-rose-500/50 hover:shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-rose-400 opacity-20" />
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-foreground">
                    Decision Trigger Engine: {criticalTriggers} Critical Case{criticalTriggers > 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                    Immediate Action
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Automated rules matched urgent flight risks and unfilled critical roles requiring HR intervention.
                </p>
              </div>
            </div>

            <Link
              to="/triggers"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
            >
              <span>Review Cases ({criticalTriggers})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Insight Cards Grid ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <InsightCard
          className="card-enter stagger-1"
          onClick={() => setOpenCard("attrition")}
          tint="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          tintVar="--color-viz-5"
          icon={<ShieldAlert className="h-5 w-5" strokeWidth={2.25} />}
          label="Attrition"
          headline={`${liveRiskCount} people may leave`}
          sub={summarySubText}
          visual={
            <div className="space-y-3">
              <div className="flex h-16 items-end gap-1.5">
                {attritionOverview.trend.map((point, idx) => (
                  <div
                    key={point.month}
                    className={cn(
                      "flex-1 rounded-t-md transition-all duration-300 hover:scale-y-105",
                      idx === attritionOverview.trend.length - 1
                        ? "bg-gradient-to-t from-rose-500/80 to-rose-500 shadow-xs"
                        : "bg-gradient-to-t from-primary/50 to-primary/80"
                    )}
                    style={{ height: `${(point.rate / 10) * 100}%` }}
                    title={`${point.month}: ${point.rate}%`}
                  />
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Rising for 6 months — open for risk list, reasons and replacements.
              </div>
            </div>
          }
        />

        <InsightCard
          className="card-enter stagger-2"
          onClick={() => setOpenCard("headcount")}
          tint="bg-primary/10 text-primary"
          tintVar="--primary"
          icon={<Users2 className="h-5 w-5" strokeWidth={2.25} />}
          label="Headcount"
          headline={headcountKPIsQuery.isPending ? "Loading..." : `${totalEmployees} employees`}
          sub={headcountKPIsQuery.isPending ? "Fetching live headcount backend..." : `${approved} approved · ${vacant} vacant · ${typeof budgetUse === 'number' ? budgetUse.toFixed(1) : budgetUse}% budget used`}
          visual={
            <div className="space-y-2">
              {hData.map((row) => (
                <div key={row.dept} className="flex items-center gap-2 text-[11px]">
                  <span className="w-24 truncate font-medium text-muted-foreground">{row.dept}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-primary transition-all duration-500"
                      style={{ width: `${(row.people / maxPeople) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold tabular-nums">{row.people}</span>
                </div>
              ))}
            </div>
          }
        />


        <InsightCard
          className="card-enter stagger-3"
          onClick={() => setOpenCard("performance")}
          tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          tintVar="--color-viz-2"
          icon={<Target className="h-5 w-5" strokeWidth={2.25} />}
          label="Employee performance"
          headline={perfQuery.isPending ? "Loading..." : `${perfNum(perf["average_performance_score"])} avg score`}
          sub={
            perfQuery.isPending
              ? "Fetching live performance data..."
              : perfQuery.error
                ? "Performance data unavailable right now"
                : `${perfNum(perf["total_employees"], 0)} employees reviewed`
          }
          visual={
            <div className="space-y-2">
              {[
                { label: "Strong + exceptional", value: strongCount, gradient: "from-emerald-500 to-teal-400" },
                { label: "Improving", value: improvingCount, gradient: "from-primary to-sky-400" },
                { label: "Declining", value: decliningCount, gradient: "from-rose-500 to-amber-500" },
              ].map((row) => {
                const max = Math.max(
                  Number(strongCount ?? 0),
                  Number(improvingCount ?? 0),
                  Number(decliningCount ?? 0),
                  1,
                );
                return (
                  <div key={row.label} className="flex items-center gap-2 text-[11px]">
                    <span className="w-28 truncate font-medium text-muted-foreground">{row.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", row.gradient)}
                        style={{ width: `${(Number(row.value ?? 0) / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold tabular-nums">{perfNum(row.value, 0)}</span>
                  </div>
                );
              })}
            </div>
          }
        />
      </div>

      <AttritionPanel open={openCard === "attrition"} onClose={() => setOpenCard(null)} />

      <HeadcountPanel open={openCard === "headcount"} onClose={() => setOpenCard(null)} />

      <PerformancePanel open={openCard === "performance"} onClose={() => setOpenCard(null)} />
    </main>
  );
}
