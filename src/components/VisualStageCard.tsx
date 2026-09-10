import { useMemo, useState } from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  TableProperties,
  X,
  ExternalLink,
  Search,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import type { ActiveVisual } from "@/types/chat";
import { parseVisualData, analyzeDataStructure } from "@/lib/visual-extractor";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const PALETTE = [
  "var(--pastel-sky)",
  "var(--pastel-mint)",
  "var(--pastel-lavender)",
  "var(--pastel-peach)",
  "var(--pastel-pink)",
  "var(--pastel-yellow)",
  "var(--pastel-blue)",
  "var(--pastel-teal)",
  "var(--pastel-rose)",
];

const chartTooltip = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};

function formatHeaderKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function VisualStageCard({
  visual,
  onClose,
}: {
  visual: ActiveVisual;
  onClose: () => void;
}) {
  const normalizedType = (visual.type || "").toLowerCase().trim();
  const isInitialTable = normalizedType === "table";
  const [viewMode, setViewMode] = useState<"chart" | "table">(isInitialTable ? "table" : "chart");
  const [tableSearch, setTableSearch] = useState("");

  const items = useMemo(() => parseVisualData(visual.data), [visual.data]);

  if (items.length === 0) {
    if (visual.url) {
      return (
        <div className="flex flex-col h-full bg-card/95 backdrop-blur-md p-6 items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Visualization Artifact Ready</h3>
          <p className="text-xs text-muted-foreground mb-4">Click below to open the full visual artifact.</p>
          <a
            href={visual.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open visualization
          </a>
        </div>
      );
    }
    return null;
  }

  const { categoryKey, metricKeys, columns } = useMemo(() => analyzeDataStructure(items), [items]);

  const chartItems = useMemo(() => {
    return items.map((row) => {
      const copy = { ...row };
      for (const mk of metricKeys) {
        const num = Number(copy[mk]);
        if (!isNaN(num)) copy[mk] = num;
      }
      return copy;
    });
  }, [items, metricKeys]);

  const filteredItems = useMemo(() => {
    if (!tableSearch.trim()) return items;
    const q = tableSearch.toLowerCase().trim();
    return items.filter((row) =>
      columns.some((c) => String(row[c] ?? "").toLowerCase().includes(q)),
    );
  }, [items, tableSearch, columns]);

  const isPie = normalizedType === "pie";
  const isLine = normalizedType === "line" || normalizedType === "area";
  const isBar = !isPie && !isLine;

  const chartTitle =
    visual.reason ||
    (isBar
      ? "Workforce Comparison"
      : isPie
        ? "Workforce Distribution"
        : isLine
          ? "Historical Trend"
          : "Workforce Data Overview");

  const chartBadge = isBar ? "Bar Chart" : isPie ? "Pie Chart" : isLine ? "Line Trend" : "Table View";
  const ChartIcon = isBar ? BarChart3 : isPie ? PieChartIcon : isLine ? Activity : TableProperties;

  return (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-md">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b bg-pastel-lavender/40">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-primary/15 grid place-items-center shrink-0 shadow-xs">
            <ChartIcon className="w-5 h-5 text-primary" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{chartTitle}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/80 border text-muted-foreground shadow-2xs shrink-0">
                {chartBadge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              Workforce Visual Stage • {items.length} records analyzed
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center p-0.5 bg-background/80 border rounded-lg shadow-2xs">
            <button
              onClick={() => setViewMode("chart")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                viewMode === "chart"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ChartIcon className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Close stage button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close visual stage"
            title="Close visual stage (expand chat)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Canvas Body ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === "chart" ? (
          <div className="h-full flex flex-col justify-center min-h-[360px]">
            {isBar && (
              <div className="w-full h-full min-h-[340px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartItems}
                    margin={{
                      left: -10,
                      right: 20,
                      top: 10,
                      bottom: chartItems.length > 5 ? 30 : 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey={categoryKey}
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      interval={0}
                      angle={chartItems.length > 5 ? -25 : 0}
                      textAnchor={chartItems.length > 5 ? "end" : "middle"}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[(dataMin: number) => (dataMin > 40 ? Math.max(0, Math.floor(dataMin - 5)) : 0), "auto"]}
                    />
                    <Tooltip
                      contentStyle={chartTooltip}
                      itemStyle={{ color: "var(--foreground)" }}
                      formatter={(value: any, name: any) => [value, formatHeaderKey(String(name))]}
                      labelFormatter={(label: any, payload: any) => {
                        const row = payload?.[0]?.payload;
                        if (row && (row["Department"] || row["Position"])) {
                          const sub = [row["Department"], row["Position"]].filter(Boolean).join(" · ");
                          return `${label} (${sub})`;
                        }
                        return label;
                      }}
                    />
                    {metricKeys.slice(0, 3).map((key, i) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={formatHeaderKey(key)}
                        fill={PALETTE[i % PALETTE.length]}
                        radius={[6, 6, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {isPie && (
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                <div className="w-full md:w-1/2 h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartItems}
                        dataKey={metricKeys[0] || "value"}
                        nameKey={categoryKey}
                        innerRadius={55}
                        outerRadius={105}
                        paddingAngle={3}
                      >
                        {chartItems.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PALETTE[i % PALETTE.length]}
                            stroke="var(--card)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Distribution Breakdown
                  </h4>
                  {chartItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                        />
                        <span className="font-medium text-foreground truncate">
                          {String(item[categoryKey] ?? "")}
                        </span>
                      </div>
                      <span className="font-bold tabular-nums text-foreground shrink-0 ml-3">
                        {String(item[metricKeys[0]] ?? "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLine && (
              <div className="w-full h-full min-h-[340px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartItems}
                    margin={{
                      left: -10,
                      right: 20,
                      top: 10,
                      bottom: chartItems.length > 5 ? 30 : 10,
                    }}
                  >
                    <defs>
                      <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey={categoryKey}
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      interval={0}
                      angle={chartItems.length > 5 ? -25 : 0}
                      textAnchor={chartItems.length > 5 ? "end" : "middle"}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} />
                    <Area
                      type="monotone"
                      dataKey={metricKeys[0]}
                      name={formatHeaderKey(metricKeys[0])}
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fill="url(#stageGrad)"
                      dot={{ r: 4, fill: "var(--primary)" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter rows..."
                  className="h-8 pl-8 text-xs rounded-lg"
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                Showing {filteredItems.length} of {items.length} records
              </span>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-border/70 bg-card shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/70 sticky top-0 z-10">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="p-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap border-b"
                      >
                        {formatHeaderKey(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredItems.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                      {columns.map((col) => {
                        const val = row[col];
                        const isNum =
                          typeof val === "number" ||
                          (!isNaN(Number(val)) && typeof val === "string" && val.trim() !== "");
                        return (
                          <td
                            key={col}
                            className={cn(
                              "p-3 text-xs",
                              isNum
                                ? "tabular-nums font-semibold text-foreground"
                                : "text-foreground font-medium",
                            )}
                          >
                            {val != null ? String(val) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="p-8 text-center text-xs text-muted-foreground"
                      >
                        No matching records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-2.5 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Workforce Analytics Canvas</span>
        </div>
        {visual.url && (
          <a
            href={visual.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View original artifact
          </a>
        )}
      </div>
    </div>
  );
}
