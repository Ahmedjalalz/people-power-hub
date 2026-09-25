import React from "react";
import { CheckCircle2, ShieldCheck, AlertCircle, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ServiceCoverageItem } from "@/services/ontology";
import { cn } from "@/lib/utils";

type Props = {
  coverage: Record<string, ServiceCoverageItem>;
  isLoading?: boolean;
};

export function OntologyCoverageView({ coverage, isLoading = false }: Props) {
  const entries = Object.entries(coverage);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI Service Semantic Contract Verification</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Each AI and predictive model contract (Attrition, Headcount, Performance, Scenarios) is explicitly mapped to
              the underlying knowledge graph. This guarantees that all model inferences are backed by verified, tenant-isolated data
              and eliminates hallucination.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Service Coverage Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex h-44 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-40 rounded bg-muted" />
                  <div className="h-5 w-16 rounded bg-muted" />
                </div>
                <div className="h-3 w-48 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted pt-2" />
              </div>
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <ShieldCheck className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-foreground">No Contract Coverage Data</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            No pipeline coverage telemetry reported for the current tenant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {entries.map(([serviceName, item]) => {
          const anyItem = item as Record<string, any>;
          const covered =
            item.covered_fields ??
            anyItem.mapped_paths ??
            anyItem.classified_columns ??
            0;
          const total =
            item.contract_fields ??
            anyItem.explicit_ontology_paths ??
            anyItem.metric_source_or_filter_fields ??
            anyItem.source_columns ??
            (covered || 1);
          const pct =
            item.coverage_percent ?? (total > 0 ? Math.round((covered / total) * 100) : 100);
          const missing = item.missing_paths || item.missing_fields || item.core_unmodeled_columns || [];
          const isFull = pct >= 95;
          const formattedTitle = serviceName
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div
              key={serviceName}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{formattedTitle}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {covered} of {total} contract parameters verified
                    </p>
                  </div>
                  <Badge
                    variant={isFull ? "default" : pct >= 85 ? "secondary" : "destructive"}
                    className="text-xs font-bold"
                  >
                    {pct}% Covered
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isFull
                          ? "bg-emerald-500"
                          : pct >= 85
                            ? "bg-primary"
                            : "bg-amber-500",
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </div>

                {/* Missing / Attention Fields */}
                <div className="mt-5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {missing.length === 0 ? "All Contract Requirements Mapped" : "Semantic Attention Items:"}
                  </span>

                  {missing.length === 0 ? (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>Ready for production AI pipelines and automated workflows.</span>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {missing.map((path) => (
                        <div
                          key={path}
                          className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300"
                        >
                          <AlertCircle className="size-3.5 shrink-0" />
                          <code className="font-mono text-[11px]">{path}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
}
