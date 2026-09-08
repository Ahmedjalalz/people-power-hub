import { useState, useMemo, useEffect, useRef } from "react";
import { format, formatDistanceToNow, addDays } from "date-fns";
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
  LogOut,
  GitBranch,
  FileText,
  UploadCloud,
  AlertCircle,
  Paperclip,
  UserCheck,
  HelpCircle,
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

export interface ResignationRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  positionTitle: string;
  effectiveDate: string;
  proposedLastWorkingDay: string;
  noticePeriodDays: number;
  primaryReason: string;
  resignationLetter: string; // rich text
  handoverToColleague?: string;
  exitInterviewWilling: boolean;
  signedLetterFileName?: string;
  signedLetterFileSize?: string;
  note?: string;
  recordedBy: string;
  recordedAt: string; // ISO string
}

const STORAGE_KEY = "peoplelens_resignations";

const PRIMARY_REASONS = [
  "Career growth / Better opportunity",
  "Relocation / Personal reasons",
  "Higher education / Further studies",
  "Compensation & benefits",
  "Work-life balance / Health",
  "Career change / Different industry",
  "Dissatisfaction with role or management",
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
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-rose/80 text-[10px] font-bold text-destructive">
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
                      isSelected && "bg-pastel-rose/50 font-medium text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pastel-rose/80 text-[10px] font-bold text-destructive">
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
        className="min-h-[110px] max-h-[220px] overflow-y-auto p-3 text-xs leading-relaxed text-foreground focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
        data-placeholder={placeholder || "Write here..."}
      />
    </div>
  );
}

interface ResignationPageProps {
  onBack?: () => void;
}

export function ResignationPage({ onBack }: ResignationPageProps = {}) {
  // Backend connected process data & statistics
  const {
    records,
    metrics,
    options,
    isLoading,
    recordAction,
    deleteRecord,
  } = useActionProcessData({
    processCode: "RESIGNATION",
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
  const [noticePeriodDays, setNoticePeriodDays] = useState("30");
  const [proposedLastWorkingDay, setProposedLastWorkingDay] = useState(() => {
    try {
      return format(addDays(new Date(), 30), "yyyy-MM-dd");
    } catch {
      return "";
    }
  });
  const [primaryReason, setPrimaryReason] = useState("");
  const [resignationLetter, setResignationLetter] = useState("");
  const [handoverToColleague, setHandoverToColleague] = useState("");
  const [exitInterviewWilling, setExitInterviewWilling] = useState<boolean>(true);
  const [signedLetterFile, setSignedLetterFile] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate proposedLastWorkingDay when noticePeriodDays or effectiveDate changes
  const handleNoticeDaysChange = (val: string) => {
    setNoticePeriodDays(val);
    const daysNum = parseInt(val, 10);
    if (!isNaN(daysNum) && daysNum >= 0 && effectiveDate) {
      try {
        const base = new Date(effectiveDate);
        setProposedLastWorkingDay(format(addDays(base, daysNum), "yyyy-MM-dd"));
      } catch {
        // keep existing
      }
    }
  };

  const handleEffectiveDateChange = (val: string) => {
    setEffectiveDate(val);
    const daysNum = parseInt(noticePeriodDays, 10);
    if (!isNaN(daysNum) && daysNum >= 0 && val) {
      try {
        const base = new Date(val);
        setProposedLastWorkingDay(format(addDays(base, daysNum), "yyyy-MM-dd"));
      } catch {
        // keep existing
      }
    }
  };

  const resetForm = () => {
    setSelectedEmployeeName("");
    setEffectiveDate(todayDateStr);
    setNoticePeriodDays("30");
    try {
      setProposedLastWorkingDay(format(addDays(new Date(), 30), "yyyy-MM-dd"));
    } catch {
      setProposedLastWorkingDay("");
    }
    setPrimaryReason("");
    setResignationLetter("");
    setHandoverToColleague("");
    setExitInterviewWilling(true);
    setSignedLetterFile(null);
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
      setSignedLetterFile({
        name: file.name,
        size: `${sizeKB} KB`,
      });
    }
  };

  const handleRecordResignation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName.trim()) {
      setFormError("Please select an employee.");
      return;
    }
    if (!effectiveDate) {
      setFormError("Effective date is required.");
      return;
    }
    if (!proposedLastWorkingDay) {
      setFormError("Proposed last working day is required.");
      return;
    }
    if (!noticePeriodDays.trim() || isNaN(Number(noticePeriodDays))) {
      setFormError("Valid notice period in days is required.");
      return;
    }
    if (!primaryReason.trim()) {
      setFormError("Please select the primary reason for resignation.");
      return;
    }
    if (!resignationLetter.trim() || resignationLetter === "<br>") {
      setFormError("Resignation letter / details are required.");
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find((emp) => emp.name === selectedEmployeeName);
    const empId = matchedEmp?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000);

    const localRec: NormalizedActionRecord = {
      id: "res-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      employeeName: selectedEmployeeName,
      employeeId: empId,
      department: matchedEmp?.department || "Operations",
      effectiveDate,
      status: "SCHEDULED",
      performedBy: "Ahmad Jalal (HR Lead)",
      recordedAt: new Date().toISOString(),
      reasonCategory: primaryReason,
      reasonDetails: primaryReason,
      targetDepartment: matchedEmp?.department || "Operations",
      targetPosition: matchedEmp?.positionTitle || "Specialist",
      actionData: {
        proposedLastWorkingDay,
        noticePeriodDays: parseInt(noticePeriodDays, 10) || 30,
        primaryReason,
        resignationLetter: resignationLetter.trim(),
        handoverToColleague: handoverToColleague.trim() || undefined,
        exitInterviewWilling,
        signedLetterFileName: signedLetterFile?.name,
        signedLetterFileSize: signedLetterFile?.size,
        note: note.trim() || undefined,
      },
    };

    await recordAction({
      employeeId: empId,
      employeeName: selectedEmployeeName,
      fields: {
        effective_date: effectiveDate,
        last_working_day: proposedLastWorkingDay,
        notice_period_days: parseInt(noticePeriodDays, 10) || 30,
        reason: primaryReason,
        note: note.trim() || undefined,
      },
      localRecord: localRec,
    });

    // Log action to the global activity store
    addActivityLog({
      actionId: "resignation",
      actionTitle: "Resignation",
      category: "Exit",
      employeeName: selectedEmployeeName,
      employeeId: empId,
      department: matchedEmp?.department || "Operations",
      summary: `Resignation submitted for ${selectedEmployeeName}. Notice period: ${noticePeriodDays} days. Proposed last working day: ${proposedLastWorkingDay}. Reason: ${primaryReason}.`,
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

  const handleDeleteRecord = (id: string) => {
    if (confirm("Are you sure you want to remove this resignation record?")) {
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
        const matchesReason = (r.reasonCategory || r.reasonDetails || r.actionData?.primaryReason || "")?.toLowerCase().includes(q);
        const matchesHandover = (r.actionData?.handoverToColleague || "")?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNote && !matchesDept && !matchesReason && !matchesHandover) {
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pastel-rose/70 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            <span>Exit Workflow</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Resignation
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
            Record resignation
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-rose/70 text-foreground shadow-xs">
            <LogOut className="h-7 w-7 stroke-[2]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Nothing recorded yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            No resignation has been recorded yet. Use the button above to record one.
          </p>
          <Button
            onClick={handleOpenPanel}
            size="sm"
            className="mt-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record resignation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item) => {
            const noticeDays =
              item.actionData?.noticePeriodDays || item.actionData?.notice_period_days || 30;
            const exitInterview =
              item.actionData?.exitInterviewWilling !== undefined
                ? item.actionData.exitInterviewWilling
                : true;
            const posTitle =
              item.targetPosition || item.actionData?.positionTitle || "Specialist";
            const lastDay =
              item.actionData?.proposedLastWorkingDay ||
              item.actionData?.last_working_day ||
              item.effectiveDate;
            const reason =
              item.reasonCategory ||
              item.reasonDetails ||
              item.actionData?.primaryReason ||
              "Career growth / Better opportunity";
            const handover =
              item.actionData?.handoverToColleague || item.actionData?.handover_colleague;
            const letterHtml =
              item.actionData?.resignationLetter ||
              item.reasonDetails ||
              "Resignation recorded via standard process.";
            const fileName = item.actionData?.signedLetterFileName;
            const fileSize = item.actionData?.signedLetterFileSize;
            const noteVal = item.actionData?.note;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Employee info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-rose/80 font-bold text-destructive text-sm shadow-xs">
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
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-semibold">
                          Notice: {noticeDays} Days
                        </Badge>
                        {exitInterview && (
                          <Badge variant="secondary" className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Exit Interview: Yes
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {posTitle} · {item.department} · Effective {item.effectiveDate} · Last Day:{" "}
                        <strong className="text-foreground">{lastDay}</strong>
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

                {/* Detail fields preview */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/50 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Primary Reason</span>
                    <span className="font-semibold text-foreground">{reason}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Proposed Last Working Day</span>
                    <span className="font-medium text-foreground">{lastDay}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Handover To</span>
                    <span className="font-medium text-foreground">
                      {handover || "Pending assignment"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Exit Interview Willing</span>
                    <span className="font-medium text-foreground">
                      {exitInterview ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Resignation Letter & Signed File & Note */}
                <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs space-y-2">
                  <div>
                    <span className="font-semibold text-foreground text-[11px]">
                      Resignation Letter / Details:
                    </span>
                    <div
                      className="mt-0.5 text-muted-foreground prose prose-xs dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: letterHtml }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border/40">
                    {fileName && (
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs">
                        <Paperclip className="h-3.5 w-3.5 text-destructive" />
                        <span>{fileName}</span>
                        {fileSize && (
                          <span className="text-muted-foreground">({fileSize})</span>
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
                  Resignation
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="bg-pastel-rose/70 text-destructive text-xs font-mono font-bold uppercase tracking-wider"
                >
                  RESIGN
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
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                This updates the employee's record immediately and is logged against your name. An approval chain exists for this process — performing it here bypasses that chain.
              </span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRecordResignation} className="p-6 space-y-6 flex-1">
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

            {/* ── Group 2: RESIGNATION DETAILS ── */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                RESIGNATION DETAILS
              </div>

              {/* Proposed last working day & Notice period being served */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Proposed last working day <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={proposedLastWorkingDay}
                    onChange={(e) => setProposedLastWorkingDay(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Subject to the 30-day notice policy.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Notice period being served (days) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={noticePeriodDays}
                    onChange={(e) => handleNoticeDaysChange(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Default 30 days. Auto-calculates last day.
                  </p>
                </div>
              </div>

              {/* Primary reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Primary reason <span className="text-destructive">*</span>
                </label>
                <Select value={primaryReason} onValueChange={setPrimaryReason}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason} className="text-xs">
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resignation letter / details (Rich Text Editor) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Resignation letter / details <span className="text-destructive">*</span>
                </label>
                <RichTextEditor
                  value={resignationLetter}
                  onChange={setResignationLetter}
                  placeholder="Write here..."
                />
                <p className="text-[11px] text-muted-foreground">
                  Your formal resignation text — formatting is supported.
                </p>
              </div>

              {/* Proposed handover to (colleague) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Proposed handover to (colleague)
                </label>
                <Input
                  type="text"
                  placeholder="Search or enter colleague name..."
                  value={handoverToColleague}
                  onChange={(e) => setHandoverToColleague(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Willing to attend an exit interview? */}
              <div className="space-y-2 rounded-lg border border-border bg-card p-3 shadow-xs">
                <label className="text-xs font-medium text-foreground block">
                  Willing to attend an exit interview?
                </label>
                <div className="flex items-center gap-6 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                    <input
                      type="radio"
                      name="exitInterview"
                      checked={exitInterviewWilling === true}
                      onChange={() => setExitInterviewWilling(true)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                    <input
                      type="radio"
                      name="exitInterview"
                      checked={exitInterviewWilling === false}
                      onChange={() => setExitInterviewWilling(false)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {/* Signed resignation letter (scan/PDF) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Signed resignation letter (scan/PDF)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {signedLetterFile ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pastel-rose/70 text-destructive">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate text-xs">
                        <p className="font-medium text-foreground truncate">
                          {signedLetterFile.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {signedLetterFile.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSignedLetterFile(null);
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
                      Optional — attach a signed copy if you have one.
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
                {isSubmitting ? "Recording..." : "Record resignation"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
