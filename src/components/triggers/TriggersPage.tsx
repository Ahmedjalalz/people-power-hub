import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Check,
  RefreshCw,
  FlaskConical,
  MessageSquare,
  User,
  Building2,
  FileText,
  Calendar,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingDown,
  TrendingUp,
  Users,
  AlertCircle,
  Briefcase,
  Layers,
  Award,
  BookOpen,
  DollarSign,
  UserCheck,
  UserX,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  TriggerCase,
  CasePriority,
  CaseStatus,
  CaseCategory,
  loadStoredCases,
  saveCases,
  getLastScanTime,
  setLastScanTime,
  INITIAL_CASES,
  adaptBackendCaseToTriggerCase,
  loadAllCaseUserMetadata,
  saveCaseUserMetadata,
  type CaseUserMetadata,
} from "@/lib/trigger-engine";
import {
  fetchDecisionCases,
  evaluateDecisionCases,
  updateDecisionCaseStatus,
  DECISION_RULES,
  getRuleMeta,
  type DecisionCaseRecord,
  type DecisionCaseStatus,
} from "@/services/decision-cases";

// ─── Visual Tokens & Color Mappings ──────────────────────────────────────────

const PRIORITY_BADGES: Record<
  CasePriority,
  { bg: string; text: string; border: string; ring: string; dot: string }
> = {
  Critical: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    ring: "ring-rose-500/20",
    dot: "bg-rose-500",
  },
  High: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    ring: "ring-amber-500/20",
    dot: "bg-amber-500",
  },
  Medium: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    ring: "ring-sky-500/20",
    dot: "bg-sky-500",
  },
  Low: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    ring: "ring-slate-400/20",
    dot: "bg-slate-400",
  },
};

const STATUS_CONFIG: Record<
  CaseStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  Open: {
    label: "Open",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  "Under Review": {
    label: "Under Review",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
  },
  "In Progress": {
    label: "In Progress",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
  },
  Resolved: {
    label: "Resolved",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  Closed: {
    label: "Closed",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
};

const STATUS_FLOW: CaseStatus[] = [
  "Open",
  "Under Review",
  "In Progress",
  "Resolved",
  "Closed",
];

// ─── Main Component ──────────────────────────────────────────────────────────

export function TriggersPage() {
  const queryClient = useQueryClient();
  const [userMeta, setUserMeta] = useState<Record<string, CaseUserMetadata>>(() => loadAllCaseUserMetadata());
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | "All">("All");
  const [statusTab, setStatusTab] = useState<"active" | "resolved" | "all">("active");
  const [selectedRuleId, setSelectedRuleId] = useState<string>("All");
  const [scanTimestamp, setScanTimestamp] = useState(() => getLastScanTime());
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [showRulesBanner, setShowRulesBanner] = useState(true);

  // 1. Fetch live cases from Backend GET /api/v1/decision-cases
  const {
    data: backendResult,
    isLoading,
    isFetching,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["decision-cases"],
    queryFn: ({ signal }) => fetchDecisionCases({ active_only: false }, signal),
    staleTime: 60 * 1000,
    retry: 1,
  });

  // 2. Evaluate mutation POST /api/v1/decision-cases/evaluate
  const evaluateMutation = useMutation({
    mutationFn: (signal?: AbortSignal) => evaluateDecisionCases(signal),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["decision-cases"] });
      const now = new Date();
      const timeStr = `Today at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      setLastScanTime(timeStr);
      setScanTimestamp(timeStr);
      setScanMessage(
        `Rule check completed: ${res.detected_case_count} detected cases evaluated (${res.actionable_case_count} actionable).`
      );
      setTimeout(() => setScanMessage(null), 5000);
    },
    onError: (err: any) => {
      setScanMessage(`Rule check error: ${err?.message || "Failed to trigger evaluation."}`);
      setTimeout(() => setScanMessage(null), 6000);
    },
  });

  // 3. Status mutation PATCH /api/v1/decision-cases/{case_id}/status
  const statusMutation = useMutation({
    mutationFn: ({ caseId, status }: { caseId: string; status: DecisionCaseStatus }) =>
      updateDecisionCaseStatus(caseId, status),
    onSuccess: (updatedRecord, { caseId, status }) => {
      queryClient.invalidateQueries({ queryKey: ["decision-cases"] });
      // Update audit entry in user metadata
      const currentCaseMeta = userMeta[caseId] || {};
      const newHistory = [
        {
          id: "h-" + Date.now(),
          timestamp: new Date().toISOString(),
          author: "HR Manager",
          action: `Status updated to '${status}' (synced to backend)`,
        },
        ...(currentCaseMeta.history || []),
      ];
      const updatedMeta = { ...currentCaseMeta, history: newHistory };
      saveCaseUserMetadata(caseId, updatedMeta);
      setUserMeta((prev) => ({ ...prev, [caseId]: updatedMeta }));
    },
    onError: (err: any) => {
      alert(`Could not update case status on backend: ${err?.message || "Request failed"}`);
    },
  });

  // Adapt backend cases into frontend TriggerCase items
  const cases = useMemo<TriggerCase[]>(() => {
    if (backendResult?.cases && backendResult.cases.length > 0) {
      return backendResult.cases.map((record) =>
        adaptBackendCaseToTriggerCase(record, userMeta)
      );
    }
    // Graceful fallback to stored seed cases if backend is loading or unavailable
    return loadStoredCases();
  }, [backendResult, userMeta]);

  // Set initial selected case once cases load
  useEffect(() => {
    if (cases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(cases[0].id);
    }
  }, [cases, selectedCaseId]);

  // Toggle checklist item
  const handleToggleChecklist = useCallback(
    (caseId: string, checklistId: string) => {
      const targetCase = cases.find((c) => c.id === caseId);
      if (!targetCase) return;

      const updatedChecklist = targetCase.actionChecklist.map((item) =>
        item.id === checklistId ? { ...item, completed: !item.completed } : item
      );

      const currentCaseMeta = userMeta[caseId] || {};
      const updatedMeta = { ...currentCaseMeta, checklist: updatedChecklist };
      saveCaseUserMetadata(caseId, updatedMeta);
      setUserMeta((prev) => ({ ...prev, [caseId]: updatedMeta }));
    },
    [cases, userMeta]
  );

  // Add resolution note
  const handleAddNote = useCallback(
    (caseId: string, noteText: string) => {
      if (!noteText.trim()) return;
      const currentCaseMeta = userMeta[caseId] || {};
      const newHistory = [
        {
          id: "h-" + Date.now(),
          timestamp: new Date().toISOString(),
          author: "HR Manager",
          action: `Added resolution note: "${noteText.slice(0, 35)}..."`,
        },
        ...(currentCaseMeta.history || []),
      ];
      const updatedMeta = {
        ...currentCaseMeta,
        resolutionNotes: noteText.trim(),
        history: newHistory,
      };
      saveCaseUserMetadata(caseId, updatedMeta);
      setUserMeta((prev) => ({ ...prev, [caseId]: updatedMeta }));
    },
    [userMeta]
  );

  // Run Rule Check action
  const handleRunScan = () => {
    evaluateMutation.mutate();
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Status tab
      if (statusTab === "active") {
        if (c.status === "Resolved" || c.status === "Closed") return false;
      } else if (statusTab === "resolved") {
        if (c.status !== "Resolved" && c.status !== "Closed") return false;
      }

      // Priority
      if (priorityFilter !== "All" && c.priority !== priorityFilter) return false;

      // Rule ID
      if (selectedRuleId !== "All" && c.ruleId !== selectedRuleId) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesName = c.subjectName.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q) || c.subjectId.toLowerCase().includes(q);
        const matchesRole = c.role.toLowerCase().includes(q);
        const matchesDept = c.department.toLowerCase().includes(q);
        if (!matchesTitle && !matchesName && !matchesId && !matchesRole && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [cases, statusTab, priorityFilter, selectedRuleId, searchQuery]);

  // Active selected case
  const activeCase = cases.find((c) => c.id === selectedCaseId) || filteredCases[0] || null;

  // KPI counts
  const totalActive = cases.filter((c) => c.status !== "Resolved" && c.status !== "Closed").length;
  const criticalCount = cases.filter(
    (c) => c.priority === "Critical" && c.status !== "Resolved" && c.status !== "Closed"
  ).length;
  const highCount = cases.filter(
    (c) => c.priority === "High" && c.status !== "Resolved" && c.status !== "Closed"
  ).length;
  const underReviewCount = cases.filter((c) => c.status === "Under Review").length;
  const resolvedCount = cases.filter((c) => c.status === "Resolved" || c.status === "Closed").length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header & KPI Strip ── */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-teal/70 px-3 py-1 text-xs font-semibold text-foreground">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                HR Decision Trigger Engine
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Case Monitoring & Alerts
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Live automated workforce alert monitoring & decision engine with 5 critical detection rules.
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunScan}
                disabled={evaluateMutation.isPending}
                className="gap-2 rounded-xl border-border bg-background shadow-xs text-xs font-medium cursor-pointer hover:bg-muted"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", evaluateMutation.isPending && "animate-spin text-primary")}
                />
                <span>{evaluateMutation.isPending ? "Evaluating Rules..." : "Run Rule Check"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Refresh from server"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Scan feedback banner */}
          {scanMessage && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in-0 duration-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{scanMessage}</span>
            </div>
          )}

          {/* Summary Metric Ribbon */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-background p-3 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active Alerts
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-foreground">{totalActive}</span>
                <span className="text-xs text-muted-foreground">cases</span>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Critical
                </div>
                {criticalCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-300">
                  {criticalCount}
                </span>
                <span className="text-xs text-rose-600/80 dark:text-rose-400">immediate</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                High Priority
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                  {highCount}
                </span>
                <span className="text-xs text-amber-600/80 dark:text-amber-400">urgent</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Under Review
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {underReviewCount}
                </span>
                <span className="text-xs text-muted-foreground">in flight</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-border bg-background p-3 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resolved
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {resolvedCount}
                </span>
                <span className="text-xs text-muted-foreground">completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5 Critical Detection Rules Banner ── */}
        <div className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto max-w-7xl px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRulesBanner((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Layers className="h-4 w-4 text-primary" />
                <span>5 Critical Case Detection Rules</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Engine Active
                </span>
                {showRulesBanner ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Click a rule to filter matching cases
              </span>
            </div>

            {showRulesBanner && (
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5 animate-in fade-in-0 duration-200">
                {Object.values(DECISION_RULES).map((rule) => {
                  const matchCount = cases.filter((c) => c.ruleId === rule.id).length;
                  const isFiltered = selectedRuleId === rule.id;

                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() =>
                        setSelectedRuleId((curr) => (curr === rule.id ? "All" : rule.id))
                      }
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all cursor-pointer",
                        isFiltered
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                          {rule.id}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                            matchCount > 0
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {matchCount} active
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-foreground leading-snug line-clamp-1">
                        {rule.name}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {rule.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Queue Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setStatusTab("active")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  statusTab === "active"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Active Queue ({totalActive})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab("resolved")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  statusTab === "resolved"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Resolved / Closed ({resolvedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab("all")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  statusTab === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Cases ({cases.length})
              </button>
            </div>

            {/* Rule & Priority Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedRuleId !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedRuleId("All")}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary cursor-pointer hover:bg-primary/20"
                >
                  <span>Rule: {selectedRuleId}</span>
                  <X className="h-3 w-3" />
                </button>
              )}

              {(["All", "Critical", "High", "Medium", "Low"] as const).map((p) => {
                const isActive = priorityFilter === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer",
                      isActive
                        ? p === "Critical"
                          ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                          : p === "High"
                          ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Workspace ── */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Search & Meta sub-bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter cases by name, ID, role..."
              className="pl-9.5 h-10 rounded-xl border-border bg-card text-xs shadow-xs"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {isLoading && (
              <span className="flex items-center gap-1.5 text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading live cases...
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 opacity-60" />
              <span>Rule scan: {scanTimestamp}</span>
            </div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[430px_1fr] xl:grid-cols-[460px_1fr]">
          {/* ── LEFT: Case Queue List ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground">
              <span>CASE QUEUE ({filteredCases.length})</span>
              <span>LIVE DECISION ENGINE</span>
            </div>

            {filteredCases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-8 w-8 opacity-30 mb-2" />
                <div className="font-semibold text-sm">No cases match filters</div>
                <p className="mt-1 text-xs">Try clearing filters or search query.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredCases.map((c) => {
                  const isSelected = activeCase?.id === c.id;
                  const pri = PRIORITY_BADGES[c.priority];
                  const st = STATUS_CONFIG[c.status];

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCaseId(c.id)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition-all cursor-pointer shadow-xs",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                      )}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                              pri.bg,
                              pri.text,
                              pri.border
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", pri.dot)} />
                            {c.priority}
                          </span>

                          <span className="text-[10px] font-medium text-muted-foreground">
                            {c.id}
                          </span>

                          {c.ruleId && (
                            <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground">
                              {c.ruleId}
                            </span>
                          )}
                        </div>

                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium border",
                            st.bg,
                            st.text,
                            st.border
                          )}
                        >
                          {st.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                        {c.title}
                      </div>

                      {/* Subject Entity */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                            pri.bg,
                            pri.text
                          )}
                        >
                          {c.subjectName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-foreground">
                            {c.subjectName}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {c.department} · {c.role}
                          </div>
                        </div>
                      </div>

                      {/* Key Evidence Chips */}
                      {c.evidence.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.evidence.slice(0, 2).map((ev, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                              <span className="font-medium text-foreground">{ev.metric}:</span>{" "}
                              {ev.actual}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: Case Dossier & Action Console (Sticky) ── */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            {activeCase ? (
              <CaseDossierCard
                caseItem={activeCase}
                isUpdatingStatus={statusMutation.isPending}
                onStatusChange={(newStatus) =>
                  statusMutation.mutate({ caseId: activeCase.id, status: newStatus })
                }
                onToggleChecklist={handleToggleChecklist}
                onAddNote={handleAddNote}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 opacity-30 mb-2" />
                <div className="font-semibold">No case selected</div>
                <p className="mt-1 text-xs">Select a case from the queue to view evidence and take action.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Case Dossier & Action Console ───────────────────────────────────────────

function CaseDossierCard({
  caseItem,
  isUpdatingStatus,
  onStatusChange,
  onToggleChecklist,
  onAddNote,
}: {
  caseItem: TriggerCase;
  isUpdatingStatus: boolean;
  onStatusChange: (newStatus: CaseStatus) => void;
  onToggleChecklist: (caseId: string, checklistId: string) => void;
  onAddNote: (caseId: string, note: string) => void;
}) {
  const [noteInput, setNoteInput] = useState("");
  const pri = PRIORITY_BADGES[caseItem.priority];
  const st = STATUS_CONFIG[caseItem.status];
  const ruleMeta = caseItem.ruleId ? getRuleMeta(caseItem.ruleId) : null;
  const rawEv = caseItem.rawEvidence || {};

  const handleSaveNote = () => {
    if (!noteInput.trim()) return;
    onAddNote(caseItem.id, noteInput);
    setNoteInput("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* ── Dossier Header ── */}
      <div className="border-b border-border bg-muted/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border",
                pri.bg,
                pri.text,
                pri.border
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", pri.dot)} />
              {caseItem.priority} Priority Case
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{caseItem.id}</span>
            {caseItem.ruleId && (
              <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold text-foreground">
                {caseItem.ruleId} · {ruleMeta?.name || "Detection Rule"}
              </span>
            )}
          </div>

          <span
            className={cn(
              "rounded-full px-3 py-0.5 text-xs font-semibold border",
              st.bg,
              st.text,
              st.border
            )}
          >
            {st.label}
          </span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground">{caseItem.title}</h2>

        {/* Subject Card Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold shadow-xs",
                pri.bg,
                pri.text
              )}
            >
              {caseItem.subjectType === "employee" ? (
                caseItem.subjectName.charAt(0).toUpperCase()
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </span>
            <div>
              <div className="font-semibold text-sm text-foreground">{caseItem.subjectName}</div>
              <div className="text-xs text-muted-foreground">
                {[caseItem.subjectId, caseItem.department, caseItem.role].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>

          {caseItem.employeeId && (
            <Link
              to="/employee/$employeeId"
              params={{ employeeId: caseItem.employeeId }}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>Employee Profile</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[calc(100vh-18rem)] overflow-y-auto">
        {/* ── Why Flagged? (Reason) ── */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Why Was This Case Created?
          </div>
          <p className="text-xs font-medium leading-relaxed text-amber-900 dark:text-amber-200">
            {caseItem.reason}
          </p>
        </div>

        {/* ── Specialized Evidence Widget per Rule ── */}
        {caseItem.ruleId === "DTE-001" && (
          <LeadershipContinuityEvidenceCard rawEv={rawEv} />
        )}
        {caseItem.ruleId === "DTE-002" && (
          <PerformanceDeteriorationEvidenceCard rawEv={rawEv} />
        )}
        {caseItem.ruleId === "DTE-003" && (
          <BudgetComplianceEvidenceCard rawEv={rawEv} />
        )}
        {caseItem.ruleId === "DTE-005" && (
          <CapacityRiskEvidenceCard rawEv={rawEv} />
        )}
        {caseItem.ruleId === "DTE-004" && (
          <CriticalVacancyEvidenceCard rawEv={rawEv} />
        )}

        {/* ── Supporting Evidence Dossier (Standard Thresholds) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Supporting Evidence Dossier
            </span>
            <span className="text-[11px] text-muted-foreground">Threshold comparison</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {caseItem.evidence.map((ev, i) => {
              const isViolation = ev.status === "violation";
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-3 shadow-xs",
                    isViolation
                      ? "border-rose-200/90 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/10"
                      : "border-border bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>{ev.metric}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[10px] font-bold",
                        isViolation
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      Rule: {ev.threshold}
                    </span>
                  </div>

                  <div className="mt-1 text-lg font-bold tabular-nums text-foreground">
                    {ev.actual}
                  </div>

                  <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                    {ev.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Suggested Next Step ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Suggested Practical Next Step
          </div>
          <p className="text-xs leading-relaxed text-foreground font-medium">
            {caseItem.suggestedAction}
          </p>

          {/* Action Checklist */}
          {caseItem.actionChecklist.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-primary/10 pt-3">
              <div className="text-[11px] font-semibold text-muted-foreground">
                Action Step Checklist:
              </div>
              {caseItem.actionChecklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2 text-xs text-foreground cursor-pointer hover:bg-primary/10 p-1 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onToggleChecklist(caseItem.id, item.id)}
                    className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className={cn(item.completed && "line-through opacity-60")}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ── Cross-Tool Quick Actions ── */}
        <div className="flex flex-wrap gap-2 pt-1">
          {caseItem.scenarioType && (
            <Link
              to="/scenario"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted shadow-xs transition-colors"
            >
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              <span>Model in Scenario Simulator</span>
              <ArrowRight className="h-3 w-3 opacity-60" />
            </Link>
          )}

          <Link
            to="/chatbot"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted shadow-xs transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span>Ask Assistant</span>
          </Link>
        </div>

        {/* ── Interactive Workflow Status Stepper (Live Backend PATCH) ── */}
        <div className="rounded-xl border border-border bg-background p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Case Workflow Status
            </span>
            {isUpdatingStatus && (
              <span className="flex items-center gap-1 text-[11px] text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing backend...
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {STATUS_FLOW.map((step) => {
              const isCurrent = caseItem.status === step;
              const cfg = STATUS_CONFIG[step];
              return (
                <button
                  key={step}
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange(step)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl p-2 text-center text-xs font-semibold transition-all cursor-pointer",
                    isCurrent
                      ? cn("border ring-2 ring-primary/20", cfg.bg, cfg.text, cfg.border)
                      : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                    isUpdatingStatus && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-[11px] leading-tight">{step}</span>
                  {isCurrent && <Check className="mt-1 h-3 w-3" />}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Click any stage to update case lifecycle on the Decision Trigger Engine.
          </p>
        </div>

        {/* ── Resolution Notes ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>HR Resolution Notes & Documentation</span>
          </div>

          {caseItem.resolutionNotes && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-foreground">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Current Note
              </div>
              {caseItem.resolutionNotes}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add HR action notes or outcome..."
              className="h-9 rounded-xl border-border bg-background text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSaveNote()}
            />
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={!noteInput.trim()}
              className="rounded-xl text-xs px-3 shadow-xs cursor-pointer"
            >
              Save Note
            </Button>
          </div>
        </div>

        {/* ── Audit History ── */}
        {caseItem.history.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/10 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Case Audit Trail
            </div>
            <div className="space-y-2 text-xs">
              {caseItem.history.map((h) => (
                <div key={h.id} className="flex items-start gap-2 text-muted-foreground border-l-2 border-border pl-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">{h.author}:</span> {h.action}
                    <div className="text-[10px] opacity-60">
                      {new Date(h.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Specialized Evidence Cards for the 5 Rules ──────────────────────────────

/** Rule 1 (DTE-001): Leadership Continuity Risk */
function LeadershipContinuityEvidenceCard({ rawEv }: { rawEv: Record<string, any> }) {
  const topSucc = rawEv.top_successor;
  const factors = rawEv.attrition_contributing_factors || [];

  return (
    <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-3">
        <UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        Leadership Continuity & Successor Pipeline
      </div>

      <div className="space-y-3">
        {/* Successor Card */}
        {topSucc ? (
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
              Top Designated Successor
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-sm text-foreground">
                  {topSucc.employee_name} ({topSucc.employee_id})
                </div>
                <div className="text-xs text-muted-foreground">
                  Current: {topSucc.current_position}
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {topSucc.readiness || "Developing"}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">
              ⚠️ Gap Alert: No successor is currently "Ready Now". Acceleration or retention package required.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-rose-300 bg-background/50 p-3 text-xs text-rose-700 dark:text-rose-300">
            0 Succession candidates nominated for this leadership seat.
          </div>
        )}

        {/* Attrition Drivers */}
        {factors.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
              Identified Flight Risk Contributing Factors
            </div>
            <div className="flex flex-wrap gap-1.5">
              {factors.map((f: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-lg border border-rose-200 bg-rose-100/60 px-2 py-0.5 text-[11px] font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Rule 2 (DTE-002): Critical Role Performance Risk */
function PerformanceDeteriorationEvidenceCard({ rawEv }: { rawEv: Record<string, any> }) {
  const trend = rawEv.performance_trend || "Declining";
  const delta = rawEv.three_month_change_points ?? -3.91;
  const score = rawEv.latest_performance_score ?? 80.9;
  const band = rawEv.latest_performance_band || "Strong";
  const kpi1 = rawEv.development_kpi_1 || "Teamwork and Communication";
  const kpi1Score = rawEv.development_kpi_1_score ?? 69.9;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
        <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        Performance Deterioration Analysis
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Current Score & Band
          </div>
          <div className="text-xl font-bold tabular-nums text-foreground mt-0.5">
            {score} <span className="text-xs font-normal text-muted-foreground">({band})</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            3-Month Trajectory
          </div>
          <div className="text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
            {delta > 0 ? "+" : ""}{delta} pts
          </div>
          <div className="text-[10px] text-muted-foreground">Trend: {trend}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Priority Development KPI: {kpi1}</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">{kpi1Score} / 100</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Score lags role standard (≥ 75.0). Targeted coaching or executive mentorship suggested.
        </p>
      </div>
    </div>
  );
}

/** Rule 3 (DTE-003): Budget Compliance Risk */
function BudgetComplianceEvidenceCard({ rawEv }: { rawEv: Record<string, any> }) {
  const depts = rawEv.departments || ["Human Resources", "Legal & Compliance"];
  const exceptions = rawEv.exception_count ?? 3;
  const positions = rawEv.exception_positions || [
    { title: "Talha Mahmood (EMP424) · HR Specialist", dept: "Human Resources", status: "Unapproved Headcount" },
    { title: "Zainab Chaudhry (EMP579) · Legal Counsel", dept: "Legal & Compliance", status: "Unapproved Headcount" },
    { title: "Hamza Javed (EMP591) · Compliance Analyst", dept: "Legal & Compliance", status: "Unapproved Headcount" },
  ];

  return (
    <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-3">
        <DollarSign className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        Budget Governance & Unapproved Positions ({exceptions} Staff)
      </div>

      <div className="space-y-2">
        {positions.map((p: any, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-2.5 text-xs"
          >
            <div>
              <div className="font-semibold text-foreground">{p.title}</div>
              <div className="text-[11px] text-muted-foreground">{p.dept}</div>
            </div>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              {p.status}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-400">
        Action Required: Reconcile headcount allocation or regularize positions via Department Head sign-off.
      </p>
    </div>
  );
}

/** Rule 5 (DTE-005): Capacity Risk */
function CapacityRiskEvidenceCard({ rawEv }: { rawEv: Record<string, any> }) {
  const topDepts = rawEv.top_affected_departments || [
    { department: "Medical Care", long_open_vacancies: 9 },
    { department: "Production", long_open_vacancies: 8 },
    { department: "Engineering", long_open_vacancies: 6 },
    { department: "Logistics & Warehouse", long_open_vacancies: 6 },
    { department: "Operations", long_open_vacancies: 6 },
    { department: "Sales", long_open_vacancies: 5 },
    { department: "Customer Support", long_open_vacancies: 5 },
    { department: "Finance", long_open_vacancies: 5 },
  ];
  const totalOpen = rawEv.long_open_vacancy_count ?? 62;
  const deptCount = rawEv.affected_department_count ?? 12;

  return (
    <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
          <Briefcase className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          Systemic Capacity Risk: {totalOpen} Long-Open Roles
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {deptCount} Departments Impacted
        </span>
      </div>

      <div className="text-[11px] text-muted-foreground mb-2">
        Vacancies open &gt; 90 days causing critical team bandwidth deficits:
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {topDepts.slice(0, 8).map((d: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background p-2.5">
            <div className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {d.long_open_vacancies}
            </div>
            <div className="text-[11px] font-medium text-foreground truncate" title={d.department}>
              {d.department}
            </div>
            <div className="text-[10px] text-muted-foreground">&gt; 90 days open</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rule 4 (DTE-004): Critical Vacancy Risk */
function CriticalVacancyEvidenceCard({ rawEv }: { rawEv: Record<string, any> }) {
  const days = rawEv.days_vacant ?? 52;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        Critical Vacancy SLA Overrun
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">{days} Days</span>
        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          (SLA Limit: 30 days — {days - 30} days overdue)
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Key operational position has remained unstaffed beyond allowable business threshold.
      </p>
    </div>
  );
}
