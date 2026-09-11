import type { ReactNode } from "react";
import { AlertTriangle, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  subtitle,
  tint = "bg-pastel-sky",
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  tint?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", tint)} />
            <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
          </div>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function AsyncState({
  isPending,
  error,
  isEmpty,
  emptyLabel = "Nothing to show yet.",
  children,
  height = "h-40",
}: {
  isPending: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
  height?: string;
}) {
  if (isPending) {
    return (
      <div className={cn("grid place-items-center rounded-lg bg-muted/40 text-xs text-muted-foreground", height)}>
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cn("grid place-items-center rounded-lg bg-pastel-rose/50 p-4 text-center text-xs", height)}>
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error instanceof Error ? error.message : "Could not load this section."}
        </span>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className={cn("grid place-items-center rounded-lg bg-muted/40 text-xs text-muted-foreground", height)}>
        <span className="flex items-center gap-2">
          <Inbox className="h-4 w-4" /> {emptyLabel}
        </span>
      </div>
    );
  }
  return <>{children}</>;
}

export function StatTile({
  label,
  value,
  hint,
  tint = "bg-card border-border/80",
}: {
  label: string;
  value: string;
  hint?: string;
  tint?: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4 shadow-xs transition-all hover:shadow-sm", tint)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function bandTint(band?: string) {
  const value = (band ?? "").toLowerCase();
  if (value.includes("exceptional"))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60";
  if (value.includes("strong"))
    return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60";
  if (value.includes("meets") && !value.includes("partial"))
    return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60";
  if (value.includes("partial"))
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60";
  if (value.includes("improvement"))
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60";
  return "bg-muted text-muted-foreground border border-border";
}

export function trendTint(trend?: string) {
  const value = (trend ?? "").toLowerCase();
  if (value.includes("improv"))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60";
  if (value.includes("declin"))
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60";
  return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60";
}

export function num(value: unknown, digits = 1): string {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? (digits === 0 ? String(Math.round(parsed)) : parsed.toFixed(digits)) : "—";
}
