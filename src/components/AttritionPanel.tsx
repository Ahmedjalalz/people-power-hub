import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { ShieldAlert, TrendingUp, Compass, Network, Hourglass, RefreshCw } from "lucide-react";
import { CenterPanel } from "@/components/CenterPanel";
import { Callout } from "@/components/InsightCard";
import { cn } from "@/lib/utils";
import { attritionOverview, tenureBuckets } from "@/lib/attrition-data";
import { initials, riskTone } from "@/lib/employees";
import {
  getAttritionRate,
  getAttritionSummary,
  getDepartmentRisk,
  getEmployeeProfile,
  getPeopleAtRisk,
  getPersonAtRiskDetail,
  getTopRiskDrivers,
  refreshAttritionDashboard,
  type AtRiskDetail,
  type AttritionRateResponse,
  type DepartmentRiskResponse,
  type EmployeeProfileResponse,
  type TopRiskDriversResponse,
} from "@/services/attrition";

type SubView = "trend" | "people" | "reasons" | "departments";

const chartTooltip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" };

export function AttritionPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sub, setSub] = useState<SubView | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({ queryKey: ["attrition", "summary"], queryFn: getAttritionSummary });
  const attritionRateQuery = useQuery({ queryKey: ["attrition", "rate"], queryFn: getAttritionRate, enabled: sub === "trend" });
  const departmentRiskQuery = useQuery({ queryKey: ["attrition", "department-risk"], queryFn: getDepartmentRisk, enabled: sub === "departments" });
  const topRiskDriversQuery = useQuery({ queryKey: ["attrition", "top-risk-drivers"], queryFn: () => getTopRiskDrivers(3), enabled: true });
  const peopleQuery = useQuery({
    queryKey: ["attrition", "people-at-risk"], queryFn: () => getPeopleAtRisk(200), enabled: sub === "people",
  });
  const personQuery = useQuery({
    queryKey: ["attrition", "person", personId], queryFn: () => getPersonAtRiskDetail(personId!), enabled: Boolean(personId),
  });
  const profileQuery = useQuery({
    queryKey: ["attrition", "profile", personId],
    queryFn: () => getEmployeeProfile(personId!),
    enabled: Boolean(personId),
  });
  const refreshMutation = useMutation({
    mutationFn: refreshAttritionDashboard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attrition"] }),
  });
  const summary = summaryQuery.data;
  const topReason = topRiskDriversQuery.data
    ? topRiskDriversQuery.data.drivers.find((driver) => !["other", "Other", "OTHERS"].includes(driver.label.trim())) ?? topRiskDriversQuery.data.top_driver
    : undefined;

  const handleCloseAll = () => {
    setPersonId(null);
    setSub(null);
    onClose();
  };

  return (
    <>
      <CenterPanel
        open={open && !sub && !personId}
        onClose={handleCloseAll}
        onOpenChange={(next) => !next && handleCloseAll()}
        title="Attrition"
        description="Everything about who might leave, why, and who could step in."
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MiniCard
            tint="bg-rose-500/10 text-rose-600 dark:text-rose-400"
            icon={<TrendingUp className="h-5 w-5" />}
            label="Attrition rate"
            headline={attritionRateQuery.data ? `${attritionRateQuery.data.card.value_percent.toFixed(1)}%` : `${attritionOverview.overallRate}%`}
            sub={attritionRateQuery.data ? attritionRateQuery.data.card.supporting_text : `Industry average ${attritionOverview.industryAvg}%`}
            onClick={() => setSub("trend")}
          />
          <MiniCard
            tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            icon={<ShieldAlert className="h-5 w-5" />}
            label="People at risk"
            headline={summary ? `${summary.people_at_risk} people` : "Loading..."}
            sub={summary ? `of ${summary.total_employees} employees - see the list` : "Getting live risk data"}
            onClick={() => setSub("people")}
          />
          <MiniCard
            tint="bg-primary/10 text-primary"
            icon={<Compass className="h-5 w-5" />}
            label="Top reason people leave"
            headline={topReason ? topReason.label : "Loading..."}
            sub={topReason ? `${topReason.share_percent.toFixed(2)}% of model mentions` : "Loading risk drivers"}
            onClick={() => setSub("reasons")}
          />
          <MiniCard
            tint="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            icon={<Network className="h-5 w-5" />}
            label="Department at risk"
            headline="Operations"
            sub="22 people flagged"
            onClick={() => setSub("departments")}
          />
        </div>
        {summaryQuery.isError && <p className="mt-4 text-sm text-destructive">Live risk data unavailable: {summaryQuery.error.message}</p>}
      </CenterPanel>

      <CenterPanel
        open={open && sub === "people" && !personId}
        onClose={handleCloseAll}
        onOpenChange={(next) => !next && handleCloseAll()}
        onBack={() => setSub(null)}
        title="People who might leave"
        description={summary ? `Ranked risk for ${summary.prediction_window.replaceAll("_", " ")}.` : "Ranked by the attrition model."}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{peopleQuery.data ? `${peopleQuery.data.total_matching} people currently match this risk threshold.` : ""}</p>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshMutation.isPending && "animate-spin")} /> Refresh data
          </button>
        </div>
        {refreshMutation.isError && <p className="mb-3 text-xs text-destructive">{refreshMutation.error.message}</p>}
        {peopleQuery.isPending ? (
          <StateMessage>Loading people at risk...</StateMessage>
        ) : peopleQuery.isError ? (
          <StateMessage error>{peopleQuery.error.message}</StateMessage>
        ) : (
          <div className="space-y-3">
            {peopleQuery.data?.employees.map((employee) => (
              <button
                key={employee.employee_id}
                onClick={() => setPersonId(employee.employee_id)}
                className="group w-full rounded-xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20 shadow-xs">
                    {initials(employee.employee_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{employee.employee_name}</div>
                    <div className="text-xs text-muted-foreground">{employee.position_title} · {employee.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{employee.risk_score_percent}%</div>
                    <div className="text-[10px] text-muted-foreground">{employee.position_criticality} criticality</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/5">
                  <div className={cn("h-full rounded-full", riskTone(employee.risk_score_percent))} style={{ width: `${employee.risk_score_percent}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{employee.attrition_factors.join(" · ")}</p>
              </button>
            ))}
          </div>
        )}
      </CenterPanel>

      <PersonPanel
        open={open && Boolean(personId)}
        personId={personId}
        detail={personQuery.data}
        profile={profileQuery.data}
        isLoading={personQuery.isPending}
        isProfileLoading={profileQuery.isPending}
        error={personQuery.isError ? personQuery.error.message : undefined}
        profileError={profileQuery.isError ? profileQuery.error.message : undefined}
        onClose={handleCloseAll}
        onOpenChange={(next) => !next && handleCloseAll()}
        onBack={() => setPersonId(null)}
      />

      <ChartPanel
        open={open && sub === "trend"}
        onClose={handleCloseAll}
        onBack={() => setSub(null)}
        title="Predicted Attrition Rate"
        description="Current workforce distribution based on the attrition prediction model."
      >
        {attritionRateQuery.isPending ? (
          <StateMessage>Loading attrition rate...</StateMessage>
        ) : attritionRateQuery.isError ? (
          <StateMessage error>{attritionRateQuery.error.message}</StateMessage>
        ) : attritionRateQuery.data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border bg-card/70 p-4">
              <div>
                <div className="text-sm font-semibold">{attritionRateQuery.data.card.value_percent.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{attritionRateQuery.data.card.supporting_text}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Prediction window</div>
                <div className="font-medium text-foreground">{attritionRateQuery.data.prediction_window.replaceAll("_", " ")}</div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={attritionRateQuery.data.chart.segments} dataKey="employee_count" nameKey="risk_status" innerRadius={50} outerRadius={90}>
                    {attritionRateQuery.data.chart.segments.map((segment) => (
                      <Cell key={segment.risk_status} fill={segment.risk_status === "At Risk" ? "var(--chart-2)" : "var(--chart-5)"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm">
              {attritionRateQuery.data.chart.segments.map((segment) => (
                <div key={segment.risk_status} className="flex items-center justify-between rounded-lg border bg-card/70 px-3 py-2">
                  <span>{segment.risk_status}</span>
                  <span className="font-medium">{segment.employee_count} ({segment.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{attritionRateQuery.data.interpretation_note}</p>
          </div>
        ) : null}
      </ChartPanel>

      <ChartPanel
        open={open && sub === "reasons"}
        onClose={handleCloseAll}
        onBack={() => setSub(null)}
        title="Why people leave"
        description="The shared model drivers behind the people-at-risk list."
      >
        {topRiskDriversQuery.isPending ? (
          <StateMessage>Loading risk drivers...</StateMessage>
        ) : topRiskDriversQuery.isError ? (
          <StateMessage error>{topRiskDriversQuery.error.message}</StateMessage>
        ) : topRiskDriversQuery.data ? (
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={topRiskDriversQuery.data.chart_segments} dataKey="value" nameKey="label" innerRadius={50} outerRadius={90}>
                    {topRiskDriversQuery.data.chart_segments.map((segment, index) => (
                      <Cell key={segment.label} fill={index === topRiskDriversQuery.data.chart_segments.length - 1 ? "var(--muted-foreground)" : ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {topRiskDriversQuery.data.drivers.map((driver) => (
                <div key={driver.feature_key} className="rounded-lg border bg-card/70 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{driver.label}</span>
                    <span className="text-sm text-muted-foreground">{driver.share_percent.toFixed(2)}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mentioned in {driver.mention_count} model signals · {driver.employee_share_percent.toFixed(2)}% of at-risk employees
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ChartPanel>

      <ChartPanel
        open={open && sub === "departments"}
        onClose={handleCloseAll}
        onBack={() => setSub(null)}
        title="Attrition risk by department"
        description="How many people are currently flagged in each team."
      >
        {departmentRiskQuery.isPending ? (
          <StateMessage>Loading department risk...</StateMessage>
        ) : departmentRiskQuery.isError ? (
          <StateMessage error>{departmentRiskQuery.error.message}</StateMessage>
        ) : departmentRiskQuery.data ? (
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={departmentRiskQuery.data.departments} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="department" width={100} />
                <Tooltip contentStyle={chartTooltip} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} />
                <Bar dataKey="people_at_risk" fill="var(--chart-4)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </ChartPanel>
    </>
  );
}

function PersonPanel({
  open,
  personId,
  detail,
  profile,
  isLoading,
  isProfileLoading,
  error,
  profileError,
  onClose,
  onOpenChange,
  onBack,
}: {
  open: boolean;
  personId: string | null;
  detail?: AtRiskDetail;
  profile?: EmployeeProfileResponse;
  isLoading: boolean;
  isProfileLoading: boolean;
  error?: string;
  profileError?: string;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
}) {
  const employee = detail?.employee;
  return (
    <CenterPanel
      open={open}
      onClose={onClose}
      onOpenChange={onOpenChange}
      onBack={onBack}
      title={employee ? `${employee.employee_name} - ${employee.risk_score_percent}% attrition risk` : "At-risk employee"}
      description={detail ? `Prediction window: ${detail.attrition.prediction_window.replaceAll("_", " ")}` : undefined}
    >
      {isLoading ? (
        <StateMessage>Loading employee risk details...</StateMessage>
      ) : error ? (
        <StateMessage error>{error}</StateMessage>
      ) : (
        detail && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-4">
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground font-bold">Contributing signals</div>
              <ul className="space-y-2 text-sm">
                {detail.attrition.factors.map((factor) => (
                  <li key={factor.feature_key}>
                    <span className="font-semibold text-foreground">{factor.rank}. {factor.label}:</span> {factor.display_value}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-4 shadow-xs">
              <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground font-bold">Employee profile</div>
              {isProfileLoading ? (
                <StateMessage>Loading employee profile...</StateMessage>
              ) : profileError ? (
                <StateMessage error>{profileError}</StateMessage>
              ) : profile ? (
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><div className="text-muted-foreground">Department</div><div className="font-medium">{profile.employee_profile.Department}</div></div>
                  <div><div className="text-muted-foreground">Position</div><div className="font-medium">{profile.employee_profile.Position_Title}</div></div>
                  <div><div className="text-muted-foreground">Employment type</div><div className="font-medium">{profile.employee_profile.Employment_Type}</div></div>
                  <div><div className="text-muted-foreground">Tenure</div><div className="font-medium">{profile.employee_profile.Tenure_Months} months</div></div>
                  <div><div className="text-muted-foreground">Engagement score</div><div className="font-medium">{profile.employee_profile.Engagement_Score}</div></div>
                  <div><div className="text-muted-foreground">Mobility readiness</div><div className="font-medium">{profile.employee_profile.Internal_Mobility_Readiness}</div></div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Profile details unavailable.</p>
              )}
            </section>
            <section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended replacements</div>
              <div className="space-y-3">
                {detail.recommended_replacements.map((replacement) => (
                  <div key={replacement.employee_id} className="text-sm border-b border-border/40 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="font-semibold text-foreground">
                      {replacement.rank}. <Link to="/employee/$employeeId" params={{ employeeId: replacement.employee_id }} className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary transition-colors">{replacement.employee_name}</Link> <span className="text-xs font-normal text-muted-foreground">({replacement.final_score}%)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{replacement.current_position} · {replacement.readiness} · {replacement.qualification_status}</p>
                    <p className="mt-1 text-xs text-foreground/80">{replacement.reasons[0]}</p>
                  </div>
                ))}
              </div>
            </section>
            <p className="text-xs text-muted-foreground">{detail.decision_support_disclaimer}</p>
          </div>
        )
      )}
    </CenterPanel>
  );
}

function ChartPanel({
  open,
  onClose,
  onBack,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <CenterPanel
      open={open}
      onClose={onClose}
      onOpenChange={(next) => !next && onClose()}
      onBack={onBack}
      title={title}
      description={description}
    >
      {children}
    </CenterPanel>
  );
}

function StateMessage({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <p className={cn("rounded-xl border p-5 text-sm", error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-dashed text-muted-foreground")}>{children}</p>;
}

function MiniCard({ tint, icon, label, headline, sub, onClick }: { tint: string; icon: React.ReactNode; label: string; headline: string; sub: string; onClick: () => void }) {
  return <button onClick={onClick} className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"><div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", tint)}>{icon}</div><div className="min-w-0"><div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</div><div className="text-lg font-semibold tracking-tight">{headline}</div><div className="text-xs text-muted-foreground">{sub}</div></div></button>;
}
