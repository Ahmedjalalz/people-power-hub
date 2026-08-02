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
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: EmployeePage,
});

function EmployeePage() {
  const { employee } = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-6">
      <Link
        to="/"
        className="group mb-5 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to HR Insights
      </Link>

      <ProfileHeader employee={employee} />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <GaugeCard
            label="Engagement score"
            value={employee.engagementScore}
            hint="How positive their recent survey and activity signals are."
            tint="var(--pastel-teal)"
          />
          <GaugeCard
            label="Manager relationship"
            value={employee.managerRelationshipScore}
            hint="Quality and frequency of manager check-ins."
            tint="var(--pastel-sky)"
          />
        </div>
        <CriticalityCard level={employee.positionCriticality} title={employee.positionTitle} />
      </div>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <InfoGroup title="Role & position" tint="bg-pastel-sky/40" icon={<Layers className="h-4 w-4" />}>
          <InfoRow icon={<IdCard className="h-4 w-4" />} label="Employee ID" value={employee.id} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={employee.department} />
          <InfoRow icon={<Layers className="h-4 w-4" />} label="Position ID" value={employee.positionId} />
          <InfoRow icon={<Sparkles className="h-4 w-4" />} label="Position title" value={employee.positionTitle} />
          <InfoRow icon={<BadgeCheck className="h-4 w-4" />} label="Designation" value={employee.designation} />
          <InfoRow icon={<Gauge className="h-4 w-4" />} label="Job level" value={employee.jobLevel} />
        </InfoGroup>

        <InfoGroup title="How they work" tint="bg-pastel-teal/40" icon={<Laptop className="h-4 w-4" />}>
          <InfoRow icon={<Laptop className="h-4 w-4" />} label="Work mode" value={employee.workMode} />
          <InfoRow icon={<Clock className="h-4 w-4" />} label="Shift type" value={employee.shiftType} />
          <InfoRow icon={<Handshake className="h-4 w-4" />} label="Employment type" value={employee.employmentType} />
          <InfoRow
            icon={<UserRoundCheck className="h-4 w-4" />}
            label="Employee status"
            value={employee.employeeStatus}
          />
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

        <InfoGroup
          title="Mobility & succession"
          tint="bg-pastel-lavender/40"
          icon={<UserRoundCheck className="h-4 w-4" />}
        >
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

        <InfoGroup title="Attrition view" tint="bg-pastel-peach/50" icon={<ShieldAlert className="h-4 w-4" />}>
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
          <p className="mt-2 rounded-xl bg-card/70 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
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
    <div className="relative overflow-hidden rounded-[28px] border bg-card shadow-sm">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(120deg,var(--pastel-teal),var(--pastel-sky)_45%,var(--pastel-lavender))] opacity-70"
      />
      <div
        aria-hidden
        className="blob pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-pastel-mint opacity-50 blur-3xl"
      />
      <div className="relative px-6 pb-6 pt-14 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-card text-2xl font-semibold shadow-md ring-4 ring-card">
              <span className="grid h-[84px] w-[84px] place-items-center rounded-2xl bg-pastel-teal">
                {initials(employee.name)}
              </span>
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-3xl font-semibold tracking-tight">{employee.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {employee.designation} · {employee.department} · Level {employee.jobLevel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
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

        <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
          <QuickFact label="Tenure" value={`${employee.tenureMonths} mo`} />
          <QuickFact label="In company" value={`${employee.yearsInCompany} yrs`} />
          <QuickFact label="Shift" value={employee.shiftType} />
          <QuickFact label="Employment" value={employee.employmentType} />
        </div>
      </div>
    </div>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Pill({ children, tint }: { children: ReactNode; tint: string }) {
  return (
    <span className={cn("rounded-full px-3 py-1 font-medium shadow-sm", tint)}>{children}</span>
  );
}

function GaugeCard({
  label,
  value,
  hint,
  tint,
}: {
  label: string;
  value: number;
  hint: string;
  tint: string;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  return (
    <div className="group rounded-3xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
            <circle cx="44" cy="44" r={radius} fill="none" strokeWidth="10" className="stroke-foreground/8" />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke={tint}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-xl font-semibold">{value}</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
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
    <div className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm">
      <div
        aria-hidden
        className={cn("pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-60", tint)}
      />
      <div className="relative">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Position criticality
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold">{level}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", tint)}>
            {level === "High" ? "Protect this role" : level === "Medium" ? "Plan ahead" : "Low impact"}
          </span>
        </div>
        <div className="mt-4 flex gap-1.5">
          {steps.map((step) => (
            <div
              key={step}
              className={cn(
                "h-2.5 flex-1 rounded-full",
                steps.indexOf(step) <= steps.indexOf(level) ? tint : "bg-foreground/8",
              )}
            />
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{title}</span> — {copy}
        </p>
      </div>
    </div>
  );
}

function InfoGroup({
  title,
  tint,
  icon,
  children,
}: {
  title: string;
  tint: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-3xl border p-5 shadow-sm", tint)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-card/80 text-foreground/70 shadow-sm">
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card/75 px-3 py-2.5 text-sm transition-colors hover:bg-card">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
