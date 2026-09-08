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
  FileX,
  CalendarOff,
  AlertCircle,
  FileText,
  ShieldAlert,
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
import { useActionProcessData, NormalizedActionRecord } from "@/lib/action-center-api";
import {
  WorkflowMetricCards,
  WorkflowRecordsLoading,
  WorkflowActionCount,
} from "./WorkflowCommonComponents";

export interface ContractEndRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  positionTitle: string;
  effectiveDate: string;
  contractEndsOn: string;
  reasonForNonRenewal: string;
  noticeGivenDays?: string;
  clearanceCompleted?: string;
  remarks?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_contract_ends";

const REASONS_FOR_NON_RENEWAL = [
  "Project / Grant completion",
  "Fixed-term mandate concluded",
  "Budget / Headcount reduction",
  "Organizational restructuring",
  "Performance / Skills mismatch",
  "Mutual consent / Employee preference",
  "Other",
];

const CLEARANCE_OPTIONS = [
  "Yes — All assets returned and IT access revoked",
  "In progress — IT revoked, asset handover ongoing",
  "Pending — Scheduled for contract end date",
  "No — Clearance hold flagged",
];

/* ── Searchable Employee Dropdown ── */
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
          "flex h-9 w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-xs shadow-xs transition-colors cursor-pointer text-left",
          error ? "border-destructive ring-1 ring-destructive" : "border-input hover:border-primary/50",
          isOpen && "border-primary ring-1 ring-primary"
        )}
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-peach/80 text-[10px] font-bold text-foreground">
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
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-muted/70 cursor-pointer",
                      isSelected && "bg-pastel-peach/50 font-medium text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-peach/80 text-[10px] font-bold text-foreground">
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

interface ContractEndNonRenewalPageProps {
  onBack?: () => void;
}

export function ContractEndNonRenewalPage({ onBack }: ContractEndNonRenewalPageProps = {}) {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    options,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "CONTRACT_END",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Updates the record",
    defaultFieldCount: 5,
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
  const [contractEndsOn, setContractEndsOn] = useState(todayDateStr);
  const [reasonForNonRenewal, setReasonForNonRenewal] = useState("");
  const [noticeGivenDays, setNoticeGivenDays] = useState("30");
  const [clearanceCompleted, setClearanceCompleted] = useState("");
  const [remarks, setRemarks] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setContractEndsOn(todayDateStr);
    setReasonForNonRenewal("");
    setNoticeGivenDays("30");
    setClearanceCompleted("");
    setRemarks("");
    setNote("");
    setFormError("");
  };

  const handleOpenPanel = () => {
    resetForm();
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    resetForm();
  };

  const handleRecordContractEnd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName.trim()) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Effective date is required.");
      return;
    }
    if (!contractEndsOn) {
      setFormError("Contract ends on date is required.");
      return;
    }
    if (!reasonForNonRenewal.trim()) {
      setFormError("Please select the reason for non-renewal.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((emp) => emp.name === selectedEmployeeName);
    const empId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);

    const localRec: NormalizedActionRecord = {
      id: "ce-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      recordNumber: "CEN-" + Math.floor(100000 + Math.random() * 900000),
      processCode: "CONTRACT_END",
      employeeId: empId,
      employeeName: selectedEmployeeName,
      department: matchedEmp?.department || "Operations",
      effectiveDate,
      status: "SCHEDULED",
      targetPosition: matchedEmp?.positionTitle || "Specialist",
      targetDepartment: matchedEmp?.department || "Operations",
      reasonDetails: reasonForNonRenewal,
      source: "local",
      recordedAt: new Date().toISOString(),
      actionData: {
        positionTitle: matchedEmp?.positionTitle || "Specialist",
        contractEndsOn,
        reasonForNonRenewal,
        noticeGivenDays: noticeGivenDays.trim() || undefined,
        clearanceCompleted: clearanceCompleted || undefined,
        remarks: remarks.trim() || undefined,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId: empId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        end_date: contractEndsOn,
        reason: reasonForNonRenewal,
        clearance_status: clearanceCompleted || undefined,
        note: note.trim() || remarks.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Log action to the global activity store
    addActivityLog({
      actionId: "contract-end-non-renewal",
      actionTitle: "Contract End / Non-renewal",
      category: "Exit",
      employeeName: selectedEmployeeName,
      employeeId: empId,
      department: matchedEmp?.department || "Operations",
      summary: `Contract end / non-renewal recorded for ${selectedEmployeeName}. Contract ends on: ${contractEndsOn}. Reason: ${reasonForNonRenewal}.`,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: "bg-pastel-peach",
      tintVar: "--pastel-peach",
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
        const matchesReason = (r.reasonDetails || (r.actionData?.reasonForNonRenewal as string) || "").toLowerCase().includes(q);
        const matchesRemarks = ((r.actionData?.remarks as string) || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept && !matchesReason && !matchesRemarks) {
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-peach/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Exit Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Contract End / Non-renewal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Exit process — configure its approval chain in the Workflow Manager.
          </p>
        </div>

        <div>
          <Button
            onClick={handleOpenPanel}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Record contract end / non-renewal
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
              className="h-8 w-32 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>To</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 w-32 text-xs"
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
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}

          <div className="text-xs font-semibold text-muted-foreground pl-2 border-l border-border">
            <WorkflowActionCount count={filteredRecords.length} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* ── Content Body ── */}
      {isLoading ? (
        <WorkflowRecordsLoading />
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 py-16 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Nothing recorded yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            No contract end / non-renewal has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record contract end / non-renewal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item) => {
            const role = item.targetPosition || (item.actionData?.positionTitle as string) || "Specialist";
            const endDateVal = (item.actionData?.contractEndsOn as string) || item.effectiveDate;
            const reasonVal = item.reasonDetails || (item.actionData?.reasonForNonRenewal as string) || "Fixed-term mandate concluded";
            const noticeDays = item.actionData?.noticeGivenDays as string | undefined;
            const clearanceVal = item.actionData?.clearanceCompleted as string | undefined;
            const remarksVal = item.actionData?.remarks as string | undefined;
            const noteVal = item.actionData?.note as string | undefined;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Employee info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-peach/80 font-bold text-foreground text-sm shadow-xs">
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
                        <Badge className="bg-pastel-peach text-foreground text-[10px] font-medium hover:bg-pastel-peach">
                          {reasonVal}
                        </Badge>
                        {noticeDays && (
                          <Badge variant="secondary" className="text-[10px]">
                            Notice: {noticeDays} Days
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {role} · {item.department} · Effective {item.effectiveDate} · Contract Ends:{" "}
                        <strong className="text-foreground">{endDateVal}</strong>
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
                    {item.source === "local" && (
                      <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">
                        Local
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Detail fields preview */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/50 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Contract Ends On</span>
                    <span className="font-semibold text-foreground">{endDateVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Reason for Non-Renewal</span>
                    <span className="font-medium text-foreground">{reasonVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Notice Period</span>
                    <span className="font-medium text-foreground">
                      {noticeDays ? `${noticeDays} days` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Clearance Completed</span>
                    <span className="font-medium text-foreground">
                      {clearanceVal ? clearanceVal.split(" — ")[0] : "—"}
                    </span>
                  </div>
                </div>

                {/* Remarks / Auditor Note */}
                {(remarksVal || noteVal) && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
                    {remarksVal && (
                      <div>
                        <strong className="text-foreground text-[11px]">Remarks: </strong>
                        <span className="text-muted-foreground">{remarksVal}</span>
                      </div>
                    )}
                    {noteVal && (
                      <div className="text-muted-foreground border-t border-border/40 pt-1">
                        <strong className="text-foreground text-[11px]">Auditor Note: </strong>
                        {noteVal}
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
                  Contract End / Non-renewal
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-peach/70 text-foreground text-xs font-mono font-bold uppercase tracking-wider"
                >
                  CONTR_END
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
              Exit process — configure its approval chain in the Workflow Manager.
            </SheetDescription>

            {/* Notice Banner */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>This updates the employee's record immediately and is logged against your name.</span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRecordContractEnd} className="p-6 space-y-6 flex-1">
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

            {/* ── Group 2: CONTRACT END / NON-RENEWAL DETAILS ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CONTRACT END / NON-RENEWAL DETAILS
              </div>

              {/* Contract ends on & Reason for non-renewal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Contract ends on <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={contractEndsOn}
                    onChange={(e) => setContractEndsOn(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Reason for non-renewal <span className="text-destructive">*</span>
                  </label>
                  <Select value={reasonForNonRenewal} onValueChange={setReasonForNonRenewal}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {REASONS_FOR_NON_RENEWAL.map((reason) => (
                        <SelectItem key={reason} value={reason} className="text-xs">
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notice given (days) & Clearance completed? */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Notice given (days)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    placeholder="e.g. 30"
                    value={noticeGivenDays}
                    onChange={(e) => setNoticeGivenDays(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Clearance completed?
                  </label>
                  <Select value={clearanceCompleted} onValueChange={setClearanceCompleted}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLEARANCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Remarks</label>
                <Textarea
                  placeholder="Record additional offboarding instructions, asset return schedule, or handover items..."
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
                Record contract end / non-renewal
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
