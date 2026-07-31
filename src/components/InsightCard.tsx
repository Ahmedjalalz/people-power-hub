import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function InsightCard({
  tint,
  tintVar,
  icon,
  label,
  headline,
  sub,
  visual,
  onClick,
  className,
}: {
  tint: string;
  tintVar: string;
  icon: ReactNode;
  label: string;
  headline: string;
  sub: string;
  visual: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ ["--tile" as string]: `var(${tintVar})` }}
      className={cn(
        "group relative flex h-[280px] flex-col overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all",
        "hover:shadow-[0_20px_40px_-24px_color-mix(in_oklab,var(--tile)_70%,transparent)]",
        "hover:-translate-y-0.5 hover:border-primary/40",
        className,
      )}
    >
      <div className="card-glow" />
      <div
        aria-hidden
        className="blob pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: `var(${tintVar})` }}
      />
      <div className="relative mb-3 flex items-center justify-between">
        <div className={cn("icon-tile", tint)}>{icon}</div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div className="relative mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="relative text-2xl font-semibold tracking-tight">{headline}</div>
      <div className="relative mb-4 text-xs text-muted-foreground">{sub}</div>
      <div className="relative mt-auto">{visual}</div>
    </button>
  );
}

export function Callout({ children, tint }: { children: ReactNode; tint: string }) {
  return <div className={cn("mt-4 rounded-xl p-4 text-sm", tint)}>{children}</div>;
}
