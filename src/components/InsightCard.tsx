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
        "group relative flex h-[290px] flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 text-left transition-all duration-300 cursor-pointer",
        "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/40 active:translate-y-0",
        className,
      )}
    >
      <div className="card-glow" />
      <div
        aria-hidden
        className="blob pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `var(${tintVar})` }}
      />
      <div className="relative mb-3 flex items-center justify-between">
        <div className={cn("icon-tile", tint)}>{icon}</div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground" />
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
  return <div className={cn("mt-4 rounded-lg p-4 text-sm", tint)}>{children}</div>;
}
