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
    <section className={cn("rounded-2xl border bg-card p-4", className)}>
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
      <div className={cn("grid place-items-center rounded-xl bg-muted/40 text-xs text-muted-foreground", height)}>
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cn("grid place-items-center rounded-xl bg-pastel-rose/50 p-4 text-center text-xs", height)}>
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error instanceof Error ? error.message : "Could not load this section."}
        </span>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className={cn("grid place-items-center rounded-xl bg-muted/40 text-xs text-muted-foreground", height)}>
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
  tint = "bg-pastel-teal",
}: {
  label: string;
  value: string;
  hint?: string;
  tint?: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-4", tint)}>
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-foreground/60">{hint}</div>}
    </div>
  );
}

export function bandTint(band?: string) {
  const value = (band ?? "").toLowerCase();
  if (value.includes("exceptional")) return "bg-pastel-mint";
  if (value.includes("strong")) return "bg-pastel-teal";
  if (value.includes("meets") && !value.includes("partial")) return "bg-pastel-sky";
  if (value.includes("partial")) return "bg-pastel-yellow";
  if (value.includes("improvement")) return "bg-pastel-peach";
  return "bg-muted";
}

export function trendTint(trend?: string) {
  const value = (trend ?? "").toLowerCase();
  if (value.includes("improv")) return "bg-pastel-mint";
  if (value.includes("declin")) return "bg-pastel-rose";
  return "bg-pastel-blue";
}

export function num(value: unknown, digits = 1): string {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? (digits === 0 ? String(Math.round(parsed)) : parsed.toFixed(digits)) : "—";
}
