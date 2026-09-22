import React, { useState } from "react";
import { ShieldCheck, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type {
  MappingReview,
  ChangeRequest,
  MappingReviewOptions,
  DatasetSummary,
  DatasetDetail,
} from "@/services/ontology";
import { cn } from "@/lib/utils";

type Props = {
  reviews: MappingReview[];
  changeRequests: ChangeRequest[];
  reviewOptions: MappingReviewOptions | null;
  datasets: DatasetSummary[];
  onCreateReview: (payload: {
    source_file: string;
    source_column: string;
    proposed_ontology_path: string | null;
    proposed_disposition: string | null;
    reason: string;
  }) => Promise<void>;
  onDecideReview: (id: string, decision: "approved" | "rejected") => Promise<void>;
  onCreateChange: (payload: {
    kind: ChangeRequest["kind"];
    target: string;
    title: string;
    description: string;
  }) => Promise<void>;
  onDecideChange: (id: string, decision: "approved" | "rejected") => Promise<void>;
  fetchColumnsForDataset?: (file: string) => Promise<DatasetDetail>;
};

export function OntologyGovernanceView({
  reviews,
  changeRequests,
  reviewOptions,
  datasets,
  onCreateReview,
  onDecideReview,
  onCreateChange,
  onDecideChange,
  fetchColumnsForDataset,
}: Props) {
  const [activeTab, setActiveTab] = useState<"reviews" | "changes">("reviews");

  // Mapping review form state
  const [reviewSourceFile, setReviewSourceFile] = useState(datasets[0]?.source_file || "");
  const [reviewSourceColumn, setReviewSourceColumn] = useState("");
  const [reviewPath, setReviewPath] = useState("");
  const [reviewDisposition, setReviewDisposition] = useState("direct_map");
  const [reviewReason, setReviewReason] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Change request form state
  const [changeKind, setChangeKind] = useState<ChangeRequest["kind"]>("property");
  const [changeTarget, setChangeTarget] = useState("");
  const [changeTitle, setChangeTitle] = useState("");
  const [changeDescription, setChangeDescription] = useState("");
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewSourceFile || !reviewSourceColumn || !reviewReason) {
      toast.error("Please provide source dataset, source column, and a valid reason.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await onCreateReview({
        source_file: reviewSourceFile,
        source_column: reviewSourceColumn,
        proposed_ontology_path: reviewPath || null,
        proposed_disposition: reviewDisposition || null,
        reason: reviewReason,
      });
      toast.success("Mapping proposal staged in governance queue.");
      setReviewReason("");
      setReviewSourceColumn("");
    } catch (err) {
      toast.error("Failed to stage mapping review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeTarget || !changeTitle || !changeDescription) {
      toast.error("Please fill in target, title and rationale description.");
      return;
    }
    setIsSubmittingChange(true);
    try {
      await onCreateChange({
        kind: changeKind,
        target: changeTarget,
        title: changeTitle,
        description: changeDescription,
      });
      toast.success("Ontology change request submitted for review.");
      setChangeTitle("");
      setChangeTarget("");
      setChangeDescription("");
    } catch (err) {
      toast.error("Failed to submit change request.");
    } finally {
      setIsSubmittingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Safety Notice Banner */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Safe Governed Management Active
            </h4>
            <p className="text-xs text-muted-foreground">
              Production ontology schemas and mappings are never silently overwritten. Approvals record governance intent.
            </p>
          </div>
        </div>

        <div className="flex rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-semibold transition-all",
              activeTab === "reviews"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Mapping Proposals ({reviews.filter((r) => r.status === "pending").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("changes")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-semibold transition-all",
              activeTab === "changes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Change Requests ({changeRequests.filter((c) => c.status === "pending").length})
          </button>
        </div>
      </div>

      {activeTab === "reviews" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Create Mapping Review Form */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Stage Mapping Review</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Propose a new or revised mapping without mutating active datasets.
            </p>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground">Source Dataset</label>
                <select
                  value={reviewSourceFile}
                  onChange={(e) => setReviewSourceFile(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {datasets.map((d) => (
                    <option key={d.source_file} value={d.source_file}>
                      {d.source_file}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Source Column</label>
                <Input
                  value={reviewSourceColumn}
                  onChange={(e) => setReviewSourceColumn(e.target.value)}
                  placeholder="e.g. employee_secondary_email"
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Proposed Canonical Path</label>
                <select
                  value={reviewPath}
                  onChange={(e) => setReviewPath(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">— Unmapped / Keep Raw Storage Only —</option>
                  {reviewOptions?.ontology_paths.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value} ({p.data_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Proposed Disposition</label>
                <select
                  value={reviewDisposition}
                  onChange={(e) => setReviewDisposition(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {reviewOptions?.dispositions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Governance Rationale</label>
                <Textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Explain why this column classification should be amended..."
                  className="mt-1 text-xs"
                  rows={3}
                  required
                />
              </div>

              <Button type="submit" size="sm" className="w-full" disabled={isSubmittingReview}>
                <Send className="mr-2 size-3.5" />
                {isSubmittingReview ? "Submitting..." : "Stage Proposal"}
              </Button>
            </form>
          </div>

          {/* Mapping Reviews Queue */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Mapping Governance Queue</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Review and decide staged classification proposals.
            </p>

            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No mapping proposals in queue.</p>
              ) : (
                reviews.map((r) => {
                  const isPending = r.status === "pending";
                  return (
                    <div
                      key={r.id}
                      className="rounded-lg border border-border/80 bg-background/50 p-3.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">{r.source_file}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {r.source_column}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                        </div>
                        <Badge
                          variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}
                          className="text-[10px] capitalize"
                        >
                          {r.status}
                        </Badge>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Path: <strong className="text-foreground">{r.proposed_ontology_path || "None"}</strong></span>
                        <span>Disposition: <strong className="text-foreground">{r.proposed_disposition || "—"}</strong></span>
                      </div>

                      {isPending && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => onDecideReview(r.id, "approved")}
                          >
                            <CheckCircle2 className="mr-1.5 size-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => onDecideReview(r.id, "rejected")}
                          >
                            <XCircle className="mr-1.5 size-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Create Change Request Form */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">New Ontology Change Request</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Propose updates to entities, properties, relations, or service contracts.
            </p>

            <form onSubmit={handleSubmitChange} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground">Change Category</label>
                <select
                  value={changeKind}
                  onChange={(e) => setChangeKind(e.target.value as ChangeRequest["kind"])}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="property">Property</option>
                  <option value="entity">Entity</option>
                  <option value="relationship">Relationship</option>
                  <option value="service_contract">AI Service Contract</option>
                  <option value="mapping">Dataset Mapping</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Target Schema Element</label>
                <Input
                  value={changeTarget}
                  onChange={(e) => setChangeTarget(e.target.value)}
                  placeholder="e.g. Employee.certifications"
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Proposal Title</label>
                <Input
                  value={changeTitle}
                  onChange={(e) => setChangeTitle(e.target.value)}
                  placeholder="Short summary of requested change"
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Detailed Description & Impact</label>
                <Textarea
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="Detail why this schema enhancement is required and how downstream AI models will use it..."
                  className="mt-1 text-xs"
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" size="sm" className="w-full" disabled={isSubmittingChange}>
                <Send className="mr-2 size-3.5" />
                {isSubmittingChange ? "Submitting..." : "Create Change Request"}
              </Button>
            </form>
          </div>

          {/* Change Requests Queue */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Ontology Evolution Queue</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Review and decide schema enhancement proposals.
            </p>

            <div className="mt-4 space-y-3">
              {changeRequests.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No change requests in queue.</p>
              ) : (
                changeRequests.map((c) => {
                  const isPending = c.status === "pending";
                  return (
                    <div
                      key={c.id}
                      className="rounded-lg border border-border/80 bg-background/50 p-3.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">{c.title}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {c.kind}
                            </Badge>
                          </div>
                          <code className="mt-1 block text-[11px] text-primary">{c.target}</code>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
                        </div>
                        <Badge
                          variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}
                          className="text-[10px] capitalize"
                        >
                          {c.status}
                        </Badge>
                      </div>

                      {isPending && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => onDecideChange(c.id, "approved")}
                          >
                            <CheckCircle2 className="mr-1.5 size-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => onDecideChange(c.id, "rejected")}
                          >
                            <XCircle className="mr-1.5 size-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
