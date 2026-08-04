import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldAlert, Users2, HeartHandshake } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { InsightCard, Callout } from "@/components/InsightCard";
import { CenterPanel } from "@/components/CenterPanel";
import { AttritionPanel } from "@/components/AttritionPanel";
import { HeadcountPanel } from "@/components/HeadcountPanel";

import { attritionOverview } from "@/lib/attrition-data";
import { atRiskEmployees } from "@/lib/employees";
import { getAttritionSummary } from "@/services/attrition";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "HR Insights — PeopleLens" },
      {
        name: "description",
        content: "Attrition prediction, headcount and engagement insights in plain language.",
      },
      { property: "og:title", content: "HR Insights — PeopleLens" },
      {
        property: "og:description",
        content: "Attrition prediction, headcount and engagement insights in plain language.",
      },
    ],
  }),
  component: HRInsights,
});

type MainCard = "attrition" | "headcount" | "engagement";

const headcountData = [
  { dept: "Engineering", people: 74 },
  { dept: "Operations", people: 62 },
  { dept: "Support", people: 43 },
  { dept: "Sales", people: 39 },
  { dept: "Finance", people: 30 },
];

const engagementData = [
  { dept: "Engineering", score: 74 },
  { dept: "Operations", score: 61 },
  { dept: "Support", score: 68 },
  { dept: "Sales", score: 72 },
  { dept: "Finance", score: 79 },
];

function HRInsights() {
  const [openCard, setOpenCard] = useState<MainCard | null>(null);
  const summaryQuery = useQuery({ queryKey: ["attrition", "summary"], queryFn: getAttritionSummary });
  const liveRiskCount = summaryQuery.data?.people_at_risk ?? atRiskEmployees().length;
  const liveRiskRate = summaryQuery.data?.attrition_risk_rate_percent ?? attritionOverview.overallRate;
  const summarySubText = summaryQuery.isPending
    ? "Loading live risk data"
    : summaryQuery.data
      ? `${liveRiskRate.toFixed(1)}% risk rate across ${summaryQuery.data.total_employees} employees`
      : `Attrition rate ${attritionOverview.overallRate}% · industry ${attritionOverview.industryAvg}%`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-pastel-teal/70 px-3 py-1 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Focus: Attrition
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">HR Insights</h1>
        <p className="mt-1 text-muted-foreground">
          Start with attrition — click a card to open its detail panel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <InsightCard
          onClick={() => setOpenCard("attrition")}
          tint="bg-pastel-teal"
          tintVar="--pastel-teal"
          icon={<ShieldAlert className="h-5 w-5" strokeWidth={2.25} />}
          label="Attrition"
          headline={`${liveRiskCount} people may leave`}
          sub={summarySubText}
          visual={
            <div className="space-y-3">
              <div className="flex h-16 items-end gap-1">
                {attritionOverview.trend.map((point) => (
                  <div
                    key={point.month}
                    className="flex-1 rounded-t-md bg-primary/60"
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
          onClick={() => setOpenCard("headcount")}
          tint="bg-pastel-sky"
          tintVar="--pastel-sky"
          icon={<Users2 className="h-5 w-5" strokeWidth={2.25} />}
          label="Headcount"
          headline={`${attritionOverview.totalEmployees} employees`}
          sub="316 approved · 68 vacant · 84% budget used"

          visual={
            <div className="space-y-1.5">
              {headcountData.map((row) => (
                <div key={row.dept} className="flex items-center gap-2 text-[11px]">
                  <span className="w-20 text-muted-foreground">{row.dept}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/5">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${(row.people / 80) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right">{row.people}</span>
                </div>
              ))}
            </div>
          }
        />

        <InsightCard
          onClick={() => setOpenCard("engagement")}
          tint="bg-pastel-lavender"
          tintVar="--pastel-lavender"
          icon={<HeartHandshake className="h-5 w-5" strokeWidth={2.25} />}
          label="Engagement"
          headline="71 / 100"
          sub="Company-wide pulse score"
          visual={
            <div className="flex items-end justify-between gap-1.5">
              {engagementData.map((row) => (
                <div key={row.dept} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end rounded-md bg-foreground/5">
                    <div
                      className="w-full rounded-md bg-primary/60"
                      style={{ height: `${row.score}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground">{row.dept.slice(0, 4)}</div>
                </div>
              ))}
            </div>
          }
        />
      </div>

      <AttritionPanel open={openCard === "attrition"} onClose={() => setOpenCard(null)} />

      <HeadcountPanel open={openCard === "headcount"} onClose={() => setOpenCard(null)} />


      <CenterPanel
        open={openCard === "engagement"}
        onOpenChange={(next) => !next && setOpenCard(null)}
        title="Engagement pulse"
        description="Average pulse survey score per department (out of 100)."
      >
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={engagementData}>
              <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
              />
              <Bar dataKey="score" fill="var(--chart-5)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Callout tint="bg-pastel-lavender/60">
          Operations scores lowest at 61 — the same team carrying the highest attrition risk.
        </Callout>
      </CenterPanel>
    </main>
  );
}
