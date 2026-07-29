import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  ShieldAlert,
  Compass,
  UserRoundSearch,
  Network,
  Hourglass,
  ChevronRight,
} from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  attritionOverview,
  topRisk,
  reasonBreakdown,
  departmentRisk,
  tenureBuckets,
  type RiskEmployee,
} from "@/lib/attrition-data";

export const Route = createFileRoute("/")({
  component: HRInsights,
});

type CardKey = "overview" | "atrisk" | "reasons" | "trend" | "departments" | "tenure";

function HRInsights() {
  const [openCard, setOpenCard] = useState<CardKey | null>(null);

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pastel-yellow/60 text-xs font-medium mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Focus: Attrition
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">HR Insights</h1>
        <p className="text-muted-foreground mt-1">
          A simple view of who might leave, why, and what to do about it. Click any card for details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <InsightCard
          onClick={() => setOpenCard("overview")}
          tint="bg-pastel-pink"
          icon={<Sparkles className="w-5 h-5" strokeWidth={2.25} />}
          label="Attrition rate"
          headline={`${attritionOverview.overallRate}%`}
          sub={`Industry avg ${attritionOverview.industryAvg}%`}
          visual={
            <div className="flex items-end gap-1 h-16">
              {attritionOverview.trend.map((t) => (
                <div
                  key={t.month}
                  className="flex-1 rounded-t-md bg-primary/60"
                  style={{ height: `${(t.rate / 10) * 100}%` }}
                  title={`${t.month}: ${t.rate}%`}
                />
              ))}
            </div>
          }
        />

        <InsightCard
          onClick={() => setOpenCard("atrisk")}
          tint="bg-pastel-peach"
          icon={<AlertTriangle className="w-5 h-5" />}
          label="People at risk"
          headline={`${attritionOverview.atRiskCount}`}
          sub={`of ${attritionOverview.totalEmployees} employees`}
          visual={
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: attritionOverview.atRiskCount }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-rose-400/70" />
              ))}
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={`s${i}`} className="w-3 h-3 rounded-full bg-foreground/10" />
              ))}
            </div>
          }
        />

        <InsightCard
          onClick={() => setOpenCard("reasons")}
          tint="bg-pastel-mint"
          icon={<Heart className="w-5 h-5" />}
          label="Top reason people leave"
          headline="Career growth"
          sub="34% of exits last 6 months"
          visual={
            <div className="space-y-1.5">
              {reasonBreakdown.slice(0, 3).map((r) => (
                <div key={r.reason}>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                    <span>{r.reason}</span>
                    <span>{r.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${r.value * 2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          }
        />

        <InsightCard
          onClick={() => setOpenCard("trend")}
          tint="bg-pastel-blue"
          icon={<Users className="w-5 h-5" />}
          label="Highest-risk person"
          headline="Usman Ali"
          sub="82% likely to leave in 60–90 days"
          visual={
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-foreground/10" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    className="stroke-rose-400"
                    strokeWidth="3"
                    strokeDasharray="82, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-sm font-semibold">82%</div>
              </div>
              <div className="text-xs text-muted-foreground leading-snug">
                Pension window · missed promotion · long commute
              </div>
            </div>
          }
        />

        <InsightCard
          onClick={() => setOpenCard("departments")}
          tint="bg-pastel-lavender"
          icon={<Building2 className="w-5 h-5" />}
          label="Department at risk"
          headline="Operations"
          sub="22 people flagged"
          visual={
            <div className="space-y-1.5">
              {departmentRisk.slice(0, 4).map((d) => (
                <div key={d.dept} className="flex items-center gap-2 text-[11px]">
                  <span className="w-16 text-muted-foreground">{d.dept}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${(d.risk / 25) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right">{d.risk}</span>
                </div>
              ))}
            </div>
          }
        />

        <InsightCard
          onClick={() => setOpenCard("tenure")}
          tint="bg-pastel-rose"
          icon={<Clock className="w-5 h-5" />}
          label="When people leave"
          headline="1–3 years"
          sub="most common tenure at exit"
          visual={
            <div className="flex items-end justify-between gap-1 h-16">
              {tenureBuckets.map((t) => (
                <div key={t.bucket} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-primary/60"
                    style={{ height: `${(t.leaving / 15) * 100}%` }}
                  />
                  <div className="text-[9px] text-muted-foreground">{t.bucket}</div>
                </div>
              ))}
            </div>
          }
        />
      </div>

      <DetailSheet openCard={openCard} onClose={() => setOpenCard(null)} />
    </main>
  );
}

function InsightCard({
  tint,
  icon,
  label,
  headline,
  sub,
  visual,
  onClick,
}: {
  tint: string;
  icon: React.ReactNode;
  label: string;
  headline: string;
  sub: string;
  visual: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left rounded-2xl border bg-card p-5 h-[280px] flex flex-col transition-all",
        "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-xl grid place-items-center text-foreground/70", tint)}>{icon}</div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-semibold">{headline}</div>
      <div className="text-xs text-muted-foreground mb-4">{sub}</div>
      <div className="mt-auto">{visual}</div>
    </button>
  );
}

function DetailSheet({ openCard, onClose }: { openCard: CardKey | null; onClose: () => void }) {
  return (
    <Sheet open={openCard !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {openCard === "overview" && <OverviewDetail />}
        {openCard === "atrisk" && <AtRiskDetail />}
        {openCard === "reasons" && <ReasonsDetail />}
        {openCard === "trend" && <TopPersonDetail person={topRisk[0]} />}
        {openCard === "departments" && <DepartmentsDetail />}
        {openCard === "tenure" && <TenureDetail />}
      </SheetContent>
    </Sheet>
  );
}

function OverviewDetail() {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Attrition trend</SheetTitle>
        <SheetDescription>
          Your attrition has climbed from 6.2% to 8.4% over the last 6 months — now above the industry
          average.
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 h-64">
        <ResponsiveContainer>
          <LineChart data={attritionOverview.trend}>
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} unit="%" />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Callout tint="bg-pastel-yellow/60">
        <strong>What this means:</strong> more people are leaving than usual. The next section shows who
        is most likely to leave next.
      </Callout>
    </>
  );
}

function AtRiskDetail() {
  return (
    <>
      <SheetHeader>
        <SheetTitle>People at risk of leaving</SheetTitle>
        <SheetDescription>
          Ranked by our attrition risk model. Higher score = more likely to leave soon.
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-3">
        {topRisk.map((p) => (
          <RiskRow key={p.name} p={p} />
        ))}
      </div>
    </>
  );
}

function RiskRow({ p }: { p: RiskEmployee }) {
  const tone = p.score >= 75 ? "bg-rose-400" : p.score >= 65 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.role}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{p.score}%</div>
          <div className="text-[10px] text-muted-foreground">{p.timeframe}</div>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-foreground/5 overflow-hidden">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${p.score}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{p.reason}</p>
    </div>
  );
}

function ReasonsDetail() {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Why people leave</SheetTitle>
        <SheetDescription>Reasons cited in exit interviews over the last 6 months.</SheetDescription>
      </SheetHeader>
      <div className="mt-6 h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={reasonBreakdown} dataKey="value" nameKey="reason" innerRadius={50} outerRadius={90} paddingAngle={3}>
              {reasonBreakdown.map((r) => (
                <Cell key={r.reason} fill={r.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {reasonBreakdown.map((r) => (
          <div key={r.reason} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: r.color }} />
            <span className="flex-1">{r.reason}</span>
            <span className="font-medium">{r.value}%</span>
          </div>
        ))}
      </div>
      <Callout tint="bg-pastel-mint/60">
        Career growth is the top exit reason. Consider reviewing promotion pipelines this quarter.
      </Callout>
    </>
  );
}

function TopPersonDetail({ person }: { person: RiskEmployee }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{person.name} — {person.score}% attrition risk</SheetTitle>
        <SheetDescription>
          Projected to leave within the next {person.timeframe} if nothing changes.
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl bg-pastel-pink/40 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Contributing signals</div>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><span>1.</span> Eligible for pension in under 6 months, no confirmed intent to extend.</li>
            <li className="flex gap-2"><span>2.</span> Two consecutive promotion cycles passed over despite strong reviews.</li>
            <li className="flex gap-2"><span>3.</span> Posted 400km from family residence with no pending transfer approved.</li>
          </ul>
        </div>
        <div className="rounded-xl bg-pastel-mint/50 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Suggested action</div>
          <p className="text-sm">
            Offer a retention conversation and prioritise the pending transfer request before the pension
            eligibility window closes.
          </p>
        </div>
      </div>
    </>
  );
}

function DepartmentsDetail() {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Attrition risk by department</SheetTitle>
        <SheetDescription>Number of people currently flagged as at-risk per team.</SheetDescription>
      </SheetHeader>
      <div className="mt-6 h-64">
        <ResponsiveContainer>
          <BarChart data={departmentRisk} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis type="category" dataKey="dept" stroke="var(--muted-foreground)" fontSize={12} width={80} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Bar dataKey="risk" radius={[0, 8, 8, 0]}>
              {departmentRisk.map((d) => (
                <Cell key={d.dept} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Callout tint="bg-pastel-lavender/60">
        Operations has the most people at risk — worth a deeper look with the team lead.
      </Callout>
    </>
  );
}

function TenureDetail() {
  return (
    <>
      <SheetHeader>
        <SheetTitle>When people tend to leave</SheetTitle>
        <SheetDescription>How long people stayed before leaving. Most exits happen in the 1–3 year window.</SheetDescription>
      </SheetHeader>
      <div className="mt-6 h-64">
        <ResponsiveContainer>
          <BarChart data={tenureBuckets}>
            <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Bar dataKey="leaving" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Callout tint="bg-pastel-rose/60">
        Focus onboarding & career conversations on employees in their 1–3 year window.
      </Callout>
    </>
  );
}

function Callout({ children, tint }: { children: React.ReactNode; tint: string }) {
  return <div className={cn("mt-4 rounded-xl p-4 text-sm", tint)}>{children}</div>;
}
