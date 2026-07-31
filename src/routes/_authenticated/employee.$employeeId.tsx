import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  Clock,
  Gauge,
  Handshake,
  IdCard,
  Layers,
  Laptop,
  MapPin,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { employeeById, initials, type Criticality, type Employee } from "@/lib/employees";

export const Route = createFileRoute("/_authenticated/employee/$employeeId")({
  loader: ({ params }) => {
    const employee = employeeById(params.employeeId);
    if (!employee) throw notFound();
    return { employee };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.employee.name} — Employee profile` : "Employee profile";
    return {
      meta: [
        { title },
        { name: "description", content: "Employee profile, position criticality and attrition signals." },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Employee profile, position criticality and attrition signals.",
        },
      ],
    };
  },
  component: EmployeePage,
});

function EmployeePage() {
  const { employee } = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to HR Insights
      </Link>

      <ProfileHeader employee={employee} />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ScoreCard
          tint="bg-pastel-teal"
          label="Engagement score"
          value={employee.engagementScore}
          hint="How positive their recent survey and activity signals are."
        />
        <ScoreCard
          tint="bg-pastel-sky"
          label="Manager relationship"
          value={employee.managerRelationshipScore}
          hint="Quality and frequency of manager check-ins."
        />
        <CriticalityCard level={employee.positionCriticality} title={employee.positionTitle} />
      </div>

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <InfoGroup title="Role & position" tint="bg-pastel-sky/50">
          <InfoRow icon={<IdCard className="h-4 w-4" />} label="Employee ID" value={employee.id} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={employee.department} />
          <InfoRow icon={<Layers className="h-4 w-4" />} label="Position ID" value={employee.positionId} />
          <InfoRow icon={<Sparkles className="h-4 w-4" />} label="Position title" value={employee.positionTitle} />
          <InfoRow icon={<BadgeCheck className="h-4 w-4" />} label="Designation" value={employee.designation} />
          <InfoRow icon={<Gauge className="h-4 w-4" />} label="Job level" value={employee.jobLevel} />
        </InfoGroup>

        <InfoGroup title="How they work" tint="bg-pastel-teal/50">
          <InfoRow icon={<Laptop className="h-4 w-4" />} label="Work mode" value={employee.workMode} />
          <InfoRow icon={<Clock className="h-4 w-4" />} label="Shift type" value={employee.shiftType} />
          <InfoRow icon={<Handshake className="h-4 w-4" />} label="Employment type" value={employee.employmentType} />
          <InfoRow icon={<UserRoundCheck className="h-4 w-4" />} label="Employee status" value={employee.employeeStatus} />
          <InfoRow
            icon={<CalendarClock className="h-4 w-4" />}
            label="Tenure"
            value={`${employee.tenureMonths} months`}
          />
          <InfoRow
            icon={<CalendarClock className="h-4 w-4" />}
            label="Years in company"
            value={`${employee.yearsInCompany} years`}
          />
        </InfoGroup>

        <InfoGroup title="Mobility & succession" tint="bg-pastel-lavender/50">
          <InfoRow
            icon={<UserRoundCheck className="h-4 w-4" />}
            label="Candidate base eligibility"
            value={employee.candidateBaseEligibility}
          />
          <InfoRow
            icon={<Sparkles className="h-4 w-4" />}
            label="Internal mobility readiness"
            value={employee.internalMobilityReadiness}
          />
          <InfoRow
            icon={<MapPin className="h-4 w-4" />}
            label="Vacancy planning status"
            value={employee.vacancyPlanningStatus}
          />
          <InfoRow icon={<IdCard className="h-4 w-4" />} label="Reference" value={employee.reference} />
        </InfoGroup>

        <InfoGroup title="Attrition view" tint="bg-pastel-peach/60">
          <InfoRow
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Attrition label"
            value={employee.attritionLabel}
          />
          {typeof employee.riskScore === "number" && (
            <>
              <InfoRow
                icon={<Gauge className="h-4 w-4" />}
                label="Model risk score"
                value={`${employee.riskScore}%`}
              />
              <InfoRow
                icon={<CalendarClock className="h-4 w-4" />}
                label="Likely window"
                value={employee.timeframe ?? "—"}
              />
            </>
          )}
          <p className="pt-2 text-sm text-muted-foreground">
            {employee.riskSummary ??
              "No active attrition signals. This person looks settled in their current role."}
          </p>
        </InfoGroup>
      </section>
    </main>
  );
}

function ProfileHeader({ employee }: { employee: Employee }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-6">
      <div
        aria-hidden
        className="blob pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pastel-teal opacity-50 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-pastel-teal text-2xl font-semibold">
          {initials(employee.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{employee.name}</h1>
          <p className="text-muted-foreground">
            {employee.designation} · {employee.department} · {employee.jobLevel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Pill tint="bg-pastel-sky">{employee.id}</Pill>
            <Pill tint="bg-pastel-mint">{employee.employeeStatus}</Pill>
            <Pill tint="bg-pastel-lavender">{employee.workMode}</Pill>
            <Pill
              tint={
                employee.attritionLabel === "High risk"
                  ? "bg-pastel-peach"
                  : employee.attritionLabel === "Medium risk"
                    ? "bg-pastel-yellow"
                    : "bg-pastel-mint"
              }
            >
              {employee.attritionLabel}
            </Pill>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, tint }: { children: ReactNode; tint: string }) {
  return <span className={cn("rounded-full px-3 py-1 font-medium", tint)}>{children}</span>;
}

function ScoreCard({
  tint,
  label,
  value,
  hint,
}: {
  tint: string;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-foreground/5">
        <div className={cn("h-full rounded-full", tint)} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function CriticalityCard({ level, title }: { level: Criticality; title: string }) {
  const steps: Criticality[] = ["Low", "Medium", "High"];
  const tint = level === "High" ? "bg-pastel-peach" : level === "Medium" ? "bg-pastel-yellow" : "bg-pastel-mint";
  const copy =
    level === "High"
      ? "Hard to backfill quickly — losing this person would disrupt delivery."
      : level === "Medium"
        ? "Replaceable with some planning and a short handover."
        : "Low disruption if this role becomes vacant.";
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Position criticality
      </div>
      <div className="text-2xl font-semibold">{level}</div>
      <div className="mt-3 flex gap-1.5">
        {steps.map((step) => (
          <div
            key={step}
            className={cn(
              "h-2.5 flex-1 rounded-full",
              steps.indexOf(step) <= steps.indexOf(level) ? tint : "bg-foreground/5",
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {title} — {copy}
      </p>
    </div>
  );
}

function InfoGroup({ title, tint, children }: { title: string; tint: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border p-5", tint)}>
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card/70 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
