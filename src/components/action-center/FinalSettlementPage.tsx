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
  Receipt,
  FileText,
  UploadCloud,
  DollarSign,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Calculator,
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

export interface FinalSettlementRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  positionTitle: string;
  effectiveDate: string;
  settlementDate: string;
  lastWorkingDay: string;
  unpaidSalaryDays?: string;
  leaveEncashmentDays?: string;
  gratuity?: string;
  otherPayments?: string;
  loanAdvanceRecovery?: string;
  otherDeductions?: string;
  netPayable: string;
  clearanceCompleted: string;
  remarks?: string;
  settlementSheetFileName?: string;
  settlementSheetFileSize?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_final_settlements";

const CLEARANCE_OPTIONS = [
  "Yes — 100% full clearance verified",
  "Pending — Finance clearance in progress",
  "Pending — IT asset return in progress",
  "No — Outstanding clearance liabilities",
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
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-teal/80 text-[10px] font-bold text-foreground">
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
                      isSelected && "bg-pastel-teal/50 font-medium text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-teal/80 text-[10px] font-bold text-foreground">
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

interface FinalSettlementPageProps {
  onBack?: () => void;
}

export function FinalSettlementPage({ onBack }: FinalSettlementPageProps = {}) {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    options,
    isLoading,
    recordAction,
    deleteRecord,
  } = useActionProcessData({
    processCode: "FINAL_SETTLEMENT",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Logged only",
    defaultFieldCount: 12,
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
  const [settlementDate, setSettlementDate] = useState(todayDateStr);
  const [lastWorkingDay, setLastWorkingDay] = useState(todayDateStr);
  const [unpaidSalaryDays, setUnpaidSalaryDays] = useState("");
  const [leaveEncashmentDays, setLeaveEncashmentDays] = useState("");
  const [gratuity, setGratuity] = useState("");
  const [otherPayments, setOtherPayments] = useState("");
  const [loanAdvanceRecovery, setLoanAdvanceRecovery] = useState("");
  const [otherDeductions, setOtherDeductions] = useState("");
  const [netPayable, setNetPayable] = useState("");
  const [clearanceCompleted, setClearanceCompleted] = useState("");
  const [remarks, setRemarks] = useState("");
  const [settlementSheetFile, setSettlementSheetFile] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setSettlementDate(todayDateStr);
    setLastWorkingDay(todayDateStr);
    setUnpaidSalaryDays("");
    setLeaveEncashmentDays("");
    setGratuity("");
    setOtherPayments("");
    setLoanAdvanceRecovery("");
    setOtherDeductions("");
    setNetPayable("");
    setClearanceCompleted("");
    setRemarks("");
    setSettlementSheetFile(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKB = (file.size / 1024).toFixed(1);
      setSettlementSheetFile({
        name: file.name,
        size: `${sizeKB} KB`,
      });
    }
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName.trim()) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Effective date is required.");
      return;
    }
    if (!settlementDate) {
      setFormError("Settlement date is required.");
      return;
    }
    if (!lastWorkingDay) {
      setFormError("Last working day is required.");
      return;
    }
    if (!netPayable.trim()) {
      setFormError("Net payable amount is required.");
      return;
    }
    if (!clearanceCompleted) {
      setFormError("Please indicate whether clearance is completed.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((emp) => emp.name === selectedEmployeeName);
    const empId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);

    const localRec: NormalizedActionRecord = {
      id: "fs-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      employeeName: selectedEmployeeName,
      employeeId: empId,
      department: matchedEmp?.department || "Operations",
      effectiveDate,
      status: "SCHEDULED",
      performedBy: "Ahmad Jalal (HR Lead)",
      recordedAt: new Date().toISOString(),
      reasonDetails: remarks.trim() || undefined,
      targetDepartment: matchedEmp?.department || "Operations",
      targetPosition: matchedEmp?.positionTitle || "Specialist",
      actionData: {
        settlementDate,
        lastWorkingDay,
        unpaidSalaryDays: unpaidSalaryDays.trim() || undefined,
        leaveEncashmentDays: leaveEncashmentDays.trim() || undefined,
        gratuity: gratuity.trim() || undefined,
        otherPayments: otherPayments.trim() || undefined,
        loanAdvanceRecovery: loanAdvanceRecovery.trim() || undefined,
        otherDeductions: otherDeductions.trim() || undefined,
        netPayable: netPayable.trim(),
        clearanceCompleted,
        remarks: remarks.trim() || undefined,
        settlementSheetFileName: settlementSheetFile?.name,
        settlementSheetFileSize: settlementSheetFile?.size,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId: empId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        settlement_date: settlementDate,
        last_working_day: lastWorkingDay,
        net_payable: netPayable.trim(),
        clearance_completed: clearanceCompleted,
        remarks: remarks.trim() || undefined,
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Log action to the global activity store
    addActivityLog({
      actionId: "final-settlement",
      actionTitle: "Final Settlement",
      category: "Exit",
      employeeName: selectedEmployeeName,
      employeeId: empId,
      department: matchedEmp?.department || "Operations",
      summary: `Final settlement recorded for ${selectedEmployeeName}. Net payable: ${netPayable}. Settlement date: ${settlementDate}.`,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: "bg-pastel-teal",
      tintVar: "--pastel-teal",
      effectiveDate,
      notes: note.trim() || undefined,
    });

    setIsSubmitting(false);
    handleClosePanel();
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Are you sure you want to remove this final settlement record?")) {
      deleteRecord(id);
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.employeeName.toLowerCase().includes(q);
        const matchesId = r.employeeId.toLowerCase().includes(q);
        const matchesNote = (r.actionData?.note || "")?.toLowerCase().includes(q);
        const matchesDept = r.department.toLowerCase().includes(q);
        const matchesRemarks = (r.actionData?.remarks || r.reasonDetails || "")?.toLowerCase().includes(q);
        const matchesPayable = (r.actionData?.netPayable || r.actionData?.net_payable || "")?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept && !matchesRemarks && !matchesPayable) {
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-teal/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Exit Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Final Settlement
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
            Record final settlement
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
              Clear
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-teal/70 text-foreground shadow-xs">
            <Receipt className="h-7 w-7 stroke-[2]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Nothing recorded yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            No final settlement has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record final settlement
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item) => {
            const netPayableVal =
              item.actionData?.netPayable ||
              item.actionData?.net_payable ||
              (item.reasonCategory ? `${item.reasonCategory}` : "$0");
            const clearanceVal =
              item.actionData?.clearanceCompleted ||
              item.actionData?.clearance_status ||
              "Clearance verified";
            const posTitle =
              item.targetPosition ||
              item.actionData?.positionTitle ||
              "Specialist";
            const settlementDateVal =
              item.actionData?.settlementDate ||
              item.actionData?.settlement_date ||
              item.effectiveDate;
            const lastWorkingDayVal =
              item.actionData?.lastWorkingDay ||
              item.actionData?.last_working_day ||
              item.effectiveDate;
            const unpaidSalary =
              item.actionData?.unpaidSalaryDays || item.actionData?.unpaid_salary_days;
            const leaveEncashment =
              item.actionData?.leaveEncashmentDays || item.actionData?.leave_encashment_days;
            const gratuityVal = item.actionData?.gratuity;
            const otherPaymentsVal =
              item.actionData?.otherPayments || item.actionData?.other_payments;
            const loanAdvance =
              item.actionData?.loanAdvanceRecovery || item.actionData?.loan_advance_recovery;
            const otherDeductionsVal =
              item.actionData?.otherDeductions || item.actionData?.other_deductions;
            const remarksVal = item.reasonDetails || item.actionData?.remarks;
            const sheetFileName = item.actionData?.settlementSheetFileName;
            const sheetFileSize = item.actionData?.settlementSheetFileSize;
            const noteVal = item.actionData?.note;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Employee info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-teal/80 font-bold text-foreground text-sm shadow-xs">
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
                        <Badge className="bg-pastel-teal text-foreground text-[10px] font-semibold hover:bg-pastel-teal">
                          Net: {netPayableVal}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {clearanceVal.split(" — ")[0]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {posTitle} · {item.department} · Effective {item.effectiveDate} · Last Day: {lastWorkingDayVal}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] text-muted-foreground">
                      {item.recordedAt ? format(new Date(item.recordedAt), "MMM d, yyyy · HH:mm") : "—"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecord(item.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Breakdown metrics */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/50 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Settlement Date</span>
                    <span className="font-semibold text-foreground">{settlementDateVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Unpaid Salary / Leaves</span>
                    <span className="font-medium text-foreground">
                      {unpaidSalary ? `${unpaidSalary}d salary` : "0d"} /{" "}
                      {leaveEncashment ? `${leaveEncashment}d leave` : "0d"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Gratuity / Other Pay</span>
                    <span className="font-medium text-foreground">
                      {gratuityVal || "0"} {otherPaymentsVal ? `(+${otherPaymentsVal})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Deductions & Recoveries</span>
                    <span className="font-medium text-foreground">
                      {loanAdvance || otherDeductionsVal
                        ? `-${loanAdvance || "0"} / -${otherDeductionsVal || "0"}`
                        : "0"}
                    </span>
                  </div>
                </div>

                {/* Remarks / File Sheet / Auditor Note */}
                {(remarksVal || sheetFileName || noteVal) && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-2">
                    {remarksVal && (
                      <div>
                        <strong className="text-foreground text-[11px]">Remarks: </strong>
                        <span className="text-muted-foreground">{remarksVal}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      {sheetFileName && (
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs">
                          <Paperclip className="h-3.5 w-3.5 text-primary" />
                          <span>{sheetFileName}</span>
                          {sheetFileSize && (
                            <span className="text-muted-foreground">({sheetFileSize})</span>
                          )}
                        </div>
                      )}

                      {noteVal && (
                        <div className="text-muted-foreground">
                          <strong className="text-foreground text-[11px]">Auditor Note: </strong>
                          {noteVal}
                        </div>
                      )}
                    </div>
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
                  Final Settlement
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-teal/70 text-foreground text-xs font-mono font-bold uppercase tracking-wider"
                >
                  SETTLEMENT
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
              <span>This is recorded in the activity log against your name. It does not change other records automatically.</span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRecordSettlement} className="p-6 space-y-6 flex-1">
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

            {/* ── Group 2: FINAL SETTLEMENT DETAILS ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                FINAL SETTLEMENT DETAILS
              </div>

              {/* Settlement date & Last working day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Settlement date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Last working day <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={lastWorkingDay}
                    onChange={(e) => setLastWorkingDay(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Unpaid salary (days) & Leave encashment (days) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Unpaid salary (days)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={unpaidSalaryDays}
                    onChange={(e) => setUnpaidSalaryDays(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Leave encashment (days)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 12"
                    value={leaveEncashmentDays}
                    onChange={(e) => setLeaveEncashmentDays(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Gratuity & Other payments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Gratuity
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 250,000"
                    value={gratuity}
                    onChange={(e) => setGratuity(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Other payments
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Bonus / Allowance"
                    value={otherPayments}
                    onChange={(e) => setOtherPayments(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Loan / advance recovery & Other deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Loan / advance recovery
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 45,000"
                    value={loanAdvanceRecovery}
                    onChange={(e) => setLoanAdvanceRecovery(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Other deductions
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Tax / Notice shortfall"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Net payable & Clearance completed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Net payable <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 385,500"
                    value={netPayable}
                    onChange={(e) => setNetPayable(e.target.value)}
                    className="h-9 text-xs font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Clearance completed? <span className="text-destructive">*</span>
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
                  placeholder="Record calculation specifics, disbursement cheque/IBAN details, or clearance remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="min-h-[70px] text-xs"
                />
              </div>

              {/* Settlement sheet file upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Settlement sheet</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {settlementSheetFile ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pastel-teal/70 text-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate text-xs">
                        <p className="font-medium text-foreground truncate">
                          {settlementSheetFile.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {settlementSheetFile.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSettlementSheetFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-input bg-card/60 p-4 text-center transition-colors hover:border-primary/60 hover:bg-muted/30 cursor-pointer"
                  >
                    <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-foreground">Choose a file...</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Excel, PDF, or scanned sheet (max 15MB)
                    </span>
                  </button>
                )}
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
                disabled={isSubmitting}
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs cursor-pointer"
              >
                {isSubmitting ? "Recording..." : "Record final settlement"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
