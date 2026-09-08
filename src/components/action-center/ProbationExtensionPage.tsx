import { useState, useMemo, useEffect, useRef } from "react";
import { format, formatDistanceToNow, addMonths } from "date-fns";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Info,
  FileText,
  Clock,
  CheckCircle2,
  Check,
  ChevronDown,
  X,
  Trash2,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  RemoveFormatting,
  User,
  AlertCircle,
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

export interface ProbationExtensionRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  effectiveDate: string;
  extendMonths: string;
  revisedEndDate: string;
  extensionReason: string;
  improvementPlan?: string;
  counsellingHeld: string;
  remarks?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_probation_extensions";

const EXTENSION_REASONS = [
  "Performance below expectation",
  "Insufficient assessment period",
  "Attendance / discipline",
  "Training incomplete",
  "Other",
];

const COUNSELLING_OPTIONS = [
  "Yes — Formally conducted with employee & supervisor",
  "Scheduled — Formal meeting planned within 5 working days",
  "No — Not required at this stage",
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
          "flex h-9 w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-xs shadow-xs transition-colors cursor-pointer",
          error ? "border-destructive ring-1 ring-destructive" : "border-input hover:border-primary/50",
          isOpen && "border-primary ring-1 ring-primary"
        )}
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-foreground truncate">{selectedEmp.name}</span>
            <span className="text-muted-foreground truncate">
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
                      isSelected && "bg-pastel-yellow/50 font-medium text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-yellow/80 text-[10px] font-bold text-primary">
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

/* ── Rich Text Editor Field ── */
function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync incoming value with innerHTML only on mount or when externally cleared
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!value) {
        editorRef.current.innerHTML = "";
      }
    }
  }, [value]);

  const executeCmd = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:", "https://");
    if (url) {
      executeCmd("createLink", url);
    }
  };

  return (
    <div className="w-full rounded-md border border-input bg-card shadow-xs transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/70 bg-muted/40 px-2 py-1.5 text-muted-foreground">
        <button
          type="button"
          title="Bold"
          onClick={() => executeCmd("bold")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Italic"
          onClick={() => executeCmd("italic")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Underline"
          onClick={() => executeCmd("underline")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-[1px] bg-border mx-0.5" />
        <button
          type="button"
          title="Heading 1"
          onClick={() => executeCmd("formatBlock", "<h1>")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Heading 2"
          onClick={() => executeCmd("formatBlock", "<h2>")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-[1px] bg-border mx-0.5" />
        <button
          type="button"
          title="Bullet List"
          onClick={() => executeCmd("insertUnorderedList")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Numbered List"
          onClick={() => executeCmd("insertOrderedList")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Quote"
          onClick={() => executeCmd("formatBlock", "<blockquote>")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Insert Link"
          onClick={addLink}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-[1px] bg-border mx-0.5" />
        <button
          type="button"
          title="Clear formatting"
          onClick={() => executeCmd("removeFormat")}
          className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editable Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[100px] max-h-[220px] overflow-y-auto p-3 text-xs leading-relaxed text-foreground focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
        data-placeholder={placeholder || "Write here..."}
      />
    </div>
  );
}

interface ProbationExtensionPageProps {
  onBack?: () => void;
}

export function ProbationExtensionPage({ onBack }: ProbationExtensionPageProps = {}) {
  const navigate = useNavigate();

  // Backend connected process data & statistics
  const {
    records,
    metrics,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "PROB_EXTEND",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Logged only",
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
  const [extendMonths, setExtendMonths] = useState("3");
  const [revisedEndDate, setRevisedEndDate] = useState(() => {
    try {
      return format(addMonths(new Date(), 3), "yyyy-MM-dd");
    } catch {
      return "";
    }
  });
  const [extensionReason, setExtensionReason] = useState("");
  const [improvementPlan, setImprovementPlan] = useState("");
  const [counsellingHeld, setCounsellingHeld] = useState("");
  const [remarks, setRemarks] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate revised date when extendMonths or effectiveDate changes
  const handleExtendMonthsChange = (val: string) => {
    setExtendMonths(val);
    const monthsNum = parseInt(val, 10);
    if (!isNaN(monthsNum) && monthsNum > 0 && effectiveDate) {
      try {
        const baseDate = new Date(effectiveDate);
        setRevisedEndDate(format(addMonths(baseDate, monthsNum), "yyyy-MM-dd"));
      } catch {
        // keep existing
      }
    }
  };

  const handleEffectiveDateChange = (val: string) => {
    setEffectiveDate(val);
    const monthsNum = parseInt(extendMonths, 10);
    if (!isNaN(monthsNum) && monthsNum > 0 && val) {
      try {
        const baseDate = new Date(val);
        setRevisedEndDate(format(addMonths(baseDate, monthsNum), "yyyy-MM-dd"));
      } catch {
        // keep existing
      }
    }
  };

  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setExtendMonths("3");
    try {
      setRevisedEndDate(format(addMonths(new Date(), 3), "yyyy-MM-dd"));
    } catch {
      setRevisedEndDate("");
    }
    setExtensionReason("");
    setImprovementPlan("");
    setCounsellingHeld("");
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

  const handleRecordExtension = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName.trim()) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Effective date is required.");
      return;
    }
    if (!extendMonths.trim() || isNaN(Number(extendMonths)) || Number(extendMonths) <= 0) {
      setFormError("Please provide a valid extension duration in months.");
      return;
    }
    if (!extensionReason.trim()) {
      setFormError("Please choose a reason for extension.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((emp) => emp.name === selectedEmployeeName);
    const employeeId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const department = matchedEmp?.department || "Operations";

    const localRec: NormalizedActionRecord = {
      id: "pe-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      effectiveDate,
      status: "APPLIED",
      performedBy: "Ahmad Jalal (HR Lead)",
      recordedAt: new Date().toISOString(),
      reasonCategory: extensionReason,
      reasonDetails: remarks || `Extension for ${extendMonths} months.`,
      actionData: {
        extension_months: Number(extendMonths),
        extension_reason: extensionReason,
        new_probation_end_date: revisedEndDate || effectiveDate,
        improvement_plan: improvementPlan.trim() || undefined,
        counselling_held: counsellingHeld || "Not specified",
        remarks: remarks.trim() || undefined,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        extension_months: Number(extendMonths),
        extension_reason: extensionReason,
        new_probation_end_date: revisedEndDate || effectiveDate,
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    addActivityLog({
      actionId: "probation-extension",
      actionTitle: "Probation Extension",
      category: "Entry",
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      summary: `Probation extended by ${extendMonths} months for ${selectedEmployeeName} (${department}). Revised review date: ${
        revisedEndDate || effectiveDate
      }. Reason: ${extensionReason}.`,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: "bg-pastel-yellow",
      tintVar: "--pastel-yellow",
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
        const matchesReason = (r.actionData?.extension_reason || r.reasonCategory || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept && !matchesReason) {
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-yellow/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Entry Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Probation Extension
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
            Record probation extension
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
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-yellow/70 text-foreground shadow-xs">
            <Clock className="h-7 w-7 stroke-[2]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Nothing recorded yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            No probation extension has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record probation extension
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item) => {
            const extendMonthsVal =
              item.actionData?.extension_months ??
              item.actionData?.extend_months ??
              3;
            const revisedEndDateVal =
              item.actionData?.new_probation_end_date ??
              item.actionData?.revised_end_date ??
              item.effectiveDate;
            const reasonVal =
              item.actionData?.extension_reason ??
              item.reasonCategory ??
              "Performance Review";
            const noteVal =
              item.actionData?.note ?? item.reasonDetails ?? "—";
            const counsellingVal =
              item.actionData?.counselling_held ?? "Completed";

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Employee info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-yellow/80 font-bold text-primary text-sm shadow-xs">
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
                        <Badge className="bg-pastel-yellow text-foreground text-[10px] font-medium hover:bg-pastel-yellow">
                          +{extendMonthsVal} Months Extension
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.department} · Effective {item.effectiveDate} · Revised End Date:{" "}
                        <strong className="text-foreground">{revisedEndDateVal}</strong>
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
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-border/50 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Reason for Extension</span>
                    <span className="font-medium text-foreground">{reasonVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Counselling Session</span>
                    <span className="font-medium text-foreground">{counsellingVal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Auditor Note / Ref</span>
                    <span className="font-medium text-foreground">{noteVal}</span>
                  </div>
                </div>

                {/* Improvement Plan / Remarks if present */}
                {(item.actionData?.improvement_plan || item.actionData?.remarks || item.reasonDetails) && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
                    {item.actionData?.improvement_plan && (
                      <div>
                        <span className="font-semibold text-foreground text-[11px]">
                          Improvement Plan Communicated:
                        </span>
                        <div
                          className="mt-0.5 text-muted-foreground prose prose-xs dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: item.actionData.improvement_plan }}
                        />
                      </div>
                    )}
                    {(item.actionData?.remarks || item.reasonDetails) && (
                      <div className="text-muted-foreground">
                        <strong className="text-foreground text-[11px]">Details / Remarks: </strong>
                        {item.actionData?.remarks || item.reasonDetails}
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
                  Probation Extension
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-yellow/70 text-foreground text-xs font-mono font-bold uppercase tracking-wider"
                >
                  PROB_EXT
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
          <form onSubmit={handleRecordExtension} className="p-6 space-y-6 flex-1">
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

            {/* ── Group 2: PROBATION EXTENSION DETAILS ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                PROBATION EXTENSION DETAILS
              </div>

              {/* Extend by (months) & Revised probation end date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Extend by (months) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    placeholder="e.g. 3"
                    value={extendMonths}
                    onChange={(e) => handleExtendMonthsChange(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Number of months extended.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Revised probation end date
                  </label>
                  <Input
                    type="date"
                    value={revisedEndDate}
                    onChange={(e) => setRevisedEndDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Auto-calculated or custom date.</p>
                </div>
              </div>

              {/* Reason for extension */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Reason for extension <span className="text-destructive">*</span>
                </label>
                <Select value={extensionReason} onValueChange={setExtensionReason}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTENSION_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason} className="text-xs">
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Improvement plan communicated (Rich Text Editor) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Improvement plan communicated
                </label>
                <RichTextEditor
                  value={improvementPlan}
                  onChange={setImprovementPlan}
                  placeholder="Write here... Specify performance expectations, milestones, and review dates."
                />
                <p className="text-[11px] text-muted-foreground">
                  Use formatting tools for clear goals and milestone lists.
                </p>
              </div>

              {/* Counselling session held? */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Counselling session held?
                </label>
                <Select value={counsellingHeld} onValueChange={setCounsellingHeld}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNSELLING_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Remarks</label>
                <Textarea
                  placeholder="Any additional observations or supervisor notes..."
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
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs cursor-pointer"
              >
                Record probation extension
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
