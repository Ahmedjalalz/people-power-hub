import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ShieldAlert, Users2, Target, FlaskConical, ArrowRight, CircleAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <section className="mb-8 grid gap-5 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" />Your workforce today</p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">See what needs attention, then act.</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">Start with employee retention, then explore staffing and performance when you need more context.</p>
        </div>
        <Button asChild size="lg"><Link to="/scenario"><FlaskConical />Plan a workforce change</Link></Button>
      </section>

      {criticalTriggers > 0 && (
        <section aria-labelledby="urgent-cases-title" className="mb-8 grid gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <span className="grid size-11 place-items-center rounded-lg bg-destructive/10 text-destructive"><CircleAlert className="size-5" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 id="urgent-cases-title" className="font-bold">{criticalTriggers} urgent {criticalTriggers === 1 ? "case needs" : "cases need"} review</h2><span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">Action needed</span></div>
            <p className="mt-1 text-sm text-muted-foreground">People risks and critical vacancies have reached your review threshold.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/triggers">Review cases <ArrowRight /></Link></Button>
        </section>
      )}

      <section aria-labelledby="insight-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><h2 id="insight-heading" className="text-xl font-bold">Key insights</h2><p className="mt-1 text-sm text-muted-foreground">Select a topic to see the evidence and recommended next steps.</p></div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <InsightCard
          onClick={() => setOpenCard("attrition")}
          tint="bg-destructive/10 text-destructive"
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
                      `flex-1 rounded-t-sm transition-transform duration-200 ${idx === attritionOverview.trend.length - 1 ? "bg-destructive" : "bg-primary/60"}`
                    }
                    style={{ height: `${(point.rate / 10) * 100}%` }}
                    title={`${point.month}: ${point.rate}%`}
                  />
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Risk has risen for six months. Open to see people, reasons, and possible cover.
              </div>
            </div>
          }
        />

        <InsightCard
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
                      className="h-full rounded-full bg-primary transition-all duration-500"
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
                { label: "Strong + exceptional", value: strongCount, tone: "bg-success" },
                { label: "Improving", value: improvingCount, tone: "bg-primary" },
                { label: "Declining", value: decliningCount, tone: "bg-destructive" },
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
                        className={`h-full rounded-full transition-all duration-500 ${row.tone}`}
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
      </section>

      <AttritionPanel open={openCard === "attrition"} onClose={() => setOpenCard(null)} />

      <HeadcountPanel open={openCard === "headcount"} onClose={() => setOpenCard(null)} />

      <PerformancePanel open={openCard === "performance"} onClose={() => setOpenCard(null)} />
    </main>
  );
}
