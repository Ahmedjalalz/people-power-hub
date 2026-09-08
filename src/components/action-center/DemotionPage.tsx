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
  TrendingDown,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldAlert,
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

export interface DemotionRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  currentDesignation: string;
  effectiveDate: string;
  effectiveFrom: string;
  newDesignation: string;
  newGradeScale?: string;
  revisedGrossSalary?: string;
  reason: string;
  inquiryReference?: string;
  details?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_demotions";

const REASON_OPTIONS = [
  "Performance Incompetence / PIP Failure",
  "Disciplinary Action / Misconduct Finding",
  "Organizational Restructuring / Reclassification",
  "Voluntary Demotion (Employee Request)",
  "Inquiry Committee Recommendation",
  "Breach of Compliance or Code of Conduct",
  "Health / Medical Capability Reassignment",
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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pastel-rose text-xs font-semibold text-foreground border border-border/40">
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
                      isSelected && "bg-pastel-rose/40 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-rose text-[10px] font-semibold text-foreground border border-border/30">
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
        className="min-h-[110px] max-h-[220px] overflow-y-auto p-3 text-xs leading-relaxed text-foreground focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
        data-placeholder={placeholder || "Write here..."}
      />
    </div>
  );
}

export function DemotionPage() {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    options,
    isLoading,
    recordAction,
  } = useActionProcessData({
    processCode: "DEMOTION",
    storageKey: STORAGE_KEY,
    onSaveLabel: "Logged only",
    defaultFieldCount: 8,
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
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newGradeScale, setNewGradeScale] = useState("");
  const [revisedGrossSalary, setRevisedGrossSalary] = useState("");
  const [reason, setReason] = useState("");
  const [inquiryReference, setInquiryReference] = useState("");
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
    setEffectiveFrom("");
    setNewDesignation("");
    setNewGradeScale("");
    setRevisedGrossSalary("");
    setReason("");
    setInquiryReference("");
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
        ((r.actionData?.newDesignation || "") as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((r.actionData?.inquiryReference || "") as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((r.actionData?.note || "") as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    if (!effectiveFrom) {
      newErrors.effectiveFrom = "Effective from date is required";
    }
    if (!newDesignation.trim()) {
      newErrors.newDesignation = "New designation is required";
    }
    if (!reason) {
      newErrors.reason = "Please select a reason";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const empId = selectedEmpMeta?.id || "EMP-CUSTOM";

    const localRec: NormalizedActionRecord = {
      id: `demotion-${Date.now()}`,
      recordNumber: "DEM-" + Math.floor(100000 + Math.random() * 900000),
      processCode: "DEMOTION",
      employeeId: empId,
      employeeName: selectedEmployeeName,
      department: selectedEmpMeta?.department || "General",
      effectiveDate,
      status: "SCHEDULED",
      targetPosition: newDesignation.trim(),
      targetDepartment: selectedEmpMeta?.department || "General",
      reasonDetails: reason || details.trim() || undefined,
      source: "local",
      recordedAt: new Date().toISOString(),
      actionData: {
        currentDesignation: selectedEmpMeta?.positionTitle || "Staff",
        effectiveFrom,
        newDesignation: newDesignation.trim(),
        newGradeScale: newGradeScale.trim() || undefined,
        revisedGrossSalary: revisedGrossSalary.trim() || undefined,
        reason,
        inquiryReference: inquiryReference.trim() || undefined,
        details: details.trim() || undefined,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId: empId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        target_position_name: newDesignation.trim(),
        salary: revisedGrossSalary.trim() || undefined,
        reason: reason || details.trim() || undefined,
        note: note.trim() || (inquiryReference ? `Ref: ${inquiryReference}` : undefined),
      },
      localRecord: localRec,
    });

    // Add activity log to central Activity Store
    addActivityLog({
      actionId: "demotion",
      actionTitle: "Demotion",
      category: "Movement",
      employeeName: selectedEmployeeName,
      employeeId: empId,
      department: selectedEmpMeta?.department || "General",
      summary: `Demoted from ${selectedEmpMeta?.positionTitle || "Current"} to ${newDesignation.trim()}${
        newGradeScale ? ` (Grade: ${newGradeScale.trim()})` : ""
      }. Reason: ${reason}`,
      notes:
        note.trim() ||
        (inquiryReference ? `Ref: ${inquiryReference}` : undefined) ||
        "Demotion record logged.",
      status: "Completed",
      performedBy: "Ahmad Jalal (HR Lead)",
      tintClass: "bg-pastel-rose",
      tintVar: "--pastel-rose",
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Demotion</h1>
              <Badge
                variant="outline"
                className="bg-pastel-rose/50 text-foreground border-border/50 text-xs px-2 py-0.5"
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
            + Record demotion
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pastel-rose/40 text-foreground mb-4">
            <TrendingDown className="h-6 w-6 text-rose-600" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Nothing recorded yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            No demotion has been recorded yet. Use the button above to record one.
          </p>
          <div className="mt-5">
            <Button
              onClick={() => setIsSheetOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2"
            >
              <Plus className="h-4 w-4" />
              + Record demotion
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRecords.map((item) => {
            const currentRole = (item.actionData?.currentDesignation as string) || "Staff";
            const targetRole = item.targetPosition || (item.actionData?.newDesignation as string) || "Demoted Role";
            const grade = item.actionData?.newGradeScale as string | undefined;
            const fromDateVal = (item.actionData?.effectiveFrom as string) || item.effectiveDate;
            const salaryVal = (item.actionData?.revisedGrossSalary || item.actionData?.salary) as string | undefined;
            const reasonVal = (item.actionData?.reason || item.reasonDetails) as string | undefined;
            const refVal = (item.actionData?.inquiryReference || item.recordNumber) as string | undefined;
            const detailsVal = item.actionData?.details as string | undefined;
            const noteVal = item.actionData?.note as string | undefined;

            return (
              <div
                key={item.id}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-muted-foreground/30 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-rose text-sm font-semibold text-foreground border border-border/40">
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
                        <Badge className="bg-pastel-rose/70 text-foreground border-border/50 text-xs font-medium">
                          Demotion
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Prior: {currentRole} ({item.department})
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-1 text-foreground font-medium bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                          <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                          <span>New Designation: {targetRole}</span>
                        </div>

                        {grade && (
                          <div className="text-muted-foreground">
                            <span>Grade/Scale: {grade}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Effective From: {fromDateVal}</span>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Decision Date: {item.effectiveDate}</span>
                        </div>

                        {salaryVal && (
                          <div className="flex items-center gap-1 text-muted-foreground font-medium">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Revised Salary: {salaryVal}</span>
                          </div>
                        )}
                      </div>

                      {reasonVal && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium text-foreground">Reason: </span>
                          <span className="text-muted-foreground">{reasonVal}</span>
                        </div>
                      )}

                      {refVal && (
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span>Inquiry / Order Ref: {refVal}</span>
                        </div>
                      )}

                      {detailsVal && (
                        <div
                          className="mt-2 text-xs text-foreground/85 bg-muted/20 p-2.5 rounded-lg border border-border/40 prose prose-xs dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: detailsVal }}
                        />
                      )}

                      {noteVal && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground italic">
                          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span>Audit Note: {noteVal}</span>
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

      {/* ── Slide-Over Sheet Panel: + Record demotion ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col gap-0">
          {/* Header */}
          <div className="p-6 border-b border-border bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl font-bold text-foreground">Demotion</SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-rose text-foreground font-semibold text-[11px] border-border/60 uppercase"
                >
                  DEMOTE
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

            {/* ── Group: DEMOTION DETAILS ── */}
            <div className="space-y-4">
              <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase pb-1 border-b border-border/60">
                Demotion Details
              </div>

              {/* Effective from* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Effective from <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  placeholder="Select date"
                  value={effectiveFrom}
                  onChange={(e) => {
                    setEffectiveFrom(e.target.value);
                    if (errors.effectiveFrom) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.effectiveFrom;
                        return n;
                      });
                    }
                  }}
                  className={cn(
                    "h-9 text-xs bg-background",
                    errors.effectiveFrom && "border-destructive/60"
                  )}
                />
                {errors.effectiveFrom && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.effectiveFrom}
                  </p>
                )}
              </div>

              {/* New designation* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  New designation <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Associate Specialist / Junior Officer"
                  value={newDesignation}
                  onChange={(e) => {
                    setNewDesignation(e.target.value);
                    if (errors.newDesignation) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.newDesignation;
                        return n;
                      });
                    }
                  }}
                  className={cn(
                    "h-9 text-xs bg-background",
                    errors.newDesignation && "border-destructive/60"
                  )}
                />
                {errors.newDesignation && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.newDesignation}
                  </p>
                )}
              </div>

              {/* New grade / scale */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">New grade / scale</label>
                <Input
                  type="text"
                  placeholder="e.g. L2-A / Grade 4"
                  value={newGradeScale}
                  onChange={(e) => setNewGradeScale(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Revised gross salary */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Revised gross salary
                </label>
                <Input
                  type="text"
                  placeholder="e.g. $4,500 / month or PKR 180,000"
                  value={revisedGrossSalary}
                  onChange={(e) => setRevisedGrossSalary(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Reason* */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Reason <span className="text-destructive">*</span>
                </label>
                <Select
                  value={reason}
                  onValueChange={(val) => {
                    setReason(val);
                    if (errors.reason) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.reason;
                        return n;
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    className={cn("h-9 text-xs bg-background", errors.reason && "border-destructive/60")}
                  >
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
                {errors.reason && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.reason}
                  </p>
                )}
              </div>

              {/* Inquiry / order reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Inquiry / order reference
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Inquiry Order #IO-2026/08, Committee memo dated 12-Feb"
                  value={inquiryReference}
                  onChange={(e) => setInquiryReference(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Details: Rich text editor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Details</label>
                <RichTextEditor
                  value={details}
                  onChange={setDetails}
                  placeholder="Write here..."
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
                Record demotion
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
