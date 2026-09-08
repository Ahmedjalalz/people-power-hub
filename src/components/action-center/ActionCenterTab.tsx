import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Search,
  Clock,
  Sparkles,
  UserPlus,
  UserMinus,
  ArrowLeftRight,
  HelpCircle,
  FileSignature,
  CheckCircle2,
  RotateCcw,
  FileX,
  Receipt,
  LogOut,
  Sunrise,
  UserX,
  Zap,
  TrendingDown,
  Globe,
  TrendingUp,
  MapPin,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employees } from "@/lib/employees";
import { addActivityLog } from "@/lib/activity-store";
import { useActionCenterOverview, CARD_TO_PROCESS_CODE } from "@/lib/action-center-api";

export interface ActionCardItem {
  id: string;
  title: string;
  description: string;
  category: string;
  badge: string;
  tintClass: string;
  tintVar: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ActionSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tintClass: string;
  items: ActionCardItem[];
}

export const ACTION_SECTIONS: ActionSection[] = [
  {
    id: "entry",
    title: "Entry",
    description:
      "Manage onboarding workflows, employment contract terms, probation reviews, and rehires.",
    icon: UserPlus,
    tintClass: "bg-pastel-sky",
    items: [
      {
        id: "probation-confirmation",
        title: "Probation Confirmation",
        description:
          "Evaluate probation performance appraisals and formally confirm regular employment status.",
        category: "Entry",
        badge: "Confirmation",
        tintClass: "bg-pastel-mint",
        tintVar: "--pastel-mint",
        icon: CheckCircle2,
      },
      {
        id: "probation-extension",
        title: "Probation Extension",
        description:
          "Issue probation extension notices with updated review milestones and performance targets.",
        category: "Entry",
        badge: "Probation",
        tintClass: "bg-pastel-yellow",
        tintVar: "--pastel-yellow",
        icon: Clock,
      },
      {
        id: "contract-renewal-extension",
        title: "Contract Renewal / Extension",
        description:
          "Extend existing employment terms, renew fixed-term contracts, and issue addendums.",
        category: "Entry",
        badge: "Contracts",
        tintClass: "bg-pastel-sky",
        tintVar: "--pastel-sky",
        icon: FileSignature,
      },
      {
        id: "rejoining-rehire",
        title: "Rejoining / Rehire",
        description:
          "Process rehiring workflows for returning employees, restoring service records and access.",
        category: "Entry",
        badge: "Rehire",
        tintClass: "bg-pastel-lavender",
        tintVar: "--pastel-lavender",
        icon: RotateCcw,
      },
    ],
  },
  {
    id: "movement",
    title: "Movement",
    description:
      "Process internal mobility, lateral transfers, promotions, demotions, and deputations.",
    icon: ArrowLeftRight,
    tintClass: "bg-pastel-sky",
    items: [
      {
        id: "promotion",
        title: "Promotion",
        description:
          "Advance employee designation, tier levels, and compensation following merit reviews.",
        category: "Movement",
        badge: "Advancement",
        tintClass: "bg-pastel-mint",
        tintVar: "--pastel-mint",
        icon: TrendingUp,
      },
      {
        id: "transfer",
        title: "Transfer",
        description:
          "Execute lateral transfers across departments, teams, branch offices, or work locations.",
        category: "Movement",
        badge: "Relocation",
        tintClass: "bg-pastel-sky",
        tintVar: "--pastel-sky",
        icon: MapPin,
      },
      {
        id: "acting-additional-charge",
        title: "Acting / Additional Charge",
        description:
          "Assign interim dual responsibilities, temporary charge duties, and acting allowances.",
        category: "Movement",
        badge: "Interim Roles",
        tintClass: "bg-pastel-peach",
        tintVar: "--pastel-peach",
        icon: Zap,
      },
      {
        id: "demotion",
        title: "Demotion",
        description:
          "Process grade reclassifications, level reductions, and associated salary realignments.",
        category: "Movement",
        badge: "Reclassification",
        tintClass: "bg-pastel-rose",
        tintVar: "--pastel-rose",
        icon: TrendingDown,
      },
      {
        id: "deputation-secondment",
        title: "Deputation / Secondment",
        description:
          "Coordinate inter-agency deputations, international secondments, and host agreements.",
        category: "Movement",
        badge: "Secondment",
        tintClass: "bg-pastel-lavender",
        tintVar: "--pastel-lavender",
        icon: Globe,
      },
    ],
  },
  {
    id: "exit",
    title: "Exit",
    description:
      "Administer separation workflows, clearance settlements, resignations, and terminations.",
    icon: UserMinus,
    tintClass: "bg-pastel-rose",
    items: [
      {
        id: "contract-end-non-renewal",
        title: "Contract End / Non-renewal",
        description:
          "Process scheduled contract conclusions, non-renewal notifications, and offboarding checks.",
        category: "Exit",
        badge: "Contract End",
        tintClass: "bg-pastel-peach",
        tintVar: "--pastel-peach",
        icon: FileX,
      },
      {
        id: "final-settlement",
        title: "Final Settlement",
        description:
          "Calculate final dues, gratuity/provident fund payouts, and issue no-dues clearance.",
        category: "Exit",
        badge: "Settlement",
        tintClass: "bg-pastel-teal",
        tintVar: "--pastel-teal",
        icon: Receipt,
      },
      {
        id: "resignation",
        title: "Resignation",
        description:
          "Review employee resignation notices, manage notice periods, and schedule exit interviews.",
        category: "Exit",
        badge: "Voluntary",
        tintClass: "bg-pastel-sky",
        tintVar: "--pastel-sky",
        icon: LogOut,
      },
      {
        id: "retirement",
        title: "Retirement",
        description:
          "Process superannuation transitions, pension records, and formal retirement recognition.",
        category: "Exit",
        badge: "Retirement",
        tintClass: "bg-pastel-yellow",
        tintVar: "--pastel-yellow",
        icon: Sunrise,
      },
      {
        id: "termination",
        title: "Termination / Dismissal",
        description:
          "Execute involuntary separations, severance documentation, and systemic deprovisioning.",
        category: "Exit",
        badge: "Involuntary",
        tintClass: "bg-pastel-rose",
        tintVar: "--pastel-rose",
        icon: UserX,
      },
    ],
  },
  {
    id: "other",
    title: "Other",
    description:
      "Handle post-resignation reviews, retractions, and exception workflows.",
    icon: HelpCircle,
    tintClass: "bg-pastel-lavender",
    items: [
      {
        id: "resignation-withdrawal",
        title: "Resignation Withdrawal",
        description:
          "Review employee requests to revoke tendered resignations and reinstate ongoing employment.",
        category: "Other",
        badge: "Retention",
        tintClass: "bg-pastel-mint",
        tintVar: "--pastel-mint",
        icon: Undo2,
      },
    ],
  },
];

export function getActionCardById(id: string): ActionCardItem | undefined {
  for (const section of ACTION_SECTIONS) {
    const found = section.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

export interface ActionCenterTabProps {
  onNavigateToActivity?: () => void;
}

export function ActionCenterTab({ onNavigateToActivity }: ActionCenterTabProps = {}) {
  const navigate = useNavigate();
  const { summary, processes, isLoading } = useActionCenterOverview();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<ActionCardItem | null>(null);

  // Form states for executing/logging action
  const [targetEmployee, setTargetEmployee] = useState<string>("Usman Ali");
  const [actionSummary, setActionSummary] = useState<string>("");
  const [actionNotes, setActionNotes] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const handleRecordAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    const matchedEmp = employees.find((emp) => emp.name === targetEmployee);
    const finalSummary =
      actionSummary.trim() ||
      `${selectedAction.title} processed for ${targetEmployee}${effectiveDate ? ` effective ${effectiveDate}` : ""}.`;

    addActivityLog({
      actionId: selectedAction.id,
      actionTitle: selectedAction.title,
      category: selectedAction.category,
      employeeName: targetEmployee,
      employeeId: matchedEmp?.id,
      department: matchedEmp?.department || "Operations",
      summary: finalSummary,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: selectedAction.tintClass,
      tintVar: selectedAction.tintVar,
      effectiveDate,
      notes: actionNotes.trim() || undefined,
    });

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setSelectedAction(null);
      setActionSummary("");
      setActionNotes("");
    }, 1200);
  };

  const filteredSections = useMemo(() => {
    let sections = ACTION_SECTIONS;

    if (selectedSectionFilter !== "all") {
      sections = sections.filter((s) => s.id === selectedSectionFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.badge.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery, selectedSectionFilter]);

  const totalActionsCount = useMemo(() => {
    return ACTION_SECTIONS.reduce((acc, sec) => acc + sec.items.length, 0);
  }, []);

  return (
    <div className="space-y-8">
      {/* ── Top Header & Filter Bar ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-pastel-teal/70 px-3 py-1 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Operational Workflows</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Action Center</h2>
          {isLoading ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <span>Connecting to live workforce service...</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {summary
                ? `${summary.total_action_records} operational records logged · ${summary.applied} applied · ${summary.scheduled} scheduled · ${summary.process_count} workflows`
                : `${ACTION_SECTIONS.length} functional areas · ${totalActionsCount} operational action workflows.`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search all action workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9 bg-card text-sm"
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Section Quick-Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 pb-3">
        <button
          type="button"
          onClick={() => setSelectedSectionFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
            selectedSectionFilter === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All ({totalActionsCount})
        </button>
        {ACTION_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setSelectedSectionFilter(sec.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5",
              selectedSectionFilter === sec.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>{sec.title}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                selectedSectionFilter === sec.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background/80 text-muted-foreground"
              )}
            >
              {sec.items.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Empty search state ── */}
      {filteredSections.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">No matching actions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No action cards match "{searchQuery}". Try searching for another keyword or select "All".
          </p>
          <div className="mt-4 flex gap-2">
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
            {selectedSectionFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSectionFilter("all")}
              >
                Show all sections
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      {filteredSections.map((section) => {
        const SectionIcon = section.icon;

        return (
          <section key={section.id} className="space-y-4">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shadow-xs",
                    section.tintClass
                  )}
                >
                  <SectionIcon className="h-4 w-4 text-foreground/80" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {section.title}
                    </h3>
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      {section.items.length} {section.items.length === 1 ? "Action" : "Actions"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.items.map((item) => {
                const ItemIcon = item.icon;
                const procCode = CARD_TO_PROCESS_CODE[item.id];
                const procStats = processes.find((p) => p.Process_Code === procCode)?.statistics;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate({
                        to: "/action-center/$actionId" as any,
                        params: { actionId: item.id } as any,
                      });
                    }}
                    style={{ ["--tile" as string]: `var(${item.tintVar})` }}
                    className={cn(
                      "group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-xl border bg-card p-5 text-left transition-all duration-200 cursor-pointer",
                      "hover:shadow-[0_16px_32px_-16px_color-mix(in_oklab,var(--tile)_60%,transparent)]",
                      "hover:-translate-y-1 hover:border-primary/50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )}
                  >
                    <div className="card-glow" />
                    <div
                      aria-hidden
                      className="blob pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-xl transition-opacity group-hover:opacity-60"
                      style={{ background: `var(${item.tintVar})` }}
                    />

                    <div>
                      <div className="relative mb-3.5 flex items-center justify-between">
                        <div className={cn("icon-tile", item.tintClass)}>
                          <ItemIcon className="h-5 w-5 stroke-[2]" />
                        </div>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-0.5">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <div className="relative mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                        {item.badge}
                      </div>

                      <h4 className="relative text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {item.title}
                      </h4>

                      <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="relative mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {item.category}
                      </span>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16 rounded-full" />
                      ) : procStats && procStats.recorded_all_time > 0 ? (
                        <span className="rounded-full bg-pastel-mint/70 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                          {procStats.recorded_all_time} recorded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium transition-colors group-hover:text-primary">
                          Configure
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ── Detail / Action Dialog ── */}
      <Dialog open={!!selectedAction} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedAction && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("icon-tile", selectedAction.tintClass)}>
                    <selectedAction.icon className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {selectedAction.category} · {selectedAction.badge}
                    </div>
                    <DialogTitle className="text-xl font-bold mt-0.5">
                      {selectedAction.title}
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="pt-2 text-xs leading-relaxed text-muted-foreground">
                  {selectedAction.description}
                </DialogDescription>
              </DialogHeader>

              {submitSuccess ? (
                <div className="py-6 flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center animate-in zoom-in-50">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground">Action Recorded!</h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    This change has been logged into the <strong>Activity</strong> tab.
                  </p>
                  {onNavigateToActivity && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setSelectedAction(null);
                        setSubmitSuccess(false);
                        onNavigateToActivity();
                      }}
                    >
                      View in Activity Tab
                    </Button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRecordAction} className="space-y-4 pt-1">
                  {/* Employee Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Target Employee
                    </label>
                    <Select value={targetEmployee} onValueChange={setTargetEmployee}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.name} className="text-xs">
                            {emp.name} — {emp.positionTitle} ({emp.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Summary / Specific change details */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Change Details / Summary
                    </label>
                    <Input
                      type="text"
                      placeholder={`e.g. Process ${selectedAction.title} with updated terms`}
                      value={actionSummary}
                      onChange={(e) => setActionSummary(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Effective Date & Justification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Effective Date
                      </label>
                      <Input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Notes / Reference (Optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Approved by department head"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      Submitting this action will automatically create an audit record in the <strong>Activity</strong> tab.
                    </span>
                  </div>

                  <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAction(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Record & Log Action
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
