import { useState, useMemo, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Info,
  FileText,
  CheckCircle2,
  Clock,
  UploadCloud,
  X,
  FileCheck2,
  User,
  Building2,
  CalendarCheck,
  Award,
  AlertCircle,
  TrendingUp,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employees } from "@/lib/employees";
import { addActivityLog } from "@/lib/activity-store";
import {
  useActionProcessData,
  type NormalizedActionRecord,
} from "@/lib/action-center-api";
import {
  WorkflowMetricCards,
  WorkflowRecordsLoading,
  WorkflowActionCount,
} from "./WorkflowCommonComponents";

export interface ProbationConfirmationRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  effectiveDate: string;
  confirmationEffectiveFrom: string;
  supervisorRecommendation: string;
  performanceRating?: string;
  salaryRevised?: string;
  strengthsObserved?: string;
  remarks?: string;
  evaluationFileName?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_probation_confirmations";

function SearchableEmployeeSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (employeeName: string) => void;
  error?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedEmp = useMemo(() => {
    return employees.find((e) => e.name === value);
  }, [value]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term) ||
        e.positionTitle.toLowerCase().includes(term) ||
        e.id.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs transition-colors cursor-pointer text-left",
          "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          error && "border-destructive",
          isOpen && "border-primary ring-1 ring-primary"
        )}
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-mint/80 text-[10px] font-bold text-primary">
              {selectedEmp.name.charAt(0)}
            </div>
            <span className="font-medium text-foreground truncate">{selectedEmp.name}</span>
            <span className="text-muted-foreground truncate text-[11px]">
              — {selectedEmp.positionTitle} ({selectedEmp.department})
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Search employees...</span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu with Search on top */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden">
          {/* Search Bar on Top */}
          <div className="border-b border-border/60 p-2 bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Employee Options List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-border/20">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No employees found matching "{searchTerm}"
              </div>
            ) : (
              filtered.map((emp) => {
                const isSelected = emp.name === value;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onChange(emp.name);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                      isSelected ? "bg-pastel-mint/50 font-medium text-foreground" : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-mint/80 text-[10px] font-bold text-primary">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-foreground truncate">{emp.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {emp.positionTitle} · {emp.department} <span className="opacity-75">({emp.id})</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="ml-2 h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProbationConfirmationPageProps {
  onBack?: () => void;
}

export function ProbationConfirmationPage({ onBack }: ProbationConfirmationPageProps = {}) {
  const navigate = useNavigate();

  // Backend connected process data & statistics
  const {
    records,
    metrics,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "PROB_CONFIRM",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Updates the record",
    defaultFieldCount: 8,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Side Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Side Panel Form Fields
  const todayDateStr = new Date().toISOString().split("T")[0];
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayDateStr);
  const [confirmationEffectiveFrom, setConfirmationEffectiveFrom] = useState(todayDateStr);
  const [supervisorRecommendation, setSupervisorRecommendation] = useState("");
  const [performanceRating, setPerformanceRating] = useState("");
  const [salaryRevised, setSalaryRevised] = useState("");
  const [strengthsObserved, setStrengthsObserved] = useState("");
  const [remarks, setRemarks] = useState("");
  const [evaluationFileName, setEvaluationFileName] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset side panel form
  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setConfirmationEffectiveFrom(todayDateStr);
    setSupervisorRecommendation("");
    setPerformanceRating("");
    setSalaryRevised("");
    setStrengthsObserved("");
    setRemarks("");
    setEvaluationFileName("");
    setNote("");
    setFormError("");
    setIsSubmitting(false);
  };

  const handleOpenPanel = () => {
    resetForm();
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    resetForm();
  };

  // Submit new record
  const handleRecordConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Please specify an effective date.");
      return;
    }
    if (!confirmationEffectiveFrom) {
      setFormError("Please specify when confirmation takes effect from.");
      return;
    }
    if (!supervisorRecommendation) {
      setFormError("Please choose supervisor's recommendation.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((e) => e.name === selectedEmployeeName);
    const employeeId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const department = matchedEmp?.department || "General";

    const localRec: NormalizedActionRecord = {
      id: "prob-" + Date.now(),
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      effectiveDate,
      status: "APPLIED",
      performedBy: "Ahmad Jalal (HR Lead)",
      recordedAt: new Date().toISOString(),
      reasonCategory: "STANDARD_CONFIRMATION",
      reasonDetails: `Supervisor recommendation: ${supervisorRecommendation}. ${remarks}`.trim(),
      actionData: {
        confirmation_effective_from: confirmationEffectiveFrom,
        supervisor_recommendation: supervisorRecommendation,
        performance_rating: performanceRating,
        salary_revised: salaryRevised,
        strengths_observed: strengthsObserved,
        remarks,
        evaluation_file_name: evaluationFileName,
        note,
      },
    };

    await recordAction({
      employeeId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        decision: "CONFIRM",
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Also log to Activity Store so Activity tab stays in sync
    addActivityLog({
      actionId: "probation-confirmation",
      actionTitle: "Probation Confirmation",
      category: "Entry",
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      summary: `Confirmed permanent employment for ${selectedEmployeeName} (${department}) following probation evaluation.${
        salaryRevised ? ` Salary status: ${salaryRevised}.` : ""
      }`,
      performedBy: localRec.performedBy || "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: "bg-pastel-mint",
      tintVar: "--pastel-mint",
      effectiveDate: confirmationEffectiveFrom,
      notes: note.trim() || undefined,
    });

    setIsSubmitting(false);
    handleClosePanel();
  };

  // Filtered records for table / list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.employeeName.toLowerCase().includes(q);
        const matchesId = r.employeeId.toLowerCase().includes(q);
        const matchesNote = (r.actionData?.note || r.reasonDetails || "").toLowerCase().includes(q);
        const matchesDept = r.department.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept) return false;
      }

      if (fromDate) {
        if (new Date(r.effectiveDate) < new Date(fromDate)) return false;
      }

      if (toDate) {
        if (new Date(r.effectiveDate) > new Date(toDate)) return false;
      }

      return true;
    });
  }, [records, searchQuery, fromDate, toDate]);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ── Top Navigation Link ── */}
      <div>
        <Link
          to="/task-center"
          search={{ tab: "action-center" } as any}
          onClick={(e) => {
            if (onBack) {
              e.preventDefault();
              onBack();
            }
          }}
          className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Task Center</span>
        </Link>
      </div>

      {/* ── Page Header / Subtitle & Action Button ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-mint/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Entry Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Probation Confirmation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entry process — configure its approval chain in the Workflow Manager.
          </p>
        </div>

        <div>
          <Button
            onClick={handleOpenPanel}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Record probation confirmation
          </Button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <WorkflowMetricCards
        metrics={metrics}
        isLoading={isLoading}
        last30DaysLabel="Confirmed in past 30 days"
      />

      {/* ── Filters & Search Bar ── */}
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Employee or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 bg-background text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">From</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-36 bg-background text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">To</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-36 bg-background text-xs"
            />
          </div>

          {(searchQuery || fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setToDate("");
              }}
              className="h-9 px-2 text-xs"
            >
              Reset
            </Button>
          )}

          <div className="ml-auto pl-2 border-l border-border/60 text-xs font-medium text-foreground/80">
            <WorkflowActionCount count={filteredRecords.length} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* ── Content Body: Loading / Empty State or Records Table ── */}
      {isLoading ? (
        <WorkflowRecordsLoading />
      ) : filteredRecords.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/90 bg-card/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-mint/50 text-foreground">
            <FileCheck2 className="h-7 w-7 stroke-[1.75] text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            Nothing recorded yet
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            No probation confirmation has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-5 rounded-lg bg-primary text-primary-foreground shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Record probation confirmation
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Effective From</th>
                  <th className="px-5 py-3 font-semibold">Recommendation</th>
                  <th className="px-5 py-3 font-semibold">Rating</th>
                  <th className="px-5 py-3 font-semibold">Salary Revision</th>
                  <th className="px-5 py-3 font-semibold">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRecords.map((item) => {
                  const effectiveFromVal =
                    item.actionData?.confirmation_effective_from || item.effectiveDate || "—";
                  const recommendationVal =
                    item.actionData?.supervisor_recommendation ||
                    item.reasonCategory ||
                    item.status ||
                    "Confirmed";
                  const ratingVal =
                    item.actionData?.performance_rating || "—";
                  const salaryVal =
                    item.actionData?.salary_revised || item.actionData?.decision || "Standard";

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pastel-mint/70 text-xs font-bold text-primary">
                            {item.employeeName.charAt(0)}
                          </div>
                          <div>
                            <div>{item.employeeName}</div>
                            <div className="text-xs text-muted-foreground">{item.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{item.department}</td>
                      <td className="px-5 py-3.5 text-foreground">{effectiveFromVal}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="secondary" className="bg-pastel-mint/60 text-foreground font-medium">
                          {recommendationVal}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-foreground">
                        {ratingVal}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {salaryVal}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {item.recordedAt ? (
                          isNaN(new Date(item.recordedAt).getTime())
                            ? item.recordedAt
                            : format(new Date(item.recordedAt), "yyyy-MM-dd HH:mm")
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Side Panel (Slide-Over Sheet) ── */}
      <Sheet open={isPanelOpen} onOpenChange={(open) => !open && handleClosePanel()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl overflow-y-auto p-6 sm:p-7 flex flex-col gap-6"
        >
          {/* Panel Header */}
          <SheetHeader className="space-y-2 border-b border-border/50 pb-4 text-left">
            <div className="flex items-center gap-2.5">
              <SheetTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Probation Confirmation
              </SheetTitle>
              <Badge variant="outline" className="font-mono text-xs font-semibold uppercase tracking-wider text-primary border-primary/40 bg-pastel-mint/30">
                PROB_CONF
              </Badge>
            </div>
            <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
              Entry process — configure its approval chain in the Workflow Manager.
            </SheetDescription>
          </SheetHeader>

          {/* Notice Banner */}
          <div className="rounded-xl border border-primary/30 bg-pastel-teal/30 p-3.5 text-xs leading-relaxed text-foreground flex items-start gap-2.5 shadow-xs">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              This updates the employee's record immediately and is logged against your name.
            </span>
          </div>

          {formError && (
            <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRecordConfirmation} className="space-y-6 flex-1">
            {/* ── GROUP 1: WHO AND WHEN ── */}
            <div className="space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 border-b border-border/40 pb-1">
                WHO AND WHEN
              </div>

              {/* Employee* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Employee <span className="text-destructive">*</span>
                </label>
                <SearchableEmployeeSelect
                  value={selectedEmployeeName}
                  onChange={(val) => {
                    setSelectedEmployeeName(val);
                    setFormError("");
                  }}
                  error={!!formError && !selectedEmployeeName}
                />
              </div>

              {/* Effective date* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Effective date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  When the decision takes effect — not necessarily today.
                </p>
              </div>
            </div>

            {/* ── GROUP 2: PROBATION CONFIRMATION DETAILS ── */}
            <div className="space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 border-b border-border/40 pb-1">
                PROBATION CONFIRMATION DETAILS
              </div>

              {/* Confirmation effective from* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Confirmation effective from <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={confirmationEffectiveFrom}
                  onChange={(e) => setConfirmationEffectiveFrom(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
              </div>

              {/* Supervisor's recommendation* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Supervisor's recommendation <span className="text-destructive">*</span>
                </label>
                <Select
                  value={supervisorRecommendation}
                  onValueChange={(val) => {
                    setSupervisorRecommendation(val);
                    setFormError("");
                  }}
                >
                  <SelectTrigger className="h-10 text-xs bg-background">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirm Employment">Confirm Employment (Recommended)</SelectItem>
                    <SelectItem value="Extend Probation">Extend Probation</SelectItem>
                    <SelectItem value="Do Not Confirm">Do Not Confirm / End Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Performance rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Performance rating
                </label>
                <Select value={performanceRating} onValueChange={setPerformanceRating}>
                  <SelectTrigger className="h-10 text-xs bg-background">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Outstanding">Outstanding</SelectItem>
                    <SelectItem value="Exceeds expectations">Exceeds expectations</SelectItem>
                    <SelectItem value="Meets expectations">Meets expectations</SelectItem>
                    <SelectItem value="Needs improvement">Needs improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Salary revised on confirmation? */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Salary revised on confirmation?
                </label>
                <Select value={salaryRevised} onValueChange={setSalaryRevised}>
                  <SelectTrigger className="h-10 text-xs bg-background">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes - Standard Increment">Yes - Standard Increment</SelectItem>
                    <SelectItem value="Yes - Special Merit Adjustment">Yes - Special Merit Adjustment</SelectItem>
                    <SelectItem value="No - Retain Current Remuneration">No - Retain Current Remuneration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strengths observed */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Strengths observed
                </label>
                <Textarea
                  value={strengthsObserved}
                  onChange={(e) => setStrengthsObserved(e.target.value)}
                  placeholder="Key contributions, cultural fit, domain expertise demonstrated..."
                  className="min-h-[70px] text-xs bg-background leading-relaxed"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Remarks
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Future development recommendations or milestone notes..."
                  className="min-h-[70px] text-xs bg-background leading-relaxed"
                />
              </div>

              {/* Signed evaluation form (File Upload) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Signed evaluation form
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    <span>{evaluationFileName || "Choose a file..."}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setEvaluationFileName(file.name);
                      }}
                    />
                  </label>
                  {evaluationFileName && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEvaluationFileName("")}
                      className="h-8 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ── GROUP 3: FOR THE RECORD ── */}
            <div className="space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 border-b border-border/40 pb-1">
                FOR THE RECORD
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Note
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Board minute 14/2026, signed letter on file"
                  className="min-h-[70px] text-xs bg-background leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Why this was done, and any reference — this is what an auditor reads.
                </p>
              </div>
            </div>

            {/* ── PANEL ACTIONS ── */}
            <div className="sticky bottom-0 bg-background pt-4 border-t border-border/60 flex items-center justify-end gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleClosePanel}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
              >
                Record probation confirmation
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
