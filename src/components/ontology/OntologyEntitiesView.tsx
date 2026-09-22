import React, { useMemo, useState } from "react";
import { Search, Layers, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OntologyEntity } from "@/services/ontology";
import { cn } from "@/lib/utils";

type Props = {
  entities: OntologyEntity[];
  onSelectEntity?: (entityName: string) => void;
};

export function OntologyEntitiesView({ entities, onSelectEntity }: Props) {
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  const modules = useMemo(() => {
    return Array.from(new Set(entities.map((e) => e.module))).sort();
  }, [entities]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entities.filter((e) => {
      const matchModule = selectedModule === "all" || e.module === selectedModule;
      const matchText =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.properties.some((p) => p.name.toLowerCase().includes(q));
      return matchModule && matchText;
    });
  }, [entities, search, selectedModule]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entity, property, or description..."
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-muted-foreground">
          Showing <strong className="text-foreground">{filtered.length}</strong> of {entities.length} entities
        </span>
      </div>

      {/* Grid of Entity Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entity) => (
          <div
            key={entity.name}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-foreground">{entity.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-[10px] font-semibold">
                    {entity.module}
                  </Badge>
                </div>
                {onSelectEntity && (
                  <button
                    type="button"
                    onClick={() => onSelectEntity(entity.name)}
                    className="grid size-8 place-items-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title="View in Graph"
                  >
                    <ArrowUpRight className="size-4" />
                  </button>
                )}
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                {entity.description}
              </p>

              {/* Meta Chips */}
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {entity.properties.length} properties
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {entity.relationship_count} relationships
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {entity.mapped_source_column_count} mapped columns
                </span>
                {entity.pending_property_count > 0 && (
                  <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3" />
                    {entity.pending_property_count} pending
                  </span>
                )}
              </div>

              {/* Property breakdown */}
              <div className="mt-4">
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Defined Properties
                </h4>
                <ScrollArea className="h-44 rounded-lg border border-border/60 bg-background/50 p-2.5">
                  <div className="space-y-1.5">
                    {entity.properties.map((p) => {
                      const isConfirmed = p.semantic_status === "confirmed";
                      return (
                        <div
                          key={p.name}
                          className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isConfirmed ? (
                              <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="size-3 shrink-0 text-amber-500" />
                            )}
                            <span className="truncate font-medium text-foreground">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground">
                            <span className="font-mono">{p.data_type}</span>
                            {p.unit && <span>({p.unit})</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
