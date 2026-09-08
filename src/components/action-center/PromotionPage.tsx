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
  TrendingUp,
  Award,
  AlertCircle,
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
  ArrowRight,
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

export interface PromotionRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  currentDesignation: string;
  effectiveDate: string;
  effectiveFrom: string;
  newDesignation: string;
  newGradeScale?: string;
  newDepartment?: string;
  revisedGrossSalary: string;
  promotionIncrement?: string;
  performanceRating?: string;
  justification: string;
  approvalReference?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_promotions";

const PERFORMANCE_RATINGS = [
  "Exceptional (5.0)",
  "Exceeds Expectations (4.0 - 4.9)",
  "Meets Expectations (3.0 - 3.9)",
  "Needs Improvement (2.0 - 2.9)",
  "Unsatisfactory (1.0 - 1.9)",
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
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-mint/80 text-[10px] font-bold text-primary">
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
                      isSelected && "bg-pastel-mint/50 font-medium text-foreground"
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

interface PromotionPageProps {
  onBack?: () => void;
}

export function PromotionPage({ onBack }: PromotionPageProps = {}) {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    options,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "PROMOTION",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Updates the record",
    defaultFieldCount: 10,
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
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateStr);
  const [newDesignation, setNewDesignation] = useState("");
  const [newGradeScale, setNewGradeScale] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [revisedGrossSalary, setRevisedGrossSalary] = useState("");
  const [promotionIncrement, setPromotionIncrement] = useState("");
  const [performanceRating, setPerformanceRating] = useState("");
  const [justification, setJustification] = useState("");
  const [approvalReference, setApprovalReference] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setEffectiveFrom(todayDateStr);
    setNewDesignation("");
    setNewGradeScale("");
    setNewDepartment("");
    setRevisedGrossSalary("");
    setPromotionIncrement("");
    setPerformanceRating("");
    setJustification("");
    setApprovalReference("");
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

  const handleRecordPromotion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName.trim()) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Effective date is required.");
      return;
    }
    if (!effectiveFrom) {
      setFormError("Effective from date is required.");
      return;
    }
    if (!newDesignation.trim()) {
      setFormError("New designation is required.");
      return;
    }
    if (!revisedGrossSalary.trim()) {
      setFormError("Revised gross salary is required.");
      return;
    }
    if (!justification.trim() || justification === "<br>") {
      setFormError("Justification is required.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((emp) => emp.name === selectedEmployeeName);
    const employeeId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const department = matchedEmp?.department || "Operations";

    // Find position id if matches options
    const matchedPos = options?.positions?.find(
      (p) => p.Position_Title.toLowerCase() === newDesignation.toLowerCase() || p.Designation.toLowerCase() === newDesignation.toLowerCase()
    );

    const localRec: NormalizedActionRecord = {
      id: "prom-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      employeeName: selectedEmployeeName,
      employeeId,
      department,
      effectiveDate,
      status: "SCHEDULED",
      performedBy: "Ahmad Jalal (HR Lead)",
      recordedAt: new Date().toISOString(),
      reasonCategory: "PROMOTION_ADVANCEMENT",
      reasonDetails: justification.replace(/<[^>]*>/g, "") || `Promoted to ${newDesignation}`,
      targetDepartment: newDepartment || department,
      targetPosition: newDesignation.trim(),
      actionData: {
        effective_date: effectiveDate,
        effective_from: effectiveFrom,
        current_designation: matchedEmp?.positionTitle || "Specialist",
        new_designation: newDesignation.trim(),
        new_grade_scale: newGradeScale.trim() || undefined,
        new_department: newDepartment.trim() || undefined,
        revised_gross_salary: revisedGrossSalary.trim(),
        promotion_increment: promotionIncrement.trim() || undefined,
        performance_rating: performanceRating || undefined,
        justification: justification.trim(),
        approval_reference: approvalReference.trim() || undefined,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        target_position_id: matchedPos?.Position_ID || undefined,
        reason: justification.replace(/<[^>]*>/g, "").slice(0, 300),
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Log action to the global activity store
    addActivityLog({
      actionId: "promotion",
      actionTitle: "Promotion",
      category: "Movement",
      employeeName: selectedEmployeeName,
      employeeId,
      department: localRec.targetDepartment || department,
      summary: `Promotion recorded for ${selectedEmployeeName} to ${newDesignation}${
        newDepartment ? ` (${newDepartment})` : ""
      }. Revised gross salary: ${revisedGrossSalary}${
        promotionIncrement ? ` (+${promotionIncrement} increment)` : ""
      }.`,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: "bg-pastel-mint",
      tintVar: "--pastel-mint",
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
        const matchesDept = r.department.toLowerCase().includes(q) || (r.targetDepartment?.toLowerCase().includes(q) ?? false);
        const matchesRole = (r.targetPosition || r.actionData?.new_designation || "").toLowerCase().includes(q) || (r.actionData?.current_designation || "").toLowerCase().includes(q);
        const matchesRef = (r.actionData?.approval_reference || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept && !matchesRole && !matchesRef) {
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-mint/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Movement Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Promotion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Movement process — configure its approval chain in the Workflow Manager.
          </p>
        </div>

        <div>
          <Button
            onClick={handleOpenPanel}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Record promotion
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
            No promotion has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record promotion
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item) => {
            const currentRole = item.actionData?.current_designation || item.department || "Staff";
            const newRole = item.targetPosition || item.actionData?.new_designation || "Promoted Role";
            const newDept = item.targetDepartment || item.actionData?.new_department;
            const newGrade = item.actionData?.new_grade_scale;
            const revisedSalary = item.actionData?.revised_gross_salary || item.actionData?.salary || "—";
            const incrementVal = item.actionData?.promotion_increment || "—";
            const perfRating = item.actionData?.performance_rating || "—";
            const refNumber = item.actionData?.approval_reference || item.recordNumber || "—";
            const justificationText = item.actionData?.justification || item.reasonDetails || "";
            const auditorNote = item.actionData?.note;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Employee info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-mint/80 font-bold text-primary text-sm shadow-xs">
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
                        <div className="inline-flex items-center gap-1 rounded-md bg-pastel-mint px-2 py-0.5 text-xs font-semibold text-foreground">
                          <span>{currentRole}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-primary font-bold">{newRole}</span>
                        </div>
                        {newGrade && (
                          <Badge variant="secondary" className="text-[10px]">
                            Grade {newGrade}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.department}
                        {newDept && newDept !== item.department ? (
                          <> → <strong className="text-foreground">{newDept}</strong></>
                        ) : null}{" "}
                        · Effective {item.effectiveDate}
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
                    <span className="text-muted-foreground block text-[11px]">Revised Gross Salary</span>
                    <span className="font-semibold text-foreground">
                      {revisedSalary}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Promotion Increment</span>
                    <span className="font-medium text-foreground">
                      {incrementVal}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Latest Performance</span>
                    <span className="font-medium text-foreground">
                      {perfRating}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Approval Reference</span>
                    <span className="font-medium text-foreground">
                      {refNumber}
                    </span>
                  </div>
                </div>

                {/* Justification & Note */}
                {(justificationText || auditorNote) && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-2">
                    {justificationText && (
                      <div>
                        <span className="font-semibold text-foreground text-[11px]">
                          Promotion Justification:
                        </span>
                        <div
                          className="mt-0.5 text-muted-foreground prose prose-xs dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: justificationText }}
                        />
                      </div>
                    )}

                    {auditorNote && (
                      <div className="pt-1 text-muted-foreground border-t border-border/40">
                        <strong className="text-foreground text-[11px]">Auditor Note: </strong>
                        {auditorNote}
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
                  Promotion
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-mint/70 text-foreground text-xs font-mono font-bold uppercase tracking-wider"
                >
                  PROMO
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
              Movement process — configure its approval chain in the Workflow Manager.
            </SheetDescription>

            {/* Notice Banner */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>This is recorded in the activity log against your name. It does not change other records automatically.</span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRecordPromotion} className="p-6 space-y-6 flex-1">
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

            {/* ── Group 2: PROMOTION DETAILS ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                PROMOTION DETAILS
              </div>

              {/* Effective from */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Effective from <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* New designation & New grade / scale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    New designation <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Senior Product Manager"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    New grade / scale
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Level 7 / Band E"
                    value={newGradeScale}
                    onChange={(e) => setNewGradeScale(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* New department */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  New department
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Global Product Operations"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Only if the promotion moves them.
                </p>
              </div>

              {/* Revised gross salary & Promotion increment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Revised gross salary <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 240,000 / month"
                    value={revisedGrossSalary}
                    onChange={(e) => setRevisedGrossSalary(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Promotion increment
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 35,000 / month or 15%"
                    value={promotionIncrement}
                    onChange={(e) => setPromotionIncrement(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Latest performance rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Latest performance rating
                </label>
                <Select value={performanceRating} onValueChange={setPerformanceRating}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFORMANCE_RATINGS.map((rating) => (
                      <SelectItem key={rating} value={rating} className="text-xs">
                        {rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Justification (Rich Text Editor) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Justification <span className="text-destructive">*</span>
                </label>
                <RichTextEditor
                  value={justification}
                  onChange={setJustification}
                  placeholder="Write here... Detail achievements, deliverables, competencies, and scope expansion justifying this promotion."
                />
              </div>

              {/* Approval reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Approval reference
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Exec-Board-Minute-2026/04"
                  value={approvalReference}
                  onChange={(e) => setApprovalReference(e.target.value)}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Committee/minute number, if any.
                </p>
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
                Record promotion
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
