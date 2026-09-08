import { useState, useMemo, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Info,
  Clock,
  Check,
  ChevronDown,
  X,
  Trash2,
  RotateCcw,
  UserCheck,
  Building2,
  Briefcase,
  DollarSign,
  AlertCircle,
  Sparkles,
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

export interface RejoiningRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  effectiveDate: string;
  rejoiningDate: string;
  previousEmployeeCode?: string;
  previousExitDate?: string;
  reasonForBreak?: string;
  designationOnRejoining?: string;
  grossSalaryOnRejoining?: string;
  continuityAllowed?: string;
  remarks?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_rejoining_rehires";

const CONTINUITY_OPTIONS = [
  "Yes — Retain prior seniority, service tenure & benefits",
  "No — Fresh employment terms (Service tenure reset)",
  "Conditional — Subject to probation re-evaluation",
];

/* ── Searchable Employee Dropdown ── */
function SearchableEmployeeSelect({
  value,
  onChange,
  onSelectEmployee,
  error,
}: {
  value: string;
  onChange: (employeeName: string) => void;
  onSelectEmployee?: (emp: (typeof employees)[0]) => void;
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
          "flex h-9 w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-xs shadow-xs transition-colors cursor-pointer text-left",
          error ? "border-destructive ring-1 ring-destructive" : "border-input hover:border-primary/50",
          isOpen && "border-primary ring-1 ring-primary"
        )}
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-lavender/80 text-[10px] font-bold text-foreground">
              {selectedEmp.name.charAt(0)}
            </div>
            <span className="font-semibold text-foreground truncate">{selectedEmp.name}</span>
            <span className="text-muted-foreground truncate text-[11px]">
              · {selectedEmp.positionTitle} ({selectedEmp.department})
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Search employees...</span>
        )}
        <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-50 zoom-in-95 duration-100 flex flex-col">
          {/* Sticky Search Input */}
          <div className="p-2 border-b border-border bg-muted/40 sticky top-0 z-10 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, ID or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-full bg-transparent px-2 text-xs placeholder:text-muted-foreground focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* List of matching employees */}
          <div className="overflow-y-auto max-h-52 divide-y divide-border/40">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No employees matching "{searchTerm}"
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
                      if (onSelectEmployee) onSelectEmployee(emp);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-muted/70 cursor-pointer",
                      isSelected && "bg-pastel-lavender/50 font-medium text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-lavender/80 text-[10px] font-bold text-foreground">
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

interface RejoiningRehirePageProps {
  onBack?: () => void;
}

export function RejoiningRehirePage({ onBack }: RejoiningRehirePageProps = {}) {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "REHIRE",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Updates the record",
    defaultFieldCount: 8,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Slide panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Form Fields
  const todayDateStr = new Date().toISOString().split("T")[0];
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayDateStr);
  const [rejoiningDate, setRejoiningDate] = useState(todayDateStr);
  const [previousEmployeeCode, setPreviousEmployeeCode] = useState("");
  const [previousExitDate, setPreviousExitDate] = useState("");
  const [reasonForBreak, setReasonForBreak] = useState("");
  const [designationOnRejoining, setDesignationOnRejoining] = useState("");
  const [grossSalaryOnRejoining, setGrossSalaryOnRejoining] = useState("");
  const [continuityAllowed, setContinuityAllowed] = useState("");
  const [remarks, setRemarks] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setRejoiningDate(todayDateStr);
    setPreviousEmployeeCode("");
    setPreviousExitDate("");
    setReasonForBreak("");
    setDesignationOnRejoining("");
    setGrossSalaryOnRejoining("");
    setContinuityAllowed("");
    setRemarks("");
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

  const handleSelectEmployee = (emp: (typeof employees)[0]) => {
    setPreviousEmployeeCode(emp.id);
    setDesignationOnRejoining(emp.positionTitle);
  };

  const handleRecordRehire = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName.trim()) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Effective date is required.");
      return;
    }
    if (!rejoiningDate) {
      setFormError("Rejoining date is required.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((emp) => emp.name === selectedEmployeeName);
    const employeeId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const department = matchedEmp?.department || "Operations";

    const localRec: NormalizedActionRecord = {
      id: "reh-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      effectiveDate,
      status: "APPLIED",
      performedBy: "Ahmad Jalal (HR Lead)",
      recordedAt: new Date().toISOString(),
      reasonCategory: reasonForBreak || "FORMER_HIGH_PERFORMER",
      reasonDetails: remarks || `Rejoining effective ${rejoiningDate}`,
      targetDepartment: department,
      targetPosition: designationOnRejoining || matchedEmp?.positionTitle,
      actionData: {
        effective_date: effectiveDate,
        rejoining_date: rejoiningDate,
        previous_employee_code: previousEmployeeCode || employeeId,
        designation_on_rejoining: designationOnRejoining || matchedEmp?.positionTitle,
        gross_salary_on_rejoining: grossSalaryOnRejoining || undefined,
        continuity_allowed: continuityAllowed || undefined,
        reason_for_break: reasonForBreak || undefined,
        remarks: remarks.trim() || undefined,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        rehire_reason: reasonForBreak || "FORMER_HIGH_PERFORMER",
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Log action to the global activity store
    addActivityLog({
      actionId: "rejoining-rehire",
      actionTitle: "Rejoining / Rehire",
      category: "Entry",
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      summary: `Rejoining / rehire recorded for ${selectedEmployeeName}${
        localRec.targetPosition ? ` as ${localRec.targetPosition}` : ""
      }. Rejoining date: ${rejoiningDate}.${continuityAllowed ? ` (${continuityAllowed.split(" — ")[0]})` : ""}`,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: "bg-pastel-lavender",
      tintVar: "--pastel-lavender",
      effectiveDate,
      notes: note.trim() || undefined,
    });

    setIsSubmitting(false);
    handleClosePanel();
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.employeeName.toLowerCase().includes(q);
        const matchesId = r.employeeId.toLowerCase().includes(q);
        const matchesNote = (r.actionData?.note || r.reasonDetails || "").toLowerCase().includes(q);
        const matchesDept = r.department.toLowerCase().includes(q);
        const matchesRole = (r.targetPosition || r.actionData?.designation_on_rejoining || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept && !matchesRole) {
          return false;
        }
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-lavender/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Entry Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Rejoining / Rehire
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
            Record rejoining / rehire
          </Button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <WorkflowMetricCards metrics={metrics} isLoading={isLoading} />

      {/* ── Filters & Search Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-3 shadow-xs">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Employee or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>From</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-36 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>To</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-36 text-xs"
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
              className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear filters
            </Button>
          )}

          <div className="border-l border-border pl-3 text-xs font-medium text-muted-foreground">
            <WorkflowActionCount count={filteredRecords.length} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* ── Content Body ── */}
      {isLoading ? (
        <WorkflowRecordsLoading />
      ) : filteredRecords.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-lavender/70 text-foreground shadow-xs">
            <RotateCcw className="h-7 w-7 stroke-[2]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Nothing recorded yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            No rejoining / rehire has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record rejoining / rehire
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item) => {
            const roleVal =
              item.targetPosition ||
              item.actionData?.designation_on_rejoining ||
              item.designationOnRejoining ||
              "Rehire";
            const rejoiningDateVal =
              item.actionData?.rejoining_date ||
              item.rejoiningDate ||
              item.effectiveDate;
            const reasonVal =
              item.reasonCategory ||
              item.actionData?.reason_for_break ||
              item.reasonForBreak ||
              "Former Employee Return";
            const detailsVal =
              item.reasonDetails ||
              item.actionData?.remarks ||
              item.remarks;
            const prevEmpCodeVal =
              item.actionData?.previous_employee_code ||
              item.previousEmployeeCode;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Employee info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-lavender/80 font-bold text-foreground text-sm shadow-xs">
                      {item.employeeName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-foreground">
                          {item.employeeName}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {item.employeeId}
                        </Badge>
                        {prevEmpCodeVal && (
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            Prior: {prevEmpCodeVal}
                          </Badge>
                        )}
                        <Badge className="bg-pastel-lavender text-foreground text-[10px] font-medium hover:bg-pastel-lavender">
                          {roleVal}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.targetDepartment || item.department} · Effective {item.effectiveDate} · Rejoining Date:{" "}
                        <strong className="text-foreground">{rejoiningDateVal}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] text-muted-foreground">
                      {item.recordedAt ? (
                        isNaN(new Date(item.recordedAt).getTime())
                          ? item.recordedAt
                          : format(new Date(item.recordedAt), "MMM d, yyyy · HH:mm")
                      ) : "—"}
                    </span>
                  </div>
                </div>

                {/* Detail fields preview */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/50 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Rejoining Date</span>
                    <span className="font-semibold text-foreground">{rejoiningDateVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Reason Category</span>
                    <span className="font-medium text-foreground">{reasonVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Target Position</span>
                    <span className="font-medium text-foreground">{roleVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Status</span>
                    <Badge variant="secondary" className="bg-pastel-lavender/60 text-foreground font-medium text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                </div>

                {/* Reason for break & remarks & note */}
                {(detailsVal || item.actionData?.note || item.note) && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
                    {detailsVal && (
                      <div>
                        <span className="font-semibold text-foreground text-[11px]">
                          Details / Notes:
                        </span>
                        <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">
                          {detailsVal}
                        </p>
                      </div>
                    )}

                    {(item.actionData?.note || item.note) && (
                      <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-1">
                        <strong className="text-foreground">Auditor Note: </strong>
                        {item.actionData?.note || item.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Slide-Over Side Panel (Sheet) ── */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border/80 sticky top-0 bg-background/95 backdrop-blur z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl font-bold tracking-tight">
                  Rejoining / Rehire
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-lavender/70 text-foreground text-xs font-mono font-bold uppercase tracking-wider"
                >
                  REJOIN
                </Badge>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
            <SheetDescription className="mt-1.5 text-xs text-muted-foreground">
              Entry process — configure its approval chain in the Workflow Manager.
            </SheetDescription>

            {/* Notice Banner */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>This updates the employee's record immediately and is logged against your name.</span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRecordRehire} className="p-6 space-y-6 flex-1">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* ── Group 1: WHO AND WHEN ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                WHO AND WHEN
              </div>

              {/* Employee */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>
                    Employee <span className="text-destructive">*</span>
                  </span>
                </label>
                <SearchableEmployeeSelect
                  value={selectedEmployeeName}
                  onChange={(val) => {
                    setSelectedEmployeeName(val);
                    setFormError("");
                  }}
                  onSelectEmployee={handleSelectEmployee}
                  error={!!formError && !selectedEmployeeName}
                />
              </div>

              {/* Effective date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Effective date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  When the decision takes effect — not necessarily today.
                </p>
              </div>
            </div>

            {/* ── Group 2: REJOINING / REHIRE DETAILS ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                REJOINING / REHIRE DETAILS
              </div>

              {/* Rejoining date & Previous employee code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Rejoining date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={rejoiningDate}
                    onChange={(e) => setRejoiningDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Previous employee code
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. EMP-1042"
                    value={previousEmployeeCode}
                    onChange={(e) => setPreviousEmployeeCode(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Previous exit date & Designation on rejoining */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Previous exit date
                  </label>
                  <Input
                    type="date"
                    value={previousExitDate}
                    onChange={(e) => setPreviousExitDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Designation on rejoining
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Senior Frontend Specialist"
                    value={designationOnRejoining}
                    onChange={(e) => setDesignationOnRejoining(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Gross salary on rejoining & Continuity of service allowed? */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Gross salary on rejoining
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 190,000 / month"
                    value={grossSalaryOnRejoining}
                    onChange={(e) => setGrossSalaryOnRejoining(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Continuity of service allowed?
                  </label>
                  <Select value={continuityAllowed} onValueChange={setContinuityAllowed}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTINUITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reason for the break in service */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Reason for the break in service
                </label>
                <Textarea
                  placeholder="Record justification for gap period, previous projects, or rehire consideration..."
                  value={reasonForBreak}
                  onChange={(e) => setReasonForBreak(e.target.value)}
                  className="min-h-[70px] text-xs"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Remarks</label>
                <Textarea
                  placeholder="Any additional notes or HR recommendations..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="min-h-[70px] text-xs"
                />
              </div>
            </div>

            {/* ── Group 3: FOR THE RECORD ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                FOR THE RECORD
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Note</label>
                <Textarea
                  placeholder="e.g. Board minute 14/2026, signed letter on file"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[70px] text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Why this was done, and any reference — this is what an auditor reads.
                </p>
              </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 pb-2 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClosePanel}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs cursor-pointer"
              >
                Record rejoining / rehire
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
