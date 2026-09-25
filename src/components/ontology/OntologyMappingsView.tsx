import React, { useState, useMemo } from "react";
import { Search, FileText, Database, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DatasetSummary, DatasetDetail } from "@/services/ontology";
import { cn } from "@/lib/utils";

type Props = {
  datasets: DatasetSummary[];
  selectedDetail: DatasetDetail | null;
  onSelectDataset: (filename: string) => void;
  isLoadingDetail?: boolean;
  isLoadingDatasets?: boolean;
};

export function OntologyMappingsView({
  datasets,
  selectedDetail,
  onSelectDataset,
  isLoadingDetail = false,
  isLoadingDatasets = false,
}: Props) {
  const [datasetSearch, setDatasetSearch] = useState("");
  const [columnSearch, setColumnSearch] = useState("");

  const filteredDatasets = useMemo(() => {
    const q = datasetSearch.toLowerCase().trim();
    return datasets.filter((d) => !q || d.source_file.toLowerCase().includes(q));
  }, [datasets, datasetSearch]);

  const filteredColumns = useMemo(() => {
    if (!selectedDetail?.columns) return [];
    const q = columnSearch.toLowerCase().trim();
    return selectedDetail.columns.filter(
      (col) =>
        !q ||
        col.source_column.toLowerCase().includes(q) ||
        col.disposition.toLowerCase().includes(q) ||
        (col.ontology_path && col.ontology_path.toLowerCase().includes(q)),
    );
  }, [selectedDetail, columnSearch]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Left Column: Datasets List */}
      <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-bold text-foreground">Source Datasets</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Inventory of classified HR datasets</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={datasetSearch}
              onChange={(e) => setDatasetSearch(e.target.value)}
              placeholder="Search datasets..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <ScrollArea className="h-[520px] p-2">
          {isLoadingDatasets ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-16 w-full rounded-lg bg-muted/60 p-3 animate-pulse" />
              ))}
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No registered datasets found.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredDatasets.map((d) => {
                const isSelected = selectedDetail?.source_file === d.source_file;
                return (
                  <button
                    key={d.source_file}
                    type="button"
                    onClick={() => onSelectDataset(d.source_file)}
                    className={cn(
                      "flex w-full flex-col rounded-lg p-3 text-left transition-all border",
                      isSelected
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-transparent bg-background/50 hover:border-border hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className={cn("size-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="truncate font-semibold text-xs text-foreground">{d.source_file}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span>{d.column_count} columns · {d.ontology_path_count} mapped</span>
                      {d.attention_count > 0 ? (
                        <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                          {d.attention_count} attention
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                          verified
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Column: Dataset Column Mappings Table */}
      <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
        {isLoadingDetail ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-48 rounded bg-muted animate-pulse" />
              <div className="h-6 w-20 rounded bg-muted animate-pulse" />
            </div>
            <div className="space-y-2 pt-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-10 w-full rounded bg-muted/60 animate-pulse" />
              ))}
            </div>
          </div>
        ) : selectedDetail ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{selectedDetail.source_file}</h3>
                  <Badge variant={selectedDetail.attention_columns.length ? "destructive" : "secondary"}>
                    {selectedDetail.attention_columns.length ? `${selectedDetail.attention_columns.length} attention items` : "Classified"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedDetail.row_count.toLocaleString()} source records · {selectedDetail.column_count} schema attributes
                </p>
              </div>

              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  placeholder="Filter columns..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                    <th className="py-2.5 px-4 font-semibold">Source Column</th>
                    <th className="py-2.5 px-4 font-semibold">Disposition</th>
                    <th className="py-2.5 px-4 font-semibold">Canonical Ontology Path</th>
                    <th className="py-2.5 px-4 font-semibold">Transformation / Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredColumns.map((col, idx) => {
                    const isAttention = selectedDetail.attention_columns.includes(col.source_column);
                    return (
                      <tr key={`${col.source_column}-${idx}`} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            {isAttention ? (
                              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                            )}
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                              {col.source_column}
                            </code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] font-mono capitalize">
                            {col.disposition.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {col.ontology_path ? (
                            <span className="font-semibold text-primary">{col.ontology_path}</span>
                          ) : (
                            <span className="text-muted-foreground italic">— None (Raw only) —</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {col.transform || col.reason || "Direct pass-through"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex h-[420px] flex-col items-center justify-center p-6 text-center">
            <Database className="size-10 text-muted-foreground" />
            <h4 className="mt-3 font-semibold text-foreground">Select a Dataset</h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Choose any registered source dataset on the left to inspect classified columns and mappings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
