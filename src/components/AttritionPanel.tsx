import { useState } from "react";
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
import { ShieldAlert, TrendingUp, Compass, Network, Hourglass, ArrowUpRight } from "lucide-react";
import { CenterPanel } from "@/components/CenterPanel";
import { Callout } from "@/components/InsightCard";
import { cn } from "@/lib/utils";
import {
  attritionOverview,
  reasonBreakdown,
  departmentRisk,
  tenureBuckets,
} from "@/lib/attrition-data";
import { atRiskEmployees, employeeById, initials, riskTone, type Employee } from "@/lib/employees";

type SubView = "trend" | "people" | "reasons" | "departments" | "tenure";

const chartTooltip = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
};

export function AttritionPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sub, setSub] = useState<SubView | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const person = personId ? employeeById(personId) : undefined;

  return (
    <>
      <CenterPanel
        open={open}
        onOpenChange={(next) => !next && onClose()}
        title="Attrition"
        description="Everything about who might leave, why, and who could step in."
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MiniCard
            tint="bg-pastel-teal"
            icon={<TrendingUp className="h-5 w-5" strokeWidth={2.25} />}
            label="Attrition rate"
            headline={`${attritionOverview.overallRate}%`}
            sub={`Industry average ${attritionOverview.industryAvg}%`}
            onClick={() => setSub("trend")}
          />
          <MiniCard
            tint="bg-pastel-peach"
            icon={<ShieldAlert className="h-5 w-5" strokeWidth={2.25} />}
            label="People at risk"
            headline={`${atRiskEmployees().length} people`}
            sub={`of ${attritionOverview.totalEmployees} employees — see the list`}
            onClick={() => setSub("people")}
          />
          <MiniCard
            tint="bg-pastel-sky"
            icon={<Compass className="h-5 w-5" strokeWidth={2.25} />}
            label="Top reason people leave"
            headline="Career growth"
            sub="34% of exits in the last 6 months"
            onClick={() => setSub("reasons")}
          />
          <MiniCard
            tint="bg-pastel-lavender"
            icon={<Network className="h-5 w-5" strokeWidth={2.25} />}
            label="Department at risk"
            headline="Operations"
            sub="22 people flagged"
            onClick={() => setSub("departments")}
          />
          <MiniCard
            tint="bg-pastel-rose"
            icon={<Hourglass className="h-5 w-5" strokeWidth={2.25} />}
            label="When people leave"
            headline="1–3 years"
            sub="most common tenure at exit"
            onClick={() => setSub("tenure")}
          />
        </div>
      </CenterPanel>

      <CenterPanel
        open={sub === "trend"}
        onOpenChange={(next) => !next && setSub(null)}
        onBack={() => setSub(null)}
        title="Attrition trend"
        description="Attrition climbed from 6.2% to 8.4% over the last 6 months — now above industry average."
      >
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={attritionOverview.trend}>
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} unit="%" />
              <Tooltip contentStyle={chartTooltip} />
              <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Callout tint="bg-pastel-teal/50">
          <strong>What this means:</strong> more people are leaving than usual. Open “People at risk” to
          see who is most likely to leave next.
        </Callout>
      </CenterPanel>

      <CenterPanel
        open={sub === "people"}
        onOpenChange={(next) => !next && setSub(null)}
        onBack={() => setSub(null)}
        title="People who might leave"
        description="Ranked by the attrition model. A higher score means a sooner, more likely exit."
      >
        <div className="space-y-3">
          {atRiskEmployees().map((employee) => (
            <button
              key={employee.id}
              onClick={() => setPersonId(employee.id)}
              className="group w-full rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pastel-teal text-sm font-semibold">
                  {initials(employee.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {employee.positionTitle} · {employee.department}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{employee.riskScore}%</div>
                  <div className="text-[10px] text-muted-foreground">{employee.timeframe}</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/5">
                <div
                  className={cn("h-full rounded-full", riskTone(employee.riskScore ?? 0))}
                  style={{ width: `${employee.riskScore}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{employee.riskSummary}</p>
            </button>
          ))}
        </div>
      </CenterPanel>

      <PersonPanel
        person={person}
        onOpenChange={(next) => !next && setPersonId(null)}
        onBack={() => setPersonId(null)}
      />

      <CenterPanel
        open={sub === "reasons"}
        onOpenChange={(next) => !next && setSub(null)}
        onBack={() => setSub(null)}
        title="Why people leave"
        description="Reasons cited in exit interviews over the last 6 months."
      >
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={reasonBreakdown}
                dataKey="value"
                nameKey="reason"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
              >
                {reasonBreakdown.map((reason) => (
                  <Cell key={reason.reason} fill={reason.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {reasonBreakdown.map((reason) => (
            <div key={reason.reason} className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-full" style={{ background: reason.color }} />
              <span className="flex-1">{reason.reason}</span>
              <span className="font-medium">{reason.value}%</span>
            </div>
          ))}
        </div>
        <Callout tint="bg-pastel-sky/60">
          Career growth is the top exit reason. Reviewing promotion pipelines this quarter would help most.
        </Callout>
      </CenterPanel>

      <CenterPanel
        open={sub === "departments"}
        onOpenChange={(next) => !next && setSub(null)}
        onBack={() => setSub(null)}
        title="Attrition risk by department"
        description="How many people are currently flagged as at risk in each team."
      >
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={departmentRisk} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis type="category" dataKey="dept" stroke="var(--muted-foreground)" fontSize={12} width={80} />
              <Tooltip contentStyle={chartTooltip} />
              <Bar dataKey="risk" radius={[0, 8, 8, 0]}>
                {departmentRisk.map((dept) => (
                  <Cell key={dept.dept} fill={dept.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Callout tint="bg-pastel-lavender/60">
          Operations has the most people at risk — worth a deeper look with the team lead.
        </Callout>
      </CenterPanel>

      <CenterPanel
        open={sub === "tenure"}
        onOpenChange={(next) => !next && setSub(null)}
        onBack={() => setSub(null)}
        title="When people tend to leave"
        description="How long people stayed before leaving. Most exits happen in the 1–3 year window."
      >
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={tenureBuckets}>
              <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={chartTooltip} />
              <Bar dataKey="leaving" fill="var(--chart-4)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Callout tint="bg-pastel-rose/60">
          Focus onboarding and career conversations on people in their 1–3 year window.
        </Callout>
      </CenterPanel>
    </>
  );
}

function PersonPanel({
  person,
  onOpenChange,
  onBack,
}: {
  person: Employee | undefined;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
}) {
  return (
    <CenterPanel
      open={Boolean(person)}
      onOpenChange={onOpenChange}
      onBack={onBack}
      title={person ? `${person.name} — ${person.riskScore}% attrition risk` : ""}
      description={
        person ? `Projected to leave within the next ${person.timeframe} if nothing changes.` : undefined
      }
    >
      {person && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-pastel-peach/60 p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Contributing signals
            </div>
            <ul className="space-y-2 text-sm">
              {(person.signals ?? []).map((signal, index) => (
                <li key={signal} className="flex gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-pastel-teal/50 p-4">
            <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
              Potential replacements
            </div>
            <div className="space-y-3">
              {(person.replacements ?? []).map((replacement) => (
                <div key={replacement.id} className="text-sm">
                  <Link
                    to="/employee/$employeeId"
                    params={{ employeeId: replacement.id }}
                    className="inline-flex items-center gap-1 font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                  >
                    {replacement.name}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <p className="text-muted-foreground">{replacement.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/employee/$employeeId"
            params={{ employeeId: person.id }}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline decoration-primary/40 underline-offset-4"
          >
            Open {person.name}'s full profile
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </CenterPanel>
  );
}

function MiniCard({
  tint,
  icon,
  label,
  headline,
  sub,
  onClick,
}: {
  tint: string;
  icon: React.ReactNode;
  label: string;
  headline: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tint)}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="text-lg font-semibold tracking-tight">{headline}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </button>
  );
}
