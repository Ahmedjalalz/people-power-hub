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
import { getEmployeeProfile, type EmployeeProfileResponse } from "@/services/attrition";

function buildEmployeeFromProfile(profile: EmployeeProfileResponse, fallbackId: string): Employee {
  const profileData = profile.employee_profile;
  return {
    id: profileData.Employee_ID || fallbackId,
    name: profileData.Employee_Name,
    department: profileData.Department,
    positionId: profileData.Position_ID,
    positionTitle: profileData.Position_Title,
    designation: profileData.Designation,
    jobLevel: profileData.Job_Level,
    workMode: profileData.Work_Mode === "Onsite" ? "On-site" : profileData.Work_Mode === "Remote" ? "Remote" : "Hybrid",
    shiftType: profileData.Shift_Type as Employee["shiftType"],
    employmentType: profileData.Employment_Type === "Contract" ? "Contract" : profileData.Employment_Type === "Part-time" ? "Part-time" : "Permanent",
    employeeStatus: profileData.Employee_Status === "Active" ? "Active" : profileData.Employee_Status === "On Leave" ? "On Leave" : "Notice Period",
    tenureMonths: profileData.Tenure_Months,
    yearsInCompany: profileData.Years_in_Company,
    engagementScore: profileData.Engagement_Score,
    managerRelationshipScore: profileData.Manager_Relationship_Score,
    candidateBaseEligibility: profileData.Candidate_Base_Eligibility === "Conditional" ? "Conditional" : profileData.Candidate_Base_Eligibility === "Eligible" ? "Eligible" : "Not eligible",
    internalMobilityReadiness: profileData.Internal_Mobility_Readiness === "Ready Now" ? "Ready now" : profileData.Internal_Mobility_Readiness === "Developing" ? "Developing" : "Not ready",
    attritionLabel: profileData.Attrition_Label_Reference === "Yes" ? "High risk" : profileData.Attrition_Label_Reference === "No" ? "Stable" : "Medium risk",
    reference: profileData.Vacancy_Planning_Status,
    vacancyPlanningStatus: profileData.Vacancy_Planning_Status === "Backfill approved" ? "Backfill approved" : profileData.Vacancy_Planning_Status === "Planning in progress" ? "Planning in progress" : "Not planned",
    positionCriticality: profile.position_criticality === "High" ? "High" : profile.position_criticality === "Medium" ? "Medium" : "Low",
    riskScore: profile.attrition_context.risk_score_percent,
    riskSummary: `${profile.attrition_context.status} · ${profile.attrition_context.prediction_window.replaceAll("_", " ")}`,
    timeframe: profile.attrition_context.prediction_window.replaceAll("_", " "),
    signals: [],
  };
}

export const Route = createFileRoute("/_authenticated/employee/$employeeId")({
  loader: async ({ params }) => {
    const employee = employeeById(params.employeeId);
    if (employee) return { employee };

    try {
      const profile = await getEmployeeProfile(params.employeeId);
      return { employee: buildEmployeeFromProfile(profile, params.employeeId) };
    } catch {
      throw notFound();
    }
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
        to="/employees"
        className="group mb-5 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Employees
      </Link>

      <ProfileHeader employee={employee} />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <GaugeCard
            label="Engagement score"
            value={employee.engagementScore}
            hint="How positive their recent survey and activity signals are."
            tint="var(--primary)"
          />
          <GaugeCard
            label="Manager relationship"
            value={employee.managerRelationshipScore}
            hint="Quality and frequency of manager check-ins."
            tint="var(--color-viz-2)"
          />
        </div>
        <CriticalityCard level={employee.positionCriticality} title={employee.positionTitle} />
      </div>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <InfoGroup title="Role & position" tint="" icon={<Layers className="h-4 w-4" />}>
          <InfoRow icon={<IdCard className="h-4 w-4" />} label="Employee ID" value={employee.id} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={employee.department} />
          <InfoRow icon={<Layers className="h-4 w-4" />} label="Position ID" value={employee.positionId} />
          <InfoRow icon={<Sparkles className="h-4 w-4" />} label="Position title" value={employee.positionTitle} />
          <InfoRow icon={<BadgeCheck className="h-4 w-4" />} label="Designation" value={employee.designation} />
          <InfoRow icon={<Gauge className="h-4 w-4" />} label="Job level" value={employee.jobLevel} />
        </InfoGroup>

        <InfoGroup title="How they work" tint="" icon={<Laptop className="h-4 w-4" />}>
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
          tint=""
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

        <InfoGroup title="Attrition view" tint="" icon={<ShieldAlert className="h-4 w-4" />}>
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
          <p className="mt-2 rounded-xl bg-card/70 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground border border-border/60">
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
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xs">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-border/40"
      />
      <div
        aria-hidden
        className="blob pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 opacity-40 blur-3xl"
      />
      <div className="relative px-6 pb-6 pt-14 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-card text-2xl font-bold shadow-md ring-4 ring-card">
              <span className="grid h-[84px] w-[84px] place-items-center rounded-full bg-primary/10 text-primary border border-primary/20">
                {initials(employee.name)}
              </span>
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">{employee.name}</h1>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                {employee.designation} · {employee.department} · Level {employee.jobLevel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Pill tint="bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">{employee.id}</Pill>
            <Pill tint="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">{employee.employeeStatus}</Pill>
            <Pill tint="bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">{employee.workMode}</Pill>
            <Pill
              tint={
                employee.attritionLabel === "High risk"
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                  : employee.attritionLabel === "Medium risk"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
              }
            >
              {employee.attritionLabel}
            </Pill>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/80 pt-4 sm:grid-cols-4">
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
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Pill({ children, tint }: { children: ReactNode; tint: string }) {
  return (
    <span className={cn("rounded-full px-3 py-1 font-semibold shadow-xs", tint)}>{children}</span>
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
    <div className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
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

const CRITICALITY_CONFIG: Record<Criticality, { badge: string; bar: string; glow: string; text: string }> = {
  High: {
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
    bar: "bg-rose-500",
    glow: "bg-rose-500/20",
    text: "Protect this role",
  },
  Medium: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
    bar: "bg-amber-500",
    glow: "bg-amber-500/20",
    text: "Plan ahead",
  },
  Low: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
    bar: "bg-emerald-500",
    glow: "bg-emerald-500/20",
    text: "Low impact",
  },
};

function CriticalityCard({ level, title }: { level: Criticality; title: string }) {
  const steps: Criticality[] = ["Low", "Medium", "High"];
  const config = CRITICALITY_CONFIG[level] || CRITICALITY_CONFIG.Low;
  const copy =
    level === "High"
      ? "Hard to backfill quickly — losing this person would disrupt delivery."
      : level === "Medium"
        ? "Replaceable with some planning and a short handover."
        : "Low disruption if this role becomes vacant.";
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
      <div
        aria-hidden
        className={cn("pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-60", config.glow)}
      />
      <div className="relative">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Position criticality
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold">{level}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", config.badge)}>
            {config.text}
          </span>
        </div>
        <div className="mt-4 flex gap-1.5">
          {steps.map((step) => (
            <div
              key={step}
              className={cn(
                "h-2.5 flex-1 rounded-full transition-all duration-300",
                steps.indexOf(step) <= steps.indexOf(level) ? config.bar : "bg-foreground/8",
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
  tint?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-md", tint)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shadow-xs">
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3.5 py-2 text-xs transition-colors hover:bg-muted/70">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="flex-1 font-medium text-muted-foreground">{label}</span>
      <span className="text-right font-bold text-foreground">{value}</span>
    </div>
  );
}
