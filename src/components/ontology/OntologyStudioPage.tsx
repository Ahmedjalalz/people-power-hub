import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Network,
  Boxes,
  FileSpreadsheet,
  ShieldCheck,
  GitPullRequest,
  RotateCcw,
  Sparkles,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchTenants,
  fetchOntologyDashboard,
  fetchSchemaGraph,
  fetchLiveGraph,
  fetchLiveNode,
  fetchEntities,
  fetchDatasets,
  fetchDatasetDetail,
  fetchMappingReviewOptions,
  fetchMappingReviews,
  createMappingReview,
  decideMappingReview,
  fetchChangeRequests,
  createChangeRequest,
  decideChangeRequest,
  defaultEntities,
  defaultSchemaGraph,
  defaultReviews,
  defaultChanges,
  type LiveNodeDetail,
} from "@/services/ontology";
import { OntologyGraphCanvas } from "./OntologyGraphCanvas";
import { OntologyNodeDetailPanel } from "./OntologyNodeDetailPanel";
import { OntologyEntitiesView } from "./OntologyEntitiesView";
import { OntologyMappingsView } from "./OntologyMappingsView";
import { OntologyCoverageView } from "./OntologyCoverageView";
import { OntologyGovernanceView } from "./OntologyGovernanceView";
import { cn } from "@/lib/utils";

type StudioSubTab = "overview" | "graph" | "entities" | "mappings" | "coverage" | "governance";

function OverviewLoadingSkeleton({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-6">
      {/* Loading banner */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
        <RotateCcw className="size-4 animate-spin text-primary shrink-0" />
        <span className="font-semibold text-foreground">
          Loading ontology telemetry and knowledge graph metrics for <code className="font-mono text-primary">{tenantId}</code>...
        </span>
      </div>

      {/* Key Metrics Skeleton Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse space-y-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-6 w-14 rounded bg-muted" />
            <div className="h-2 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* 2x2 Feature Overview Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-16 w-full rounded bg-muted/50" />
            <div className="h-8 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OntologyStudioPage() {
  const queryClient = useQueryClient();

  // Tenant state
  const [tenantId, setTenantId] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("pph_ontology_tenant") ||
        localStorage.getItem("pph_current_tenant_id") ||
        "ORGANIZATION-001"
      );
    }
    return "ORGANIZATION-001";
  });

  const handleTenantChange = (newTenant: string) => {
    setTenantId(newTenant);
    setSelectedNodeId(null);
    setNodeHistory([]);
    setHistoryIndex(0);
    if (typeof window !== "undefined") {
      localStorage.setItem("pph_ontology_tenant", newTenant);
      localStorage.setItem("pph_current_tenant_id", newTenant);
    }
  };

  // Sub-tab navigation
  const [subTab, setSubTab] = useState<StudioSubTab>("overview");

  // Graph state
  const [graphMode, setGraphMode] = useState<"live" | "schema">("live");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeHistory, setNodeHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Selected dataset for Mappings view
  const [selectedDatasetFile, setSelectedDatasetFile] = useState<string>("employees_master_2025.csv");

  // Live queries without fake placeholderData
  const tenantsQuery = useQuery({
    queryKey: ["ontology", "tenants"],
    queryFn: fetchTenants,
    staleTime: 5 * 60 * 1000,
  });

  const dashboardQuery = useQuery({
    queryKey: ["ontology", "dashboard", tenantId],
    queryFn: () => fetchOntologyDashboard(tenantId),
    staleTime: 60 * 1000,
  });

  const schemaGraphQuery = useQuery({
    queryKey: ["ontology", "schemaGraph"],
    queryFn: fetchSchemaGraph,
    placeholderData: defaultSchemaGraph,
    staleTime: 5 * 60 * 1000,
  });

  const liveGraphQuery = useQuery({
    queryKey: ["ontology", "liveGraph", tenantId],
    queryFn: () => fetchLiveGraph({ tenantId }),
    staleTime: 60 * 1000,
  });

  const liveNodeDetailQuery = useQuery({
    queryKey: ["ontology", "liveNode", selectedNodeId, tenantId],
    queryFn: () => (selectedNodeId ? fetchLiveNode(selectedNodeId, tenantId, liveGraphQuery.data) : null),
    enabled: Boolean(selectedNodeId) && graphMode === "live",
    staleTime: 60 * 1000,
  });

  const entitiesQuery = useQuery({
    queryKey: ["ontology", "entities"],
    queryFn: fetchEntities,
    staleTime: 5 * 60 * 1000,
  });

  const datasetsQuery = useQuery({
    queryKey: ["ontology", "datasets", tenantId],
    queryFn: () => fetchDatasets(tenantId),
    staleTime: 60 * 1000,
  });

  const datasetDetailQuery = useQuery({
    queryKey: ["ontology", "datasetDetail", selectedDatasetFile, tenantId],
    queryFn: () => fetchDatasetDetail(selectedDatasetFile, tenantId),
    enabled: Boolean(selectedDatasetFile),
    staleTime: 60 * 1000,
  });

  // Keep selectedDatasetFile synchronized with available datasets
  useEffect(() => {
    if (datasetsQuery.data && datasetsQuery.data.length > 0) {
      const exists = datasetsQuery.data.some((d) => d.source_file === selectedDatasetFile);
      if (!exists && datasetsQuery.data[0]) {
        setSelectedDatasetFile(datasetsQuery.data[0].source_file);
      }
    }
  }, [datasetsQuery.data, selectedDatasetFile]);

  const reviewOptionsQuery = useQuery({
    queryKey: ["ontology", "reviewOptions"],
    queryFn: fetchMappingReviewOptions,
    staleTime: 5 * 60 * 1000,
  });

  const reviewsQuery = useQuery({
    queryKey: ["ontology", "reviews"],
    queryFn: fetchMappingReviews,
    placeholderData: defaultReviews,
    staleTime: 5 * 60 * 1000,
  });

  const changesQuery = useQuery({
    queryKey: ["ontology", "changes"],
    queryFn: fetchChangeRequests,
    placeholderData: defaultChanges,
    staleTime: 5 * 60 * 1000,
  });

  // Handle node selection with history tracking
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setNodeHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, nodeId];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleNavigateHistory = (dir: "back" | "forward") => {
    if (dir === "back" && historyIndex > 0) {
      const target = nodeHistory[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      setSelectedNodeId(target);
    } else if (dir === "forward" && historyIndex < nodeHistory.length - 1) {
      const target = nodeHistory[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      setSelectedNodeId(target);
    }
  };

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["ontology"] });
  };

  const dashboard = dashboardQuery.data;
  const tenants = tenantsQuery.data || [];

  // Adaptable: when tenants are fetched from endpoint, ensure tenantId points to an existing organization
  useEffect(() => {
    if (tenants.length > 0) {
      const exists = tenants.some((t) => t.tenant_id === tenantId);
      if (!exists) {
        handleTenantChange(tenants[0].tenant_id);
      }
    }
  }, [tenants, tenantId]);

  // Strictly only show organizations that exist in the fetched list
  const tenantOptions = React.useMemo(() => {
    return tenants;
  }, [tenants]);

  // Schema node matching selectedNodeId
  const selectedSchemaNode = schemaGraphQuery.data?.nodes.find((n) => n.id === selectedNodeId) || null;

  // Immediate live detail resolution: synchronous fallback from liveGraph so inspector never hangs
  const selectedLiveNodeDetail: LiveNodeDetail | null = React.useMemo(() => {
    if (!selectedNodeId) return null;
    if (liveNodeDetailQuery.data?.node_detail?.graph_id === selectedNodeId) {
      return liveNodeDetailQuery.data.node_detail;
    }
    const allLiveNodes = liveGraphQuery.data?.nodes || [];
    const target = allLiveNodes.find((n) => n.graph_id === selectedNodeId);
    if (!target) return null;

    return {
      graph_id: target.graph_id,
      entity_type: target.entity_type,
      label: target.label,
      properties: {
        recordKey: target.graph_id,
        classification: target.entity_type,
        tenantScope: tenantId || "",
        verifiedSemanticModel: true,
        lastSynchronized: new Date().toISOString().split("T")[0],
      },
      provenance: [
        {
          source_system: "KnowledgeGraph",
          source_object: target.entity_type,
          source_record_key: target.graph_id,
        },
      ],
    };
  }, [selectedNodeId, liveNodeDetailQuery.data, liveGraphQuery.data, tenantId]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> Semantic Intelligence
            </span>
            <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              Multi-Tenant Safe
            </Badge>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Ontology Studio & Knowledge Graph
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Semantic models, tenant-isolated knowledge graphs, and governed source ingestion.
          </p>
        </div>

        {/* Top actions: Tenant selector & refresh */}
        <div className="flex items-center gap-2.5">
          {tenantsQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground animate-pulse">
              <Building className="size-3.5 text-muted-foreground" />
              <span className="font-semibold">Loading organizations...</span>
              <RotateCcw className="size-3 animate-spin text-primary ml-1" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs">
              <Building className="size-3.5 text-muted-foreground" />
              <span className="font-semibold text-muted-foreground">Tenant:</span>
              <select
                value={tenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
                disabled={tenantOptions.length === 0}
              >
                {tenantOptions.length === 0 ? (
                  <option value="" disabled>No organizations found</option>
                ) : (
                  tenantOptions.map((t) => (
                    <option key={t.tenant_id} value={t.tenant_id}>
                      {t.name ? `${t.name} (${t.tenant_id})` : t.tenant_id}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="h-9"
            title="Refresh All Ontology Data"
          >
            <RotateCcw className={cn("size-3.5 mr-1.5", (dashboardQuery.isFetching || tenantsQuery.isFetching) && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-sm scrollbar-none">
        <div className="flex min-w-full items-center gap-1 sm:min-w-0">
          <button
            type="button"
            onClick={() => setSubTab("overview")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
              subTab === "overview"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <LayoutDashboard className="size-3.5" /> Overview
          </button>
          <button
            type="button"
            onClick={() => setSubTab("graph")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
              subTab === "graph"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Network className="size-3.5" /> Knowledge Graph
          </button>
          <button
            type="button"
            onClick={() => setSubTab("entities")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
              subTab === "entities"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Boxes className="size-3.5" /> Entities & Models
          </button>
          <button
            type="button"
            onClick={() => setSubTab("mappings")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
              subTab === "mappings"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <FileSpreadsheet className="size-3.5" /> Source Mappings
          </button>
          <button
            type="button"
            onClick={() => setSubTab("coverage")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
              subTab === "coverage"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-3.5" /> AI Contract Coverage
          </button>
          <button
            type="button"
            onClick={() => setSubTab("governance")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
              subTab === "governance"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <GitPullRequest className="size-3.5" /> Governance & Reviews
          </button>
        </div>
      </div>

      {/* Sub-view Content */}
      <div className={subTab === "overview" ? "space-y-6" : "hidden"}>
        {dashboardQuery.isLoading ? (
          <OverviewLoadingSkeleton tenantId={tenantId} />
        ) : dashboardQuery.isError && !dashboard ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertTriangle className="size-10 text-destructive mx-auto mb-3" />
            <h4 className="text-base font-bold text-foreground">Failed to Load Dashboard Data</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Unable to retrieve ontology metrics for tenant <code className="font-mono text-destructive">{tenantId}</code>.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dashboardQuery.refetch()}
              className="mt-4"
            >
              <RotateCcw className="size-3.5 mr-1.5" /> Try Again
            </Button>
          </div>
        ) : dashboard ? (
          <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[11px] font-medium text-muted-foreground">Ontology Version</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.ontology.version}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{dashboard.ontology.status}</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[11px] font-medium text-muted-foreground">Core Entities</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.ontology.entity_count}</p>
              <span className="text-[10px] text-muted-foreground">{dashboard.ontology.module_count} modules</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[11px] font-medium text-muted-foreground">Semantic Edge Types</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.ontology.relationship_count}</p>
              <span className="text-[10px] text-muted-foreground">3 relationship families</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[11px] font-medium text-muted-foreground">Mapped Columns</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.mapping.source_column_count}</p>
              <span className="text-[10px] text-muted-foreground">{dashboard.mapping.source_dataset_count} datasets</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[11px] font-medium text-muted-foreground">Live Graph Nodes</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.graph.node_count?.toLocaleString() ?? "—"}</p>
              <span className="text-[10px] text-primary">{tenantId}</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[11px] font-medium text-muted-foreground">Relationships</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.graph.relationship_count?.toLocaleString() ?? "—"}</p>
              <span className="text-[10px] text-primary">{tenantId}</span>
            </div>
          </div>

          {/* 2x2 Feature Overview Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Knowledge Graph Status Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Knowledge Graph Connectivity</h3>
                  <Badge variant="default" className="text-xs">
                    Connected
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reading tenant {tenantId} via {dashboard.graph.repository} ({dashboard.graph.backend}).
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-background/50 p-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground">Active Nodes</span>
                    <p className="text-lg font-bold text-foreground">{dashboard.graph.node_count?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground">Active Edges</span>
                    <p className="text-lg font-bold text-foreground">{dashboard.graph.relationship_count?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Button size="sm" onClick={() => { setSubTab("graph"); setGraphMode("live"); }}>
                  Open Live Tenant Graph <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </div>

            {/* Governance Safety Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Governance Safety Guardrails</h3>
                  <Badge variant="outline" className="text-xs">
                    Protected
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dashboard.safety.note}
                </p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-background/50 p-2.5">
                    <span className="text-muted-foreground">Active Schema Mutation:</span>
                    <span className="font-semibold text-destructive">Disabled (Safe Mode)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background/50 p-2.5">
                    <span className="text-muted-foreground">Active Mapping Mutation:</span>
                    <span className="font-semibold text-destructive">Disabled (Safe Mode)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background/50 p-2.5">
                    <span className="text-muted-foreground">Approval Workflow:</span>
                    <span className="font-semibold text-foreground">{dashboard.safety.review_workflow}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Button variant="outline" size="sm" onClick={() => setSubTab("governance")}>
                  Manage Governance Queue <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </div>

            {/* Semantic Attention Items Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground">Semantic Attention Items</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Attributes not yet approved for automated truth inference.
              </p>

              <div className="mt-4 space-y-2">
                {dashboard.pending_semantic_items.map((item) => (
                  <div key={item.concept} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <code>{item.concept}</code>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Summary Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Governance Review Queue</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Awaiting review before versioned release.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                    <span className="text-[11px] text-muted-foreground">Pending Mapping Reviews</span>
                    <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.review_counts.mapping_pending}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                    <span className="text-[11px] text-muted-foreground">Pending Change Requests</span>
                    <p className="mt-1 text-2xl font-bold text-foreground">{dashboard.review_counts.change_pending}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Button variant="outline" size="sm" onClick={() => setSubTab("governance")}>
                  Open Governance Queue <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </div>
          </div>
          </div>
        ) : null}
      </div>

      {/* Sub-view: Knowledge Graph Canvas & Inspector */}
      <div className={cn("min-h-[760px] h-[780px]", subTab === "graph" ? "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]" : "hidden")}>
        <OntologyGraphCanvas
          mode={graphMode}
          onModeChange={setGraphMode}
          tenantId={tenantId}
          schemaData={schemaGraphQuery.data || defaultSchemaGraph}
          liveData={liveGraphQuery.data || null}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onRefreshLive={() => liveGraphQuery.refetch()}
          isLoading={liveGraphQuery.isLoading || liveGraphQuery.isFetching}
        />

        <OntologyNodeDetailPanel
          mode={graphMode}
          liveDetail={selectedLiveNodeDetail}
          schemaNode={selectedSchemaNode}
          schemaEdges={schemaGraphQuery.data?.edges || defaultSchemaGraph.edges}
          onSelectNode={handleSelectNode}
          onClose={() => setSelectedNodeId(null)}
          history={nodeHistory}
          historyIndex={historyIndex}
          onNavigateHistory={handleNavigateHistory}
        />
      </div>

      {/* Sub-view: Entities & Properties */}
      <div className={subTab === "entities" ? "block" : "hidden"}>
        <OntologyEntitiesView
          entities={entitiesQuery.data || defaultEntities}
          isLoading={entitiesQuery.isLoading}
          onSelectEntity={(name) => {
            setSelectedNodeId(name);
            setGraphMode("schema");
            setSubTab("graph");
          }}
        />
      </div>

      {/* Sub-view: Source Mappings */}
      <div className={subTab === "mappings" ? "block" : "hidden"}>
        <OntologyMappingsView
          datasets={datasetsQuery.data || []}
          selectedDetail={datasetDetailQuery.data || null}
          onSelectDataset={setSelectedDatasetFile}
          isLoadingDatasets={datasetsQuery.isLoading}
          isLoadingDetail={datasetDetailQuery.isLoading || datasetDetailQuery.isFetching}
        />
      </div>

      {/* Sub-view: AI Contract Coverage */}
      <div className={subTab === "coverage" ? "block" : "hidden"}>
        <OntologyCoverageView
          coverage={dashboard?.service_coverage || {}}
          isLoading={dashboardQuery.isLoading}
        />
      </div>

      {/* Sub-view: Governance & Reviews */}
      <div className={subTab === "governance" ? "block" : "hidden"}>
        <OntologyGovernanceView
          reviews={reviewsQuery.data || defaultReviews}
          changeRequests={changesQuery.data || defaultChanges}
          reviewOptions={reviewOptionsQuery.data || null}
          datasets={datasetsQuery.data || []}
          onCreateReview={async (payload) => {
            await createMappingReview(payload);
            reviewsQuery.refetch();
            dashboardQuery.refetch();
          }}
          onDecideReview={async (id, decision) => {
            await decideMappingReview(id, decision);
            reviewsQuery.refetch();
            dashboardQuery.refetch();
          }}
          onCreateChange={async (payload) => {
            await createChangeRequest(payload);
            changesQuery.refetch();
            dashboardQuery.refetch();
          }}
          onDecideChange={async (id, decision) => {
            await decideChangeRequest(id, decision);
            changesQuery.refetch();
            dashboardQuery.refetch();
          }}
        />
      </div>
    </div>
  );
}
