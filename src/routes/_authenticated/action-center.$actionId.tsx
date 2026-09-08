import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Calendar,
  Send,
  User,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employees } from "@/lib/employees";
import { addActivityLog, useActivityLogs } from "@/lib/activity-store";
import {
  getActionCardById,
  type ActionCardItem,
} from "@/components/action-center/ActionCenterTab";
import { ProbationConfirmationPage } from "@/components/action-center/ProbationConfirmationPage";
import { ProbationExtensionPage } from "@/components/action-center/ProbationExtensionPage";
import { ContractRenewalExtensionPage } from "@/components/action-center/ContractRenewalExtensionPage";
import { PromotionPage } from "@/components/action-center/PromotionPage";
import { TransferPage } from "@/components/action-center/TransferPage";
import { ResignationPage } from "@/components/action-center/ResignationPage";
import { RetirementPage } from "@/components/action-center/RetirementPage";
import { TerminationDismissalPage } from "@/components/action-center/TerminationDismissalPage";
import { RejoiningRehirePage } from "@/components/action-center/RejoiningRehirePage";
import { ContractEndNonRenewalPage } from "@/components/action-center/ContractEndNonRenewalPage";
import { FinalSettlementPage } from "@/components/action-center/FinalSettlementPage";
import { ActingAdditionalChargePage } from "@/components/action-center/ActingAdditionalChargePage";
import { DemotionPage } from "@/components/action-center/DemotionPage";
import { DeputationSecondmentPage } from "@/components/action-center/DeputationSecondmentPage";
import { ResignationWithdrawalPage } from "@/components/action-center/ResignationWithdrawalPage";

export const Route = createFileRoute("/_authenticated/action-center/$actionId")({
  ssr: false,
  head: ({ params }) => {
    const card = getActionCardById(params.actionId);
    const title = card
      ? `${card.title} — Action Center — PeopleLens`
      : "Action Center — PeopleLens";
    return {
      meta: [
        { title },
        {
          name: "description",
          content:
            card?.description ||
            "Operational HR workflow execution and record management.",
        },
        { property: "og:title", content: title },
      ],
    };
  },
  component: ActionCenterDetailRoute,
});

function ActionCenterDetailRoute() {
  const { actionId } = Route.useParams();

  if (actionId === "probation-confirmation") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ProbationConfirmationPage />
      </main>
    );
  }

  if (actionId === "probation-extension") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ProbationExtensionPage />
      </main>
    );
  }

  if (actionId === "contract-renewal-extension") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ContractRenewalExtensionPage />
      </main>
    );
  }

  if (actionId === "promotion") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <PromotionPage />
      </main>
    );
  }

  if (actionId === "transfer") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <TransferPage />
      </main>
    );
  }

  if (actionId === "resignation") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ResignationPage />
      </main>
    );
  }

  if (actionId === "retirement") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <RetirementPage />
      </main>
    );
  }

  if (actionId === "termination" || actionId === "termination-dismissal") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <TerminationDismissalPage />
      </main>
    );
  }

  if (actionId === "rejoining-rehire") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <RejoiningRehirePage />
      </main>
    );
  }

  if (actionId === "contract-end-non-renewal") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ContractEndNonRenewalPage />
      </main>
    );
  }

  if (actionId === "final-settlement") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <FinalSettlementPage />
      </main>
    );
  }

  if (actionId === "acting-additional-charge") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ActingAdditionalChargePage />
      </main>
    );
  }

  if (actionId === "demotion") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <DemotionPage />
      </main>
    );
  }

  if (actionId === "deputation-secondment") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <DeputationSecondmentPage />
      </main>
    );
  }

  if (actionId === "resignation-withdrawal") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ResignationWithdrawalPage />
      </main>
    );
  }

  const card = getActionCardById(actionId);

  if (!card) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
            Action Workflow Not Found
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            The action workflow <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground font-mono">{actionId}</code> was not found in the active workflow registry.
          </p>
          <div className="mt-6">
            <Link
              to="/task-center"
              search={{ tab: "action-center" } as any}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Task Center</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <GenericActionWorkflowPage card={card} />
    </main>
  );
}

function GenericActionWorkflowPage({ card }: { card: ActionCardItem }) {
  const navigate = useNavigate();
  const allLogs = useActivityLogs();

  const relevantLogs = useMemo(() => {
    return allLogs.filter((log) => log.actionId === card.id);
  }, [allLogs, card.id]);

  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("Usman Ali");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [actionSummary, setActionSummary] = useState<string>("");
  const [actionNotes, setActionNotes] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.name === selectedEmployeeName);
  }, [selectedEmployeeName]);

  const CardIcon = card.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const summaryText =
      actionSummary.trim() ||
      `${card.title} recorded for ${selectedEmployeeName}${
        effectiveDate ? ` effective ${effectiveDate}` : ""
      }.`;

    addActivityLog({
      actionId: card.id,
      actionTitle: card.title,
      category: card.category,
      employeeName: selectedEmployeeName,
      employeeId: selectedEmployee?.id,
      department: selectedEmployee?.department || "Operations",
      summary: summaryText,
      performedBy: "Ahmad Jalal (HR Lead)",
      status: "Completed",
      tintClass: card.tintClass,
      tintVar: card.tintVar,
      effectiveDate,
      notes: actionNotes.trim() || undefined,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setActionSummary("");
      setActionNotes("");
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ── Top Navigation Link ── */}
      <div>
        <Link
          to="/task-center"
          search={{ tab: "action-center" } as any}
          className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Task Center</span>
        </Link>
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-xs",
              card.tintClass
            )}
          >
            <CardIcon className="h-6 w-6 text-foreground/90 stroke-[2]" />
          </div>
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{card.category} Workflow</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">{card.badge}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {card.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              {card.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/task-center"
            search={{ tab: "activity" } as any}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Audit History</span>
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            RECORDED · ALL TIME
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {relevantLogs.length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Historical records logged</div>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            LAST 30 DAYS
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {relevantLogs.length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Recorded in current cycle</div>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            LAST PERFORMED
          </div>
          <div className="mt-2 text-base font-semibold text-foreground truncate">
            {relevantLogs.length > 0 ? relevantLogs[0].timestamp : "—"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Most recent activity</div>
        </div>

        <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            ON SAVE
          </div>
          <div className="mt-2 text-sm font-semibold text-foreground">
            Updates the record
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Auto-audited in Activity tab
          </div>
        </div>
      </div>

      {/* ── Main Execution Card & Form ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border bg-card p-6 shadow-xs">
            <div className="border-b border-border/60 pb-4 mb-5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Record New {card.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Execute and commit this operation. An audit record will immediately reflect across PeopleLens.
              </p>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in-95 duration-200">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="mt-3 text-lg font-bold text-foreground">
                  Action Successfully Recorded!
                </h4>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  {card.title} has been logged for {selectedEmployeeName}. You can track this in the Activity tab.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link
                    to="/task-center"
                    search={{ tab: "activity" } as any}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    View in Activity Tab
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSuccess(false)}
                    className="text-xs"
                  >
                    Record Another
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Employee Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Target Employee <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedEmployeeName}
                    onValueChange={setSelectedEmployeeName}
                  >
                    <SelectTrigger className="h-10 text-xs">
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

                  {selectedEmployee && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        <strong className="text-foreground">{selectedEmployee.name}</strong> · {selectedEmployee.positionTitle} · {selectedEmployee.department} ({selectedEmployee.id})
                      </span>
                    </div>
                  )}
                </div>

                {/* Effective Date & Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Effective Date <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      required
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Reference / Approval Note (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Approved in monthly committee"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Action Details / Summary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Change Summary & Specific Instructions
                  </label>
                  <Input
                    type="text"
                    placeholder={`e.g. Execute ${card.title} with approved modifications`}
                    value={actionSummary}
                    onChange={(e) => setActionSummary(e.target.value)}
                    className="h-10 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank to auto-generate a standard description.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <Link to="/task-center" search={{ tab: "action-center" } as any}>
                    <Button type="button" variant="outline" size="sm" className="text-xs">
                      Cancel
                    </Button>
                  </Link>

                  <Button type="submit" size="sm" className="gap-2 text-xs">
                    <Send className="h-3.5 w-3.5" />
                    Record & Log {card.title}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Side Info & Recent Logs ── */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              Workflow Information
            </h4>
            <div className="mt-3 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>Functional Area</span>
                <span className="font-medium text-foreground">{card.category}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>Classification</span>
                <span className="font-medium text-foreground">{card.badge}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>Audit Policy</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Full Traceability
                </span>
              </div>
              <div className="flex justify-between">
                <span>Approval Rule</span>
                <span className="font-medium text-foreground">Configured in Workflow Manager</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Executions
              </h4>
              <Badge variant="secondary" className="text-[10px]">
                {relevantLogs.length}
              </Badge>
            </div>

            {relevantLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No recent executions logged for this action yet.
              </div>
            ) : (
              <div className="space-y-3">
                {relevantLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {log.employeeName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {log.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
