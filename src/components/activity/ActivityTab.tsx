import { useState, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  ArrowUpRight,
  Sparkles,
  RotateCcw,
  Building2,
  Tag,
  FileText,
  ChevronRight,
  ShieldAlert,
  Coins,
  Gavel,
  UserPlus,
  UserMinus,
  Network,
  CalendarDays,
  ArrowLeftRight,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useActivityLog,
  resetActivityLogsToDefault,
  clearActivityLogs,
  type ActivityLogEntry,
} from "@/lib/activity-store";
import { useBackendActivity, PROCESS_CODE_TO_CARD_ID } from "@/lib/action-center-api";
import { employees } from "@/lib/employees";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Compensation: Coins,
  Discipline: Gavel,
  Entry: UserPlus,
  Exit: UserMinus,
  "Job Architecture": Network,
  "Leave & Absence": CalendarDays,
  Movement: ArrowLeftRight,
  Other: HelpCircle,
};

const PROCESS_METADATA: Record<string, { title: string; category: string }> = {
  PROB_CONFIRM: { title: "Probation Confirmation", category: "Entry" },
  PROB_EXTEND: { title: "Probation Extension", category: "Entry" },
  CONTRACT_RENEW: { title: "Contract Renewal / Extension", category: "Entry" },
  REHIRE: { title: "Rejoining / Rehire", category: "Entry" },
  PROMOTION: { title: "Promotion", category: "Movement" },
  TRANSFER: { title: "Transfer", category: "Movement" },
  ACTING_CHARGE: { title: "Acting / Additional Charge", category: "Movement" },
  DEMOTION: { title: "Demotion", category: "Movement" },
  SECONDMENT: { title: "Deputation / Secondment", category: "Movement" },
  CONTRACT_END: { title: "Contract End / Non-renewal", category: "Exit" },
  FINAL_SETTLEMENT: { title: "Final Settlement", category: "Exit" },
  RESIGNATION: { title: "Resignation", category: "Exit" },
  RETIREMENT: { title: "Retirement", category: "Exit" },
  TERMINATION: { title: "Termination / Dismissal", category: "Exit" },
  RESIGN_WITHDRAW: { title: "Resignation Withdrawal", category: "Other" },
};

export function ActivityTab() {
  const localActivities = useActivityLog();
  const { events: backendEvents, isLoading: isBackendLoading, refresh: refreshBackend } =
    useBackendActivity(250);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [detailEntry, setDetailEntry] = useState<ActivityLogEntry | null>(null);

  // Blend local and live backend audit events
  const activities = useMemo(() => {
    const backendMapped: ActivityLogEntry[] = backendEvents.map((evt) => {
      const meta = PROCESS_METADATA[evt.Process_Code] || {
        title: evt.Process_Code,
        category: "Movement",
      };
      const emp = employees.find((e) => e.id === evt.Employee_ID);
      const empName = emp ? emp.name : evt.Employee_ID;
      const deptName = emp ? emp.department : "Operations";

      return {
        id: evt.Event_ID,
        actionId: PROCESS_CODE_TO_CARD_ID[evt.Process_Code] || evt.Process_Code.toLowerCase(),
        actionTitle: meta.title,
        category: meta.category as any,
        employeeName: empName,
        employeeId: evt.Employee_ID,
        department: deptName,
        summary: evt.Effect || evt.Note || `Action record ${evt.Action_Record_ID}`,
        notes: evt.Note,
        status: evt.New_Status === "SCHEDULED" ? "Pending Approval" : "Completed",
        performedBy: evt.Performed_By_Name || "System / HR",
        timestamp: evt.Event_DateTime
          ? new Date(evt.Event_DateTime).toISOString()
          : new Date().toISOString(),
        tintClass: "bg-pastel-sky",
        tintVar: "--pastel-sky",
      };
    });

    // Return deduplicated, local actions first
    const seenIds = new Set<string>();
    const merged: ActivityLogEntry[] = [];

    for (const act of localActivities) {
      if (!seenIds.has(act.id)) {
        seenIds.add(act.id);
        merged.push(act);
      }
    }
    for (const act of backendMapped) {
      if (!seenIds.has(act.id)) {
        seenIds.add(act.id);
        merged.push(act);
      }
    }

    return merged;
  }, [localActivities, backendEvents]);

  const categories = useMemo(() => {
    const set = new Set(activities.map((a) => a.category));
    return Array.from(set);
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Category filter
      if (selectedCategory !== "all" && act.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && act.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.actionTitle.toLowerCase().includes(q);
        const matchesEmployee = act.employeeName.toLowerCase().includes(q);
        const matchesDept = act.department?.toLowerCase().includes(q);
        const matchesSummary = act.summary.toLowerCase().includes(q);
        const matchesPerformer = act.performedBy.toLowerCase().includes(q);
        return matchesTitle || matchesEmployee || matchesDept || matchesSummary || matchesPerformer;
      }
      return true;
    });
  }, [activities, selectedCategory, selectedStatus, searchQuery]);

  // Metric counts
  const totalCount = activities.length;
  const completedCount = activities.filter((a) => a.status === "Completed").length;
  const pendingCount = activities.filter((a) => a.status === "Pending Approval").length;
  const reviewCount = activities.filter((a) => a.status === "In Review").length;

  return (
    <div className="space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-pastel-teal/70 px-3 py-1 text-xs font-medium text-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span>Audit & Change History</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Activity Log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Continuous audit log tracking operational actions, approvals, and changes made through the Action Center.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshBackend()}
            disabled={isBackendLoading}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            title="Fetch latest audit logs from backend"
          >
            <RotateCcw className={cn("h-3.5 w-3.5", isBackendLoading && "animate-spin")} />
            <span>Sync Live</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetActivityLogsToDefault}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Reset to initial sample operations"
          >
            Reset Samples
          </Button>
          {activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearActivityLogs}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Clear Log
            </Button>
          )}
        </div>
      </div>

      {/* ── Quick KPI Metric Badges ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Operations</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          {isBackendLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalCount}</div>
          )}
          <span className="text-[11px] text-muted-foreground">All logged HR actions</span>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          {isBackendLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{completedCount}</div>
          )}
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Processed & active</span>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pending Approval</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          {isBackendLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{pendingCount}</div>
          )}
          <span className="text-[11px] text-amber-600 dark:text-amber-400">Awaiting supervisor</span>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-all hover:border-sky-500/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Under Review</span>
            <AlertCircle className="h-4 w-4 text-sky-500" />
          </div>
          {isBackendLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{reviewCount}</div>
          )}
          <span className="text-[11px] text-sky-600 dark:text-sky-400">Inquiry & committees</span>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/25 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by action, employee, department, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 bg-background text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Select */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 w-[160px] bg-background text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-9 w-[150px] bg-background text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Activity Timeline List ── */}
      {isBackendLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2.5 py-10 text-xs text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading live activity audit feed...</span>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border bg-card p-4 sm:p-5 animate-pulse">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">No activities found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
              ? "No recorded events match the selected filter criteria."
              : "No action center operations have been logged yet. Use the Action Center tab to trigger operational changes."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetActivityLogsToDefault}
            className="mt-4"
          >
            Load Sample Logs
          </Button>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline decorative line */}
          <div className="absolute left-[27px] top-6 bottom-6 w-px bg-border/60 hidden sm:block pointer-events-none" />

          {filteredActivities.map((act) => {
            const IconComponent = CATEGORY_ICONS[act.category] || Activity;
            let relativeTime = "Just now";
            try {
              relativeTime = formatDistanceToNow(new Date(act.timestamp), { addSuffix: true });
            } catch {
              // fallback
            }

            return (
              <div
                key={act.id}
                style={{ ["--tile" as string]: `var(${act.tintVar})` }}
                className={cn(
                  "group relative flex flex-col sm:flex-row items-start gap-4 rounded-xl border bg-card p-4 sm:p-5 transition-all duration-200",
                  "hover:shadow-[0_12px_24px_-12px_color-mix(in_oklab,var(--tile)_50%,transparent)]",
                  "hover:border-primary/40 hover:-translate-y-0.5"
                )}
              >
                {/* Icon node on timeline */}
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105",
                    act.tintClass
                  )}
                >
                  <IconComponent className="h-5 w-5 text-foreground/85" />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Action Title & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {act.actionTitle}
                      </h4>
                      <Badge variant="outline" className="text-[11px] font-normal border-border/70">
                        {act.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-[11px] font-medium shadow-none",
                          act.status === "Completed" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30",
                          act.status === "Pending Approval" && "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30",
                          act.status === "In Review" && "bg-sky-500/15 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20 border-sky-500/30",
                          act.status === "Scheduled" && "bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 border-purple-500/30"
                        )}
                      >
                        {act.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap" title={format(new Date(act.timestamp), "PPpp")}>
                        {relativeTime}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {act.summary}
                  </p>

                  {/* Metadata Banner: Employee, Department, Effective Date */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{act.employeeName}</span>
                      {act.employeeId && (
                        <span className="text-muted-foreground font-normal">({act.employeeId})</span>
                      )}
                    </div>

                    {act.department && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{act.department}</span>
                      </div>
                    )}

                    {act.effectiveDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Effective: {act.effectiveDate}</span>
                      </div>
                    )}

                    <div className="ml-auto text-[11px] text-muted-foreground/80 italic">
                      Logged by {act.performedBy}
                    </div>
                  </div>

                  {act.notes && (
                    <div className="mt-2 rounded-lg bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">Notes: </span>
                      {act.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
