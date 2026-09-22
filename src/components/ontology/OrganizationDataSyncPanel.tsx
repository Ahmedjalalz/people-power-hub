import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Building,
  Plus,
  Copy,
  Check,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createOrganization,
  syncOrganizationDataset,
  type OrganizationDetail,
  type SyncResponse,
  type TenantItem,
} from "@/services/ontology";
import { cn } from "@/lib/utils";

type Props = {
  currentTenantId: string;
  onTenantChange: (tenantId: string) => void;
  tenants: TenantItem[];
  organizationDetail: OrganizationDetail | null;
  onRefreshOrganization: () => void;
  onOpenLiveGraph: () => void;
};

export function OrganizationDataSyncPanel({
  currentTenantId,
  onTenantChange,
  tenants,
  organizationDetail,
  onRefreshOrganization,
  onOpenLiveGraph,
}: Props) {
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [sourceSystem, setSourceSystem] = useState("partner_hr");
  const [sourceObject, setSourceObject] = useState("employees_current");
  const [sheetName, setSheetName] = useState("");
  const [mergeIntoExisting, setMergeIntoExisting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // New Organization modal state
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [newOrgTenantId, setNewOrgTenantId] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgCountry, setNewOrgCountry] = useState("United Kingdom");
  const [newOrgCurrency, setNewOrgCurrency] = useState("GBP");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Drag and drop state
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (f: File) => {
    const validExts = [".csv", ".json", ".xlsx", ".xlsm"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      toast.error(`Invalid format: ${f.name}. Please select a CSV, JSON, XLSX, or XLSM file.`);
      return;
    }
    setFile(f);
    if (!sourceObject || sourceObject === "employees_current") {
      setSourceObject(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
    }
    return btoa(binary);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose or drop a file to upload.");
      return;
    }
    setIsSyncing(true);
    try {
      const buffer = await file.arrayBuffer();
      const contentBase64 = arrayBufferToBase64(buffer);

      const result = await syncOrganizationDataset(
        currentTenantId,
        {
          filename: file.name,
          content_base64: contentBase64,
          source_system: sourceSystem.trim() || "partner_hr",
          source_object: sourceObject.trim() || file.name,
          sheet_name: sheetName.trim() || null,
        },
        mergeIntoExisting,
      );

      setSyncResult(result);
      toast.success(
        mergeIntoExisting
          ? `Merged into tenant ${currentTenantId} successfully!`
          : `Synchronized ${result.rows_received ?? 0} rows into tenant knowledge graph.`,
      );
      onRefreshOrganization();
    } catch (err) {
      toast.error(`Sync error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgTenantId || !newOrgName) {
      toast.error("Tenant ID and Name are required.");
      return;
    }
    setIsCreatingOrg(true);
    try {
      const org = await createOrganization({
        tenant_id: newOrgTenantId,
        name: newOrgName,
        country: newOrgCountry,
        currency: newOrgCurrency,
      });
      toast.success(`Organization ${org.tenant_id} created.`);
      onTenantChange(org.tenant_id);
      setShowNewOrgModal(false);
      setNewOrgTenantId("");
      setNewOrgName("");
    } catch (err) {
      toast.error("Failed to create organization.");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const copyRawJson = () => {
    if (!syncResult) return;
    navigator.clipboard.writeText(JSON.stringify(syncResult, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Organization Context & Selector Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building className="size-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Organization</span>
              <h3 className="text-lg font-bold text-foreground">
                {organizationDetail?.organization.name || currentTenantId}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentTenantId}
              onChange={(e) => onTenantChange(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {tenants.map((t) => (
                <option key={t.tenant_id} value={t.tenant_id}>
                  {t.name ? `${t.name} (${t.tenant_id})` : t.tenant_id}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => setShowNewOrgModal(!showNewOrgModal)}
            >
              <Plus className="mr-1.5 size-3.5" /> New Tenant
            </Button>
          </div>
        </div>

        {/* Organization detail stats */}
        {organizationDetail && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 sm:grid-cols-4">
            <div className="rounded-lg bg-background/50 p-2.5">
              <span className="text-[11px] text-muted-foreground">Status</span>
              <div className="mt-1 flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span className="capitalize">{organizationDetail.readiness.status}</span>
              </div>
            </div>
            <div className="rounded-lg bg-background/50 p-2.5">
              <span className="text-[11px] text-muted-foreground">Datasets Loaded</span>
              <p className="mt-1 text-xs font-bold text-foreground">
                {organizationDetail.readiness.loaded_dataset_count} of {organizationDetail.readiness.dataset_count}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 p-2.5">
              <span className="text-[11px] text-muted-foreground">Graph Nodes</span>
              <p className="mt-1 text-xs font-bold text-foreground">
                {organizationDetail.readiness.graph_node_count.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 p-2.5">
              <span className="text-[11px] text-muted-foreground">Graph Relationships</span>
              <p className="mt-1 text-xs font-bold text-foreground">
                {organizationDetail.readiness.graph_relationship_count.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Organization Form Modal/Collapse */}
      {showNewOrgModal && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-md animate-in fade-in slide-in-from-top-3">
          <h4 className="text-sm font-bold text-foreground">Register New Tenant Organization</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Create an isolated tenant container with dedicated Supabase JSONB tables and knowledge graph scope.
          </p>

          <form onSubmit={handleCreateOrganization} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold text-foreground">Tenant ID</label>
              <Input
                value={newOrgTenantId}
                onChange={(e) => setNewOrgTenantId(e.target.value)}
                placeholder="e.g. ACME-CORP-002"
                className="mt-1 text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground">Organization Name</label>
              <Input
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Acme International"
                className="mt-1 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground">Country / Region</label>
              <Input
                value={newOrgCountry}
                onChange={(e) => setNewOrgCountry(e.target.value)}
                placeholder="United Kingdom"
                className="mt-1 text-xs"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-foreground">Currency</label>
                <Input
                  value={newOrgCurrency}
                  onChange={(e) => setNewOrgCurrency(e.target.value)}
                  placeholder="GBP"
                  className="mt-1 text-xs uppercase"
                />
              </div>
              <Button type="submit" size="sm" className="h-9" disabled={isCreatingOrg}>
                {isCreatingOrg ? "Creating..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Upload + Auto-Sync Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">One-Click Ingestion Pipeline</span>
          <h3 className="mt-0.5 text-base font-bold text-foreground">
            Upload & Synchronize Dataset to Knowledge Graph
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Raw source records are preserved in tenant JSONB storage. Confirmed ontology mappings are automatically resolved,
            validated, and upserted into <code className="text-primary font-mono">kg_nodes</code> and <code className="text-primary font-mono">kg_relationships</code>.
          </p>
        </div>

        {/* Pipeline Step Indicator */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">1. Raw Upload</span>
          <ArrowRight className="size-3 text-primary" />
          <span className="font-semibold text-foreground">2. Supabase Storage</span>
          <ArrowRight className="size-3 text-primary" />
          <span className="font-semibold text-foreground">3. Auto Mapping</span>
          <ArrowRight className="size-3 text-primary" />
          <span className="font-semibold text-foreground">4. Validation</span>
          <ArrowRight className="size-3 text-primary" />
          <span className="font-semibold text-foreground">5. Graph Nodes</span>
          <ArrowRight className="size-3 text-primary" />
          <span className="font-semibold text-foreground">6. Graph Relationships</span>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSync} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Source System</label>
              <Input
                value={sourceSystem}
                onChange={(e) => setSourceSystem(e.target.value)}
                placeholder="partner_hr / workday / bamboo"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Source Object</label>
              <Input
                value={sourceObject}
                onChange={(e) => setSourceObject(e.target.value)}
                placeholder="employees_current"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Excel Sheet Name (Optional)</label>
              <Input
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Sheet1"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleFileDrop}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
              isDraggingFile
                ? "border-primary bg-primary/10"
                : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border/80 hover:border-primary/50 hover:bg-muted/30",
            )}
            onClick={() => document.getElementById("dataset-file-input")?.click()}
          >
            <input
              id="dataset-file-input"
              type="file"
              accept=".csv,.json,.xlsx,.xlsm"
              onChange={handleFileInputChange}
              className="sr-only"
            />
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UploadCloud className="size-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {file ? file.name : "Choose a file or drag and drop here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB · Ready to sync`
                : "Supports CSV, JSON, XLSX, or XLSM (up to 25 MB)"}
            </p>
          </div>

          {/* Merge Option Checkbox */}
          <div className="rounded-lg border border-border/80 bg-background/50 p-3.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mergeIntoExisting}
                onChange={(e) => setMergeIntoExisting(e.target.checked)}
                className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Merge / add into selected organization</span>
                <p className="mt-0.5 text-muted-foreground">
                  Preserves existing raw dataset snapshots and safely upserts new or matching graph entities into tenant {currentTenantId}.
                </p>
              </div>
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!file || isSyncing}>
            {isSyncing ? (
              <>
                <Sparkles className="mr-2 size-4 animate-spin" /> Synchronizing with Knowledge Graph...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 size-4" /> Upload & Sync Now
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Sync Results & Live Response View */}
      {syncResult && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Sync Response</span>
              <h3 className="text-lg font-bold text-foreground">Data Ingestion Complete</h3>
              <p className="text-xs text-muted-foreground">
                {syncResult.message || `Successfully processed records into tenant ${syncResult.tenant_id}.`}
              </p>
            </div>

            <Button variant="default" size="sm" onClick={onOpenLiveGraph}>
              Open in Live Graph Explorer <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </div>

          {/* Result Metric Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-border/80 bg-background/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Rows Ingested</span>
              <p className="mt-1 text-xl font-bold text-foreground">{syncResult.rows_received ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Mapped Columns</span>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {syncResult.mapping?.mapped_column_count ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Raw-Only</span>
              <p className="mt-1 text-xl font-bold text-muted-foreground">
                {syncResult.mapping?.unmapped_column_count ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Graph Nodes</span>
              <p className="mt-1 text-xl font-bold text-foreground">{syncResult.graph?.nodes_after ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Relationships</span>
              <p className="mt-1 text-xl font-bold text-foreground">{syncResult.graph?.relationships_after ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Supabase Raw</span>
              <p className="mt-1 text-xl font-bold text-primary">Stored</p>
            </div>
          </div>

          {/* Tag Breakdowns */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background/40 p-4">
              <h4 className="text-xs font-bold text-foreground">Mapped to Ontology</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {syncResult.mapping?.mapped_columns?.map((col) => (
                  <Badge key={col} variant="secondary" className="text-[10px] font-mono">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 p-4">
              <h4 className="text-xs font-bold text-foreground">Preserved Raw Storage Only</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {syncResult.mapping?.unmapped_columns?.length ? (
                  syncResult.mapping.unmapped_columns.map((col) => (
                    <Badge key={col} variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      {col}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">All columns mapped</span>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Full JSON view */}
          <div className="rounded-lg border border-border bg-background/40 p-3 text-xs">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground"
              >
                {showRawJson ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                Full API Response JSON
              </button>
              {showRawJson && (
                <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={copyRawJson}>
                  {copiedRaw ? <Check className="mr-1 size-3 text-emerald-500" /> : <Copy className="mr-1 size-3" />}
                  Copy JSON
                </Button>
              )}
            </div>

            {showRawJson && (
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted/50 p-3 font-mono text-[11px] text-foreground">
                {JSON.stringify(syncResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
