import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
} from "@/lib/trigger-engine";

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
  const [cases, setCases] = useState<TriggerCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | "All">("All");
  const [statusTab, setStatusTab] = useState<"active" | "resolved" | "all">("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [isScanning, setIsScanning] = useState(false);
  const [scanTimestamp, setScanTimestamp] = useState("");
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Load initial cases on mount
  useEffect(() => {
    const loaded = loadStoredCases();
    setCases(loaded);
    setScanTimestamp(getLastScanTime());
    if (loaded.length > 0) {
      setSelectedCaseId(loaded[0].id);
    }
  }, []);

  // Sync across tabs/windows
  useEffect(() => {
    function handleUpdate() {
      const updated = loadStoredCases();
      setCases(updated);
    }
    window.addEventListener("trigger-cases-updated", handleUpdate);
    return () => window.removeEventListener("trigger-cases-updated", handleUpdate);
  }, []);

  // Update a case
  const handleUpdateCase = useCallback(
    (caseId: string, updates: Partial<TriggerCase>, auditAction?: string) => {
      setCases((prev) => {
        const next = prev.map((c) => {
          if (c.id !== caseId) return c;
          const updatedHistory = auditAction
            ? [
                {
                  id: "h-" + Date.now(),
                  timestamp: new Date().toISOString(),
                  author: "HR Manager",
                  action: auditAction,
                },
                ...c.history,
              ]
            : c.history;

          return {
            ...c,
            ...updates,
            updatedAt: new Date().toISOString(),
            history: updatedHistory,
          };
        });
        saveCases(next);
        return next;
      });
    },
    []
  );

  // Toggle checklist item
  const handleToggleChecklist = useCallback(
    (caseId: string, checklistId: string) => {
      setCases((prev) => {
        const next = prev.map((c) => {
          if (c.id !== caseId) return c;
          const updatedChecklist = c.actionChecklist.map((item) =>
            item.id === checklistId ? { ...item, completed: !item.completed } : item
          );
          return { ...c, actionChecklist: updatedChecklist };
        });
        saveCases(next);
        return next;
      });
    },
    []
  );

  // Add resolution note
  const handleAddNote = useCallback(
    (caseId: string, noteText: string) => {
      if (!noteText.trim()) return;
      handleUpdateCase(
        caseId,
        { resolutionNotes: noteText },
        `Added HR resolution note: "${noteText.slice(0, 40)}..."`
      );
    },
    [handleUpdateCase]
  );

  // Reset to demo defaults
  const handleResetDefaults = () => {
    if (confirm("Reset all trigger engine cases to initial default state?")) {
      setCases(INITIAL_CASES);
      saveCases(INITIAL_CASES);
      setSelectedCaseId(INITIAL_CASES[0].id);
    }
  };

  // Simulate Rule Engine Scan
  const handleRunScan = () => {
    setIsScanning(true);
    setScanMessage("Reviewing 142 workforce indicators against decision rules...");
    setTimeout(() => {
      const now = new Date();
      const timeStr = `Today at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      setLastScanTime(timeStr);
      setScanTimestamp(timeStr);
      setIsScanning(false);
      setScanMessage("Rule check completed. All indicators verified · 0 duplicate alerts.");
      setTimeout(() => setScanMessage(null), 4000);
    }, 1200);
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

      // Category
      if (categoryFilter !== "All" && c.category !== categoryFilter) return false;

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
  }, [cases, statusTab, priorityFilter, categoryFilter, searchQuery]);

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
                Automated workforce alerts and decision-support layer based on workforce indicators.
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunScan}
                disabled={isScanning}
                className="gap-2 rounded-xl border-border bg-background shadow-xs text-xs font-medium cursor-pointer hover:bg-muted"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isScanning && "animate-spin text-primary")} />
                <span>{isScanning ? "Scanning..." : "Run Rule Check"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetDefaults}
                className="gap-1.5 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Reset sample data"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>

          {/* Scan feedback toast */}
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

        {/* ── Filter Bar ── */}
        <div className="mx-auto max-w-7xl px-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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

            {/* Priority Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 opacity-60" />
            <span>Rule scan: {scanTimestamp}</span>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[430px_1fr] xl:grid-cols-[460px_1fr]">
          {/* ── LEFT: Case Queue List ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground">
              <span>CASE QUEUE ({filteredCases.length})</span>
              <span>SORT: PRIORITY</span>
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
                onUpdateCase={handleUpdateCase}
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
  onUpdateCase,
  onToggleChecklist,
  onAddNote,
}: {
  caseItem: TriggerCase;
  onUpdateCase: (id: string, updates: Partial<TriggerCase>, audit?: string) => void;
  onToggleChecklist: (caseId: string, checklistId: string) => void;
  onAddNote: (caseId: string, note: string) => void;
}) {
  const navigate = useNavigate();
  const [noteInput, setNoteInput] = useState("");
  const pri = PRIORITY_BADGES[caseItem.priority];
  const st = STATUS_CONFIG[caseItem.status];

  const handleStatusChange = (newStatus: CaseStatus) => {
    onUpdateCase(
      caseItem.id,
      { status: newStatus },
      `Status changed from '${caseItem.status}' to '${newStatus}'`
    );
  };

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

        {/* ── Evidence Dossier ── */}
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
              <span>Test in Scenario Simulator</span>
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

        {/* ── Interactive Workflow Status Stepper ── */}
        <div className="rounded-xl border border-border bg-background p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Case Workflow Status
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {STATUS_FLOW.map((step) => {
              const isCurrent = caseItem.status === step;
              const cfg = STATUS_CONFIG[step];
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleStatusChange(step)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl p-2 text-center text-xs font-semibold transition-all cursor-pointer",
                    isCurrent
                      ? cn("border ring-2 ring-primary/20", cfg.bg, cfg.text, cfg.border)
                      : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="text-[11px] leading-tight">{step}</span>
                  {isCurrent && <Check className="mt-1 h-3 w-3" />}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Click any stage to update the case lifecycle.
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
