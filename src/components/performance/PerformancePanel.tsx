import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpDown, Search, Send, Sparkles, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { CenterPanel } from "@/components/CenterPanel";
import { AsyncState, SectionCard, StatTile, bandTint, trendTint, num } from "@/components/performance/PerformanceUI";
import { DepartmentRankingChart, DistributionDonut, PerformanceEmployeePanel } from "@/components/performance/PerformanceEmployeePanel";
import {
  getPerformanceOverview,
  getPerformanceTrend,
  getPerformanceDepartments,
  getPerformanceDistribution,
  getPerformanceAttention,
  askPerformance,
  pickArray,
  pickObject,
  type AttentionRow,
  type DepartmentRow,
  type DistributionRow,
  type PerformanceFilters,
  type TrendPoint,
} from "@/services/performance";
import { cn } from "@/lib/utils";

const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 };

type SortKey = "employee_name" | "department" | "score" | "band" | "change";

export function PerformancePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [filters, setFilters] = useState<PerformanceFilters>({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "score", dir: "asc" });
  const [selected, setSelected] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  const overviewQuery = useQuery({ queryKey: ["perf", "overview", filters], queryFn: () => getPerformanceOverview(filters), enabled: open });
  const trendQuery = useQuery({ queryKey: ["perf", "trend", filters], queryFn: () => getPerformanceTrend(12, filters), enabled: open });
  const deptQuery = useQuery({ queryKey: ["perf", "departments", filters], queryFn: () => getPerformanceDepartments(filters), enabled: open });
  const distQuery = useQuery({ queryKey: ["perf", "distribution", filters], queryFn: () => getPerformanceDistribution(filters), enabled: open });
  const attentionQuery = useQuery({ queryKey: ["perf", "attention", filters], queryFn: () => getPerformanceAttention(filters), enabled: open });

  const ask = useMutation({ mutationFn: (value: string) => askPerformance(value) });

  const overview = (pickObject<Record<string, any>>(overviewQuery.data, "overview", "data") ?? {}) as Record<string, any>;

  const trend = useMemo(
    () =>
      pickArray<TrendPoint>(trendQuery.data, "trend", "records", "points").map((p) => ({
        month: String(p.Performance_Month ?? p["month"] ?? ""),
        score: Number(p.average_performance_score ?? 0),
      })),
    [trendQuery.data],
  );

  const departments = useMemo(
    () =>
      pickArray<DepartmentRow>(deptQuery.data, "departments", "records").map((d) => ({
        department: String(d.department ?? "—"),
        score: Number(d.average_performance_score ?? 0),
      })),
    [deptQuery.data],
  );

  const distribution = useMemo(
    () =>
      pickArray<DistributionRow>(distQuery.data, "distribution", "records", "bands").map((d) => ({
        band: String(d.performance_band ?? d["band"] ?? "—"),
        count: Number(d.employee_count ?? 0),
        percentage: Number(d.percentage ?? 0),
      })),
    [distQuery.data],
  );

  const attentionRows = useMemo(() => pickArray<AttentionRow>(attentionQuery.data, "employees", "records"), [attentionQuery.data]);

  const departmentOptions = useMemo(() => Array.from(new Set(departments.map((d) => d.department))).filter(Boolean), [departments]);
  const bandOptions = useMemo(() => Array.from(new Set(distribution.map((d) => d.band))).filter(Boolean), [distribution]);
  const monthOptions = useMemo(() => trend.map((t) => t.month).filter(Boolean).slice().reverse(), [trend]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = attentionRows.filter((r) =>
      !term ||
      String(r.employee_name ?? "").toLowerCase().includes(term) ||
      String(r.department ?? "").toLowerCase().includes(term),
    );
    const value = (row: AttentionRow) => {
      switch (sort.key) {
        case "score": return Number(row.latest_performance_score ?? row.performance_score ?? 0);
        case "change": return Number(row.three_month_change ?? 0);
        case "band": return String(row.performance_band ?? "");
        case "department": return String(row.department ?? "");
        default: return String(row.employee_name ?? "");
      }
    };
    return rows.slice().sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? result : -result;
    });
  }, [attentionRows, search, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));

  const kpis = [
    { label: "Avg performance score", value: num(overview["average_performance_score"]), tint: "bg-pastel-teal" },
    { label: "Total employees", value: num(overview["total_employees"], 0), tint: "bg-pastel-sky" },
    {
      label: "Strong + exceptional",
      value: num(overview["strong_and_exceptional_count"], 0),
      hint: typeof overview["strong_and_exceptional_percentage"] === "number"
        ? `${overview["strong_and_exceptional_percentage"].toFixed(1)}% of employees`
        : undefined,
      tint: "bg-pastel-mint",
    },
    { label: "Improving", value: num(overview["improving_count"], 0), tint: "bg-pastel-lavender" },
    { label: "Declining", value: num(overview["declining_count"], 0), tint: "bg-pastel-peach" },
  ];

  const answer = ask.data
    ? String(
        (ask.data as Record<string, any>)["answer"] ??
          (ask.data as Record<string, any>)["message"] ??
          (ask.data as Record<string, any>)["summary"] ??
          JSON.stringify(ask.data),
      )
    : null;

  return (
    <>
      <CenterPanel
        open={open && !selected}
        onOpenChange={(next) => !next && onClose()}
        size="lg"
        title="Employee performance"
        description="Organization performance scores, department ranking, distribution and employees needing attention."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-2xl border bg-muted/30 p-3">
            {[
              { key: "month" as const, label: "Month", options: monthOptions },
              { key: "department" as const, label: "Department", options: departmentOptions },
              { key: "role_band" as const, label: "Role band", options: bandOptions },
            ].map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {field.label}
                <select
                  value={filters[field.key] ?? ""}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, [field.key]: event.target.value || undefined }))
                  }
                  className="rounded-lg border bg-card px-2 py-1 text-xs text-foreground"
                >
                  <option value="">All</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
            {Object.values(filters).some(Boolean) && (
              <button onClick={() => setFilters({})} className="rounded-lg bg-card px-2.5 py-1 text-xs hover:bg-pastel-teal">
                Reset
              </button>
            )}
          </div>

          <AsyncState isPending={overviewQuery.isPending} error={overviewQuery.error} height="h-24">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {kpis.map((kpi) => (
                <StatTile key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} tint={kpi.tint} />
              ))}
            </div>
          </AsyncState>

          <SectionCard title="Organization trend" subtitle="Average performance score over the last 12 months." tint="bg-pastel-teal">
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

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Department ranking" subtitle="Highest to lowest average score." tint="bg-pastel-sky">
              <AsyncState isPending={deptQuery.isPending} error={deptQuery.error} isEmpty={departments.length === 0} emptyLabel="No department data.">
                <DepartmentRankingChart rows={departments} />
              </AsyncState>
            </SectionCard>

            <SectionCard title="Performance distribution" subtitle="How many people sit in each band." tint="bg-pastel-lavender">
              <AsyncState isPending={distQuery.isPending} error={distQuery.error} isEmpty={distribution.length === 0} emptyLabel="No distribution data.">
                <>
                  <DistributionDonut rows={distribution} />
                  <div className="mt-2 space-y-1.5">
                    {distribution.map((row) => (
                      <div key={row.band} className="flex items-center gap-2 text-[11px]">
                        <span className={cn("h-2 w-2 rounded-full", bandTint(row.band))} />
                        <span className="flex-1 truncate">{row.band}</span>
                        <span className="font-medium">{row.count}</span>
                        <span className="w-12 text-right text-muted-foreground">{num(row.percentage)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              </AsyncState>
            </SectionCard>
          </div>

          <SectionCard
            title="Employees requiring attention"
            subtitle="Click a person to open their full performance detail."
            tint="bg-pastel-peach"
            right={
              <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or department"
                  className="w-40 bg-transparent text-xs outline-none"
                />
              </div>
            }
          >
            <AsyncState
              isPending={attentionQuery.isPending}
              error={attentionQuery.error}
              isEmpty={visibleRows.length === 0}
              emptyLabel="No employees currently require attention."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {([
                        ["employee_name", "Employee"],
                        ["department", "Department"],
                        ["score", "Score"],
                        ["band", "Band"],
                        ["change", "3-month change"],
                      ] as [SortKey, string][]).map(([key, label]) => (
                        <th key={key} className="px-2 py-2">
                          <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-foreground">
                            {label}
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                      ))}
                      <th className="px-2 py-2">Trend</th>
                      <th className="px-2 py-2">Development KPIs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, index) => {
                      const change = Number(row.three_month_change ?? 0);
                      const kpiList = Array.isArray(row.development_kpis)
                        ? row.development_kpis.join(", ")
                        : String(row.development_kpis ?? "—");
                      return (
                        <tr
                          key={`${row.employee_id}-${index}`}
                          onClick={() => row.employee_id && setSelected(String(row.employee_id))}
                          className="cursor-pointer border-t transition-colors hover:bg-muted/50"
                        >
                          <td className="px-2 py-2 font-medium">{String(row.employee_name ?? "—")}</td>
                          <td className="px-2 py-2 text-muted-foreground">{String(row.department ?? "—")}</td>
                          <td className="px-2 py-2 font-semibold">{num(row.latest_performance_score ?? row.performance_score)}</td>
                          <td className="px-2 py-2">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", bandTint(row.performance_band))}>
                              {String(row.performance_band ?? "—")}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <span className="flex items-center gap-1">
                              {change < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                              {typeof row.three_month_change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "—"}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", trendTint(row.performance_trend))}>
                              {String(row.performance_trend ?? "—")}
                            </span>
                          </td>
                          <td className="max-w-[220px] truncate px-2 py-2 text-muted-foreground">{kpiList}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AsyncState>
          </SectionCard>

          <SectionCard title="Ask Performance" subtitle="Ask a question in plain language about performance." tint="bg-pastel-mint">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && question.trim()) ask.mutate(question.trim());
                }}
                placeholder="e.g. Which department improved the most this quarter?"
                className="flex-1 rounded-xl border bg-card px-3 py-2 text-xs outline-none focus:border-primary/50"
              />
              <button
                onClick={() => question.trim() && ask.mutate(question.trim())}
                disabled={ask.isPending || !question.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {ask.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Ask
              </button>
            </div>
            {ask.error && (
              <p className="mt-2 rounded-xl bg-pastel-rose/50 p-3 text-xs">
                {ask.error instanceof Error ? ask.error.message : "Could not get an answer."}
              </p>
            )}
            {answer && (
              <div className="mt-2 flex gap-2 rounded-xl bg-card p-3 text-xs">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </SectionCard>
        </div>
      </CenterPanel>

      <PerformanceEmployeePanel employeeId={selected} onClose={onClose} onBack={() => setSelected(null)} />
    </>
  );
}
