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
  Zap,
  Briefcase,
  AlertCircle,
  FileText,
  DollarSign,
  Layers,
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

export interface ActingChargeRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  currentDesignation: string;
  effectiveDate: string;
  actingChargeFrom: string;
  actingChargeTo?: string;
  positionHeld: string;
  actingAllowance?: string;
  reason?: string;
  details?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_acting_charges";

const REASON_OPTIONS = [
  "Interim Cover — Vacant Position Under Recruitment",
  "Extended Medical Leave Cover",
  "Maternity / Parental Leave Cover",
  "Special Project Leadership / Task Force",
  "Temporary Operational Need",
  "Executive Succession Transition",
  "Sabbatical / Study Leave Cover",
  "Other",
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
          error
            ? "border-destructive/60 ring-2 ring-destructive/10"
            : "border-border hover:border-muted-foreground/40",
          !value && "text-muted-foreground"
        )}
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2.5 text-left truncate">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pastel-peach text-xs font-semibold text-foreground border border-border/40">
              {selectedEmp.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="truncate">
              <span className="font-medium text-foreground">{selectedEmp.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({selectedEmp.department} · {selectedEmp.positionTitle})
              </span>
            </div>
          </div>
        ) : (
          <span>Search employees...</span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          <div className="p-2 border-b border-border bg-muted/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/20">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No employees found
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
                      "w-full flex items-center justify-between p-2 rounded-md text-left text-xs transition-colors hover:bg-muted/60",
                      isSelected && "bg-pastel-peach/40 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-peach text-[10px] font-semibold text-foreground border border-border/30">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <div className="text-foreground font-medium">{emp.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {emp.department} • {emp.positionTitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
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

export function ActingAdditionalChargePage() {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    options,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "ACTING_CHARGE",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Logged only",
    defaultFieldCount: 6,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Slide-over Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form State
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [actingChargeFrom, setActingChargeFrom] = useState("");
  const [actingChargeTo, setActingChargeTo] = useState("");
  const [positionHeld, setPositionHeld] = useState("");
  const [actingAllowance, setActingAllowance] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Selected employee metadata
  const selectedEmpMeta = useMemo(() => {
    return employees.find((e) => e.name === selectedEmployeeName);
  }, [selectedEmployeeName]);

  // Reset form
  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(format(new Date(), "yyyy-MM-dd"));
    setActingChargeFrom("");
    setActingChargeTo("");
    setPositionHeld("");
    setActingAllowance("");
    setReason("");
    setDetails("");
    setNote("");
    setErrors({});
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.targetPosition || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((r.actionData?.positionHeld || "") as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.actionData?.note && (r.actionData.note as string).toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.reasonDetails && r.reasonDetails.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchFrom = true;
      if (dateFrom) {
        matchFrom = new Date(r.effectiveDate) >= new Date(dateFrom);
      }

      let matchTo = true;
      if (dateTo) {
        matchTo = new Date(r.effectiveDate) <= new Date(dateTo);
      }

      return matchSearch && matchFrom && matchTo;
    });
  }, [records, searchQuery, dateFrom, dateTo]);

  // Handle Submit
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!selectedEmployeeName) {
      newErrors.employee = "Please select an employee";
    }
    if (!effectiveDate) {
      newErrors.effectiveDate = "Effective date is required";
    }
    if (!actingChargeFrom) {
      newErrors.actingChargeFrom = "Acting charge from date is required";
    }
    if (!positionHeld.trim()) {
      newErrors.positionHeld = "Position / charge held is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const empId = selectedEmpMeta?.id || "EMP-CUSTOM";

    const localRec: NormalizedActionRecord = {
      id: `acting-${Date.now()}`,
      recordNumber: "ACT-" + Math.floor(100000 + Math.random() * 900000),
      processCode: "ACTING_CHARGE",
      employeeId: empId,
      employeeName: selectedEmployeeName,
      department: selectedEmpMeta?.department || "General",
      effectiveDate,
      status: "APPLIED",
      targetPosition: positionHeld.trim(),
      targetDepartment: selectedEmpMeta?.department || "General",
      reasonDetails: reason || details.trim() || undefined,
      source: "local",
      recordedAt: new Date().toISOString(),
      actionData: {
        currentDesignation: selectedEmpMeta?.positionTitle || "Staff",
        actingChargeFrom,
        actingChargeTo: actingChargeTo.trim() || undefined,
        positionHeld: positionHeld.trim(),
        actingAllowance: actingAllowance.trim() || undefined,
        reason: reason || undefined,
        details: details.trim() || undefined,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId: empId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        acting_from: actingChargeFrom,
        acting_to: actingChargeTo.trim() || undefined,
        target_position_name: positionHeld.trim(),
        allowance: actingAllowance.trim() || undefined,
        reason: reason || details.trim() || undefined,
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Add activity log to central Activity Store
    addActivityLog({
      actionId: "acting-additional-charge",
      actionTitle: "Acting / Additional Charge",
      category: "Movement",
      employeeName: selectedEmployeeName,
      employeeId: empId,
      department: selectedEmpMeta?.department || "General",
      summary: `Assigned acting charge of ${positionHeld.trim()} (From ${actingChargeFrom}${
        actingChargeTo ? ` to ${actingChargeTo}` : ""
      })`,
      notes: note.trim() || details.trim() || `Acting allowance: ${actingAllowance || "None specified"}`,
      status: "Completed",
      performedBy: "Ahmad Jalal (HR Lead)",
      tintClass: "bg-pastel-peach",
      tintVar: "--pastel-peach",
      effectiveDate,
    });

    setIsSubmitting(false);
    resetForm();
    setIsSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Navigation Link ── */}
      <div>
        <Link
          to="/task-center"
          search={{ tab: "action-center" }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group mb-3"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Task Center
        </Link>

        {/* ── Header Title & Record Button ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Acting / Additional Charge
              </h1>
              <Badge
                variant="outline"
                className="bg-pastel-peach/50 text-foreground border-border/50 text-xs px-2 py-0.5"
              >
                Movement
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Movement process — configure its approval chain in the Workflow Manager.
            </p>
          </div>

          <Button
            onClick={() => setIsSheetOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            + Record acting / additional charge
          </Button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <WorkflowMetricCards metrics={metrics} isLoading={isLoading} />

      {/* ── Filters & Search ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Employee or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1">
              <span className="text-xs text-muted-foreground font-medium">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1">
              <span className="text-xs text-muted-foreground font-medium">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none"
              />
            </div>

            {(searchQuery || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs font-semibold text-muted-foreground text-right self-end md:self-center">
          <WorkflowActionCount count={filteredRecords.length} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Content Body: Empty State or Populated List ── */}
      {isLoading ? (
        <WorkflowRecordsLoading />
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pastel-peach/40 text-foreground mb-4">
            <Briefcase className="h-6 w-6 text-foreground/70" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Nothing recorded yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            No acting / additional charge has been recorded yet. Use the button above to record one.
          </p>
          <div className="mt-5">
            <Button
              onClick={() => setIsSheetOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2"
            >
              <Plus className="h-4 w-4" />
              + Record acting / additional charge
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRecords.map((item) => {
            const roleHeld = item.targetPosition || (item.actionData?.positionHeld as string) || "Charge Assigned";
            const substantiveRole = (item.actionData?.currentDesignation as string) || "Staff";
            const chargeFrom = (item.actionData?.actingChargeFrom as string) || item.effectiveDate;
            const chargeTo = item.actionData?.actingChargeTo as string | undefined;
            const allowance = (item.actionData?.actingAllowance || item.actionData?.allowance) as string | undefined;
            const reasonText = (item.actionData?.reason || item.reasonDetails) as string | undefined;
            const detailsText = item.actionData?.details as string | undefined;
            const noteText = item.actionData?.note as string | undefined;

            return (
              <div
                key={item.id}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-muted-foreground/30 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-peach text-sm font-semibold text-foreground border border-border/40">
                      {item.employeeName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground text-base">
                          {item.employeeName}
                        </h4>
                        <Badge variant="outline" className="text-xs bg-muted/30">
                          {item.employeeId}
                        </Badge>
                        <Badge className="bg-pastel-peach/70 text-foreground border-border/50 text-xs font-medium">
                          Acting Charge
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Substantive: {substantiveRole} ({item.department})
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-1 text-foreground font-medium bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                          <span>Position Held: {roleHeld}</span>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Charge Period: {chargeFrom}{" "}
                            {chargeTo ? `to ${chargeTo}` : "(Ongoing)"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Effective: {item.effectiveDate}</span>
                        </div>

                        {allowance && (
                          <div className="flex items-center gap-1 text-emerald-600 font-medium">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Allowance: {allowance}</span>
                          </div>
                        )}
                      </div>

                      {reasonText && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Reason: </span>
                          {reasonText}
                        </div>
                      )}

                      {detailsText && (
                        <p className="mt-2 text-xs text-foreground/80 bg-muted/20 p-2.5 rounded-lg border border-border/40">
                          {detailsText}
                        </p>
                      )}

                      {noteText && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground italic">
                          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span>Audit Note: {noteText}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <span className="text-[11px] text-muted-foreground">
                      {item.recordedAt ? (
                        isNaN(new Date(item.recordedAt).getTime())
                          ? item.recordedAt
                          : format(new Date(item.recordedAt), "dd MMM yyyy, hh:mm a")
                      ) : "—"}
                    </span>
                    {item.source === "local" && (
                      <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">
                        Local
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Slide-Over Sheet Panel: + Record acting / additional charge ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col gap-0">
          {/* Header */}
          <div className="p-6 border-b border-border bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl font-bold text-foreground">
                  Acting / Additional Charge
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-peach text-foreground font-semibold text-[11px] border-border/60 uppercase"
                >
                  ACTING
                </Badge>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-1.5">
              Movement process — configure its approval chain in the Workflow Manager.
            </SheetDescription>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRecordSubmit} className="flex-1 p-6 space-y-6">
            {/* Notice Banner */}
            <div className="flex items-start gap-3 rounded-xl border border-sky-200/60 bg-pastel-sky/30 p-3.5 text-xs text-foreground">
              <Info className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
              <p>
                This is recorded in the activity log against your name. It does not change other
                records automatically.
              </p>
            </div>

            {/* ── Group: WHO AND WHEN ── */}
            <div className="space-y-4">
              <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase pb-1 border-b border-border/60">
                Who and When
              </div>

              {/* Employee* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Employee <span className="text-destructive">*</span>
                </label>
                <SearchableEmployeeSelect
                  value={selectedEmployeeName}
                  onChange={(val) => {
                    setSelectedEmployeeName(val);
                    if (errors.employee) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.employee;
                        return n;
                      });
                    }
                  }}
                  error={Boolean(errors.employee)}
                />
                {errors.employee && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.employee}
                  </p>
                )}
              </div>

              {/* Effective date* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Effective date <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => {
                      setEffectiveDate(e.target.value);
                      if (errors.effectiveDate) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n.effectiveDate;
                          return n;
                        });
                      }
                    }}
                    className={cn(
                      "h-9 text-xs bg-background",
                      errors.effectiveDate && "border-destructive/60"
                    )}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  When the decision takes effect — not necessarily today.
                </p>
                {errors.effectiveDate && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.effectiveDate}
                  </p>
                )}
              </div>
            </div>

            {/* ── Group: ACTING / ADDITIONAL CHARGE DETAILS ── */}
            <div className="space-y-4">
              <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase pb-1 border-b border-border/60">
                Acting / Additional Charge Details
              </div>

              {/* Charge Dates: From & To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Acting charge from <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    placeholder="Select date"
                    value={actingChargeFrom}
                    onChange={(e) => {
                      setActingChargeFrom(e.target.value);
                      if (errors.actingChargeFrom) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n.actingChargeFrom;
                          return n;
                        });
                      }
                    }}
                    className={cn(
                      "h-9 text-xs bg-background",
                      errors.actingChargeFrom && "border-destructive/60"
                    )}
                  />
                  {errors.actingChargeFrom && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.actingChargeFrom}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Acting charge to
                  </label>
                  <Input
                    type="date"
                    placeholder="Select date"
                    value={actingChargeTo}
                    onChange={(e) => setActingChargeTo(e.target.value)}
                    className="h-9 text-xs bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank if ongoing or indefinite.
                  </p>
                </div>
              </div>

              {/* Position / charge held* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Position / charge held <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Interim Head of Product / Acting Finance Manager"
                  value={positionHeld}
                  onChange={(e) => {
                    setPositionHeld(e.target.value);
                    if (errors.positionHeld) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.positionHeld;
                        return n;
                      });
                    }
                  }}
                  className={cn(
                    "h-9 text-xs bg-background",
                    errors.positionHeld && "border-destructive/60"
                  )}
                />
                {errors.positionHeld && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.positionHeld}
                  </p>
                )}
              </div>

              {/* Acting allowance */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Acting allowance
                </label>
                <Input
                  type="text"
                  placeholder="e.g. $1,200 / month, 15% special charge allowance"
                  value={actingAllowance}
                  onChange={(e) => setActingAllowance(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Reason
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Details
                </label>
                <Textarea
                  placeholder="Specific scope of responsibilities, signing authorities, or operational terms..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="text-xs bg-background resize-none"
                />
              </div>
            </div>

            {/* ── Group: FOR THE RECORD ── */}
            <div className="space-y-4">
              <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase pb-1 border-b border-border/60">
                For the Record
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Note</label>
                <Textarea
                  placeholder="e.g. Board minute 14/2026, signed letter on file"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="text-xs bg-background resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  Why this was done, and any reference — this is what an auditor reads.
                </p>
              </div>
            </div>

            {/* Panel Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsSheetOpen(false);
                }}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs h-9 px-4"
              >
                Record acting / additional charge
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
