import React, { useState } from "react";
import { Copy, Check, ArrowLeft, ArrowRight, Database, ExternalLink, Network, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEdgeFamily, getFamilyLabel, type LiveNodeDetail, type SchemaNode, type SchemaEdge } from "@/services/ontology";
import { cn } from "@/lib/utils";

type Props = {
  mode: "live" | "schema";
  liveDetail?: LiveNodeDetail | null;
  schemaNode?: SchemaNode | null;
  schemaEdges?: SchemaEdge[];
  onSelectNode: (id: string) => void;
  onClose?: () => void;
  history?: string[];
  historyIndex?: number;
  onNavigateHistory?: (direction: "back" | "forward") => void;
};

export function OntologyNodeDetailPanel({
  mode,
  liveDetail,
  schemaNode,
  schemaEdges = [],
  onSelectNode,
  onClose,
  history = [],
  historyIndex = 0,
  onNavigateHistory,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyGraphId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === "schema" && schemaNode) {
    const nodeEdges = schemaEdges.filter((e) => e.source === schemaNode.id || e.target === schemaNode.id);

    return (
      <aside aria-label="Ontology Schema Details" className="flex h-full flex-col border-l border-border bg-card/60 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Ontology Schema Model</span>
              <Badge variant="outline" className="text-[10px]">{schemaNode.module}</Badge>
            </div>
            <h3 className="mt-1 truncate text-lg font-bold text-foreground">{schemaNode.label}</h3>
            <p className="text-xs text-muted-foreground">Entity type identifier: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{schemaNode.id}</code></p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Close panel">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-5">
            {/* Meta summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <span className="text-[11px] font-medium text-muted-foreground">Properties</span>
                <p className="mt-0.5 text-lg font-bold text-foreground">{schemaNode.property_count}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <span className="text-[11px] font-medium text-muted-foreground">Relationships</span>
                <p className="mt-0.5 text-lg font-bold text-foreground">{nodeEdges.length}</p>
              </div>
            </div>

            {/* Relationships list */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">Schema Relationships</h4>
                <span className="text-[11px] text-muted-foreground">{nodeEdges.length} connected</span>
              </div>
              {nodeEdges.length === 0 ? (
                <p className="text-xs text-muted-foreground">No schema relationships defined.</p>
              ) : (
                <div className="space-y-2">
                  {nodeEdges.map((e, idx) => {
                    const isOutbound = e.source === schemaNode.id;
                    const neighborId = isOutbound ? e.target : e.source;
                    const family = getEdgeFamily(e.relation);
                    const familyDotColor =
                      family === "talent" ? "bg-purple-500" : family === "planning" ? "bg-amber-500" : "bg-sky-500";

                    return (
                      <div
                        key={`${e.source}-${e.relation}-${e.target}-${idx}`}
                        className="group flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-2.5 transition-colors hover:border-primary/50 hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("size-2 shrink-0 rounded-full", familyDotColor)} />
                            <span className="truncate text-xs font-semibold text-foreground">{e.relation}</span>
                          </div>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span>{isOutbound ? "Outbound →" : "← Inbound"}</span>
                            <span className="font-medium text-foreground">{neighborId}</span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                          onClick={() => onSelectNode(neighborId)}
                        >
                          Jump <ArrowRight className="ml-1 size-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </aside>
    );
  }

  if (mode === "live" && liveDetail) {
    const propsList = Object.entries(liveDetail.properties || {});
    const canBack = historyIndex > 0;
    const canForward = historyIndex < history.length - 1;

    return (
      <aside aria-label="Knowledge Graph Node Detail" className="flex h-full flex-col border-l border-border bg-card/60 backdrop-blur-md">
        {/* Top bar with traversal history */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Tenant Node</span>
              <Badge variant="secondary" className="text-[10px]">{liveDetail.entity_type}</Badge>
            </div>
            <h3 className="mt-1 truncate text-lg font-bold text-foreground">{liveDetail.label}</h3>

            {/* Graph ID with Copy */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {liveDetail.graph_id}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-muted-foreground hover:text-foreground"
                onClick={() => copyGraphId(liveDetail.graph_id)}
                title="Copy graph id"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onNavigateHistory && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={!canBack}
                  onClick={() => onNavigateHistory("back")}
                  title="Previous node in history"
                >
                  <ArrowLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={!canForward}
                  onClick={() => onNavigateHistory("forward")}
                  title="Next node in history"
                >
                  <ArrowRight className="size-3.5" />
                </Button>
              </>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Close panel">
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Properties */}
            <div>
              <h4 className="mb-2 text-xs font-semibold text-foreground">Node Properties</h4>
              {propsList.length === 0 ? (
                <p className="text-xs text-muted-foreground">No custom properties on this record.</p>
              ) : (
                <div className="divide-y divide-border/50 rounded-lg border border-border/70 bg-background/50">
                  {propsList.map(([key, val]) => (
                    <div key={key} className="flex items-start justify-between gap-3 px-3 py-2 text-xs">
                      <span className="font-medium text-muted-foreground">{key}</span>
                      <span className="max-w-[60%] text-right font-semibold text-foreground break-words">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Provenance Metadata */}
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Database className="size-3.5 text-primary" />
                <h4 className="text-xs font-semibold text-foreground">Data Provenance</h4>
              </div>
              {liveDetail.provenance.length === 0 ? (
                <p className="text-xs text-muted-foreground">No source provenance attached.</p>
              ) : (
                <div className="space-y-2">
                  {liveDetail.provenance.map((prov, i) => (
                    <div key={i} className="rounded-lg border border-border/70 bg-background/50 p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{prov.source_system || "Raw Storage"}</span>
                        <code className="text-[10px] text-muted-foreground">{prov.source_record_key}</code>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">Source object: {prov.source_object || "unspecified"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </aside>
    );
  }

  // Empty state placeholder
  return (
    <aside aria-label="Ontology Inspection" className="flex h-full flex-col items-center justify-center border-l border-border bg-card/40 p-6 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Network className="size-6" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-foreground">Select a Node to Inspect</h3>
      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
        Click any node or connection on the canvas to inspect properties, relations, and provenance.
      </p>
    </aside>
  );
}
