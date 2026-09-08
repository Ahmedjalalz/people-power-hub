import { useState, useMemo, useEffect, useRef } from "react";
import { format, formatDistanceToNow, addMonths } from "date-fns";
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
  FileSignature,
  FileText,
  UploadCloud,
  DollarSign,
  AlertCircle,
  Paperclip,
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

export interface ContractRenewalRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  effectiveDate: string;
  currentContractEnds?: string;
  newContractEndDate: string;
  renewalTermMonths?: string;
  revisedGrossSalary?: string;
  justification?: string;
  signedContractFileName?: string;
  signedContractFileSize?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_contract_renewals";

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
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-sky/80 text-[10px] font-bold text-primary">
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
                      isSelected && "bg-pastel-sky/50 font-medium text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-sky/80 text-[10px] font-bold text-primary">
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

interface ContractRenewalExtensionPageProps {
  onBack?: () => void;
}

export function ContractRenewalExtensionPage({ onBack }: ContractRenewalExtensionPageProps = {}) {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "CONTRACT_RENEW",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Logged only",
    defaultFieldCount: 6,
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
  const [currentContractEnds, setCurrentContractEnds] = useState("");
  const [newContractEndDate, setNewContractEndDate] = useState("");
  const [renewalTermMonths, setRenewalTermMonths] = useState("12");
  const [revisedGrossSalary, setRevisedGrossSalary] = useState("");
  const [justification, setJustification] = useState("");
  const [signedContractFile, setSignedContractFile] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate newContractEndDate when renewalTermMonths, currentContractEnds or effectiveDate changes
  const handleTermChange = (val: string) => {
    setRenewalTermMonths(val);
    const monthsNum = parseInt(val, 10);
    if (!isNaN(monthsNum) && monthsNum > 0) {
      const baseDateStr = currentContractEnds || effectiveDate || todayDateStr;
      try {
        const base = new Date(baseDateStr);
        setNewContractEndDate(format(addMonths(base, monthsNum), "yyyy-MM-dd"));
      } catch {
        // keep existing
      }
    }
  };

  const handleCurrentContractEndsChange = (val: string) => {
    setCurrentContractEnds(val);
    const monthsNum = parseInt(renewalTermMonths, 10);
    if (!isNaN(monthsNum) && monthsNum > 0 && val) {
      try {
        const base = new Date(val);
        setNewContractEndDate(format(addMonths(base, monthsNum), "yyyy-MM-dd"));
      } catch {
        // keep existing
      }
    }
  };

  const handleEffectiveDateChange = (val: string) => {
    setEffectiveDate(val);
    if (!currentContractEnds) {
      const monthsNum = parseInt(renewalTermMonths, 10);
      if (!isNaN(monthsNum) && monthsNum > 0 && val) {
        try {
          const base = new Date(val);
          setNewContractEndDate(format(addMonths(base, monthsNum), "yyyy-MM-dd"));
        } catch {
          // keep existing
        }
      }
    }
  };

  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setCurrentContractEnds("");
    try {
      setNewContractEndDate(format(addMonths(new Date(), 12), "yyyy-MM-dd"));
    } catch {
      setNewContractEndDate("");
    }
    setRenewalTermMonths("12");
    setRevisedGrossSalary("");
    setJustification("");
    setSignedContractFile(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKB = (file.size / 1024).toFixed(1);
      setSignedContractFile({
        name: file.name,
        size: `${sizeKB} KB`,
      });
    }
  };

  const handleRecordRenewal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName.trim()) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Effective date is required.");
      return;
    }
    if (!newContractEndDate) {
      setFormError("New contract end date is required.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((emp) => emp.name === selectedEmployeeName);
    const employeeId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const department = matchedEmp?.department || "Operations";

    const localRec: NormalizedActionRecord = {
      id: "cr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      effectiveDate,
      status: "APPLIED",
      performedBy: "Ahmad Jalal (HR Lead)",
      recordedAt: new Date().toISOString(),
      reasonCategory: "CONTRACT_EXTENSION",
      reasonDetails: justification || `Renewed contract until ${newContractEndDate}`,
      actionData: {
        effective_date: effectiveDate,
        new_end_date: newContractEndDate,
        renewal_term_months: Number(renewalTermMonths) || 12,
        current_contract_ends: currentContractEnds || undefined,
        revised_gross_salary: revisedGrossSalary.trim() || undefined,
        justification: justification.trim() || undefined,
        signed_contract_file_name: signedContractFile?.name,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        new_end_date: newContractEndDate,
        renewal_term_months: Number(renewalTermMonths) || 12,
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Log action to the global activity store
    addActivityLog({
      actionId: "contract-renewal-extension",
      actionTitle: "Contract Renewal / Extension",
      category: "Entry",
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      summary: `Contract renewed for ${selectedEmployeeName} (${department}) for ${renewalTermMonths} months until ${newContractEndDate}.${
        revisedGrossSalary ? ` Revised salary: ${revisedGrossSalary}.` : ""
      }`,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: "bg-pastel-sky",
      tintVar: "--pastel-sky",
      effectiveDate,
      notes: note.trim() || undefined,
    });

    setIsSubmitting(false);
    handleClosePanel();
  };

  // Metrics
  const totalRecorded = metrics?.allTime ?? 0;
  const last30DaysCount = metrics?.last30Days ?? 0;

  const lastPerformedFormatted = useMemo(() => {
    if (!records || records.length === 0) return "—";
    const latest = records[0];
    try {
      return formatDistanceToNow(new Date(latest.recordedAt), { addSuffix: true });
    } catch {
      return latest.effectiveDate;
    }
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.employeeName.toLowerCase().includes(q);
        const matchesId = r.employeeId.toLowerCase().includes(q);
        const matchesNote = (r.actionData?.note || r.reasonDetails || "").toLowerCase().includes(q);
        const matchesDept = r.department.toLowerCase().includes(q);
        const matchesJustification = (r.actionData?.justification || r.reasonDetails || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept && !matchesJustification) {
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-sky/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Entry Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Contract Renewal / Extension
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
            Record contract renewal / extension
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-sky/70 text-foreground shadow-xs">
            <FileSignature className="h-7 w-7 stroke-[2]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Nothing recorded yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            No contract renewal / extension has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record contract renewal / extension
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item) => {
            const renewalTermVal =
              item.actionData?.renewal_term_months ?? item.renewalTermMonths;
            const newEndDateVal =
              item.actionData?.new_end_date ??
              item.actionData?.new_contract_end_date ??
              item.newContractEndDate ??
              item.effectiveDate;
            const currentContractVal =
              item.actionData?.current_contract_ends ??
              item.currentContractEnds ??
              "—";
            const revisedSalaryVal =
              item.actionData?.revised_gross_salary ??
              item.revisedGrossSalary ??
              "Unchanged";
            const justificationVal =
              item.actionData?.justification ?? item.reasonDetails;
            const noteVal =
              item.actionData?.note ?? item.reasonCategory;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Employee info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-sky/80 font-bold text-primary text-sm shadow-xs">
                      {item.employeeName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-foreground">
                          {item.employeeName}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {item.employeeId}
                        </Badge>
                        {renewalTermVal && (
                          <Badge className="bg-pastel-sky text-foreground text-[10px] font-medium hover:bg-pastel-sky">
                            {renewalTermVal} Months Renewal
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.department} · Effective {item.effectiveDate} · New End Date:{" "}
                        <strong className="text-foreground">{newEndDateVal}</strong>
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
                    <span className="text-muted-foreground block text-[11px]">Current Contract Ends</span>
                    <span className="font-medium text-foreground">
                      {currentContractVal}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">New Contract End Date</span>
                    <span className="font-medium text-foreground">{newEndDateVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Revised Gross Salary</span>
                    <span className="font-medium text-foreground">
                      {revisedSalaryVal}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Renewal Term</span>
                    <span className="font-medium text-foreground">
                      {renewalTermVal ? `${renewalTermVal} months` : "—"}
                    </span>
                  </div>
                </div>

                {/* Justification / File / Note */}
                {(justificationVal || item.signedContractFileName || noteVal) && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-2">
                    {justificationVal && (
                      <div>
                        <span className="font-semibold text-foreground text-[11px]">
                          Justification / Business Need:
                        </span>
                        <p className="mt-0.5 text-muted-foreground leading-relaxed whitespace-pre-line">
                          {justificationVal}
                        </p>
                      </div>
                    )}

                    {item.signedContractFileName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">
                          {item.signedContractFileName}
                        </span>
                        {item.signedContractFileSize && (
                          <span className="text-[11px] text-muted-foreground">
                            ({item.signedContractFileSize})
                          </span>
                        )}
                      </div>
                    )}

                    {noteVal && noteVal !== "—" && (
                      <div className="text-[11px] text-muted-foreground border-t border-border/30 pt-1">
                        <strong className="text-foreground">Auditor Note: </strong>
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
                  Contract Renewal / Extension
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-sky/70 text-foreground text-xs font-mono font-bold uppercase tracking-wider"
                >
                  CONTR_RENEW
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
          <form onSubmit={handleRecordRenewal} className="p-6 space-y-6 flex-1">
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
                  onChange={(e) => handleEffectiveDateChange(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  When the decision takes effect — not necessarily today.
                </p>
              </div>
            </div>

            {/* ── Group 2: CONTRACT RENEWAL / EXTENSION DETAILS ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CONTRACT RENEWAL / EXTENSION DETAILS
              </div>

              {/* Current contract ends & New contract end date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Current contract ends
                  </label>
                  <Input
                    type="date"
                    value={currentContractEnds}
                    onChange={(e) => handleCurrentContractEndsChange(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Previous expiry date if known.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    New contract end date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={newContractEndDate}
                    onChange={(e) => setNewContractEndDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Updated contract expiry date.</p>
                </div>
              </div>

              {/* Renewal term (months) & Revised gross salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Renewal term (months)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 12"
                    value={renewalTermMonths}
                    onChange={(e) => handleTermChange(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Auto-updates new end date.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Revised gross salary
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 150,000 / month"
                    value={revisedGrossSalary}
                    onChange={(e) => setRevisedGrossSalary(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank if unchanged.
                  </p>
                </div>
              </div>

              {/* Justification */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Justification</label>
                <Textarea
                  placeholder="Record operational need, performance review summary, or project extension reasons..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="min-h-[80px] text-xs"
                />
              </div>

              {/* Signed contract file upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Signed contract</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {signedContractFile ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pastel-sky/70 text-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate text-xs">
                        <p className="font-medium text-foreground truncate">
                          {signedContractFile.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {signedContractFile.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSignedContractFile(null);
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
                      PDF, Word, or image scan (max 15MB)
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
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs cursor-pointer"
              >
                Record contract renewal / extension
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
