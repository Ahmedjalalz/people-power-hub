import { Skeleton } from "@/components/ui/skeleton";

export interface WorkflowMetricsData {
  allTime: number;
  last30Days: number;
  lastPerformed: string;
  onSave: string;
  fieldCount: number;
}

export function WorkflowMetricCards({
  metrics,
  isLoading,
  allTimeLabel = "Historical records logged",
  last30DaysLabel = "Recorded in past 30 days",
  lastPerformedLabel = "Execution status / time",
}: {
  metrics: WorkflowMetricsData;
  isLoading: boolean;
  allTimeLabel?: string;
  last30DaysLabel?: string;
  lastPerformedLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {/* Metric 1 */}
      <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          RECORDED · ALL TIME
        </div>
        {isLoading ? (
          <Skeleton className="mt-2 h-8 w-16" />
        ) : (
          <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {metrics.allTime}
          </div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">{allTimeLabel}</div>
      </div>

      {/* Metric 2 */}
      <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          LAST 30 DAYS
        </div>
        {isLoading ? (
          <Skeleton className="mt-2 h-8 w-16" />
        ) : (
          <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {metrics.last30Days}
          </div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">{last30DaysLabel}</div>
      </div>

      {/* Metric 3 */}
      <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          LAST PERFORMED
        </div>
        {isLoading ? (
          <Skeleton className="mt-2 h-6 w-24" />
        ) : (
          <div
            className="mt-2 text-base font-semibold text-foreground truncate"
            title={metrics.lastPerformed}
          >
            {metrics.lastPerformed}
          </div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">{lastPerformedLabel}</div>
      </div>

      {/* Metric 4 */}
      <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          ON SAVE
        </div>
        {isLoading ? (
          <Skeleton className="mt-2 h-5 w-28" />
        ) : (
          <div className="mt-2 text-sm font-semibold text-foreground">
            {metrics.onSave}
          </div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-3 w-20 inline-block" />
          ) : (
            `${metrics.fieldCount} form fields configured`
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkflowRecordsLoading({
  message = "Loading live records...",
  description = "Fetching operational records and audit history from workforce service.",
}: {
  message?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border bg-card/60 p-12 text-center animate-in fade-in-50 duration-200">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <h3 className="mt-4 text-base font-semibold text-foreground">{message}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

export function WorkflowActionCount({
  count,
  isLoading,
}: {
  count: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
        <span>Loading actions...</span>
      </span>
    );
  }

  return (
    <span>
      <strong className="text-foreground font-semibold">{count}</strong>{" "}
      {count === 1 ? "action" : "actions"} recorded
    </span>
  );
}
