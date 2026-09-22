import React, { useMemo, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Building2,
  Users2,
  Target,
  Layers,
  Network,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEdgeFamily, getFamilyLabel, type LiveGraphData, type SchemaGraphData, type SemanticFamily } from "@/services/ontology";
import { cn } from "@/lib/utils";

type Props = {
  mode: "live" | "schema";
  onModeChange: (mode: "live" | "schema") => void;
  tenantId: string;
  schemaData?: SchemaGraphData | null;
  liveData?: LiveGraphData | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onRefreshLive?: () => void;
  isLoading?: boolean;
};

type ViewStyle = "canvas" | "matrix";

export function OntologyGraphCanvas({
  mode,
  onModeChange,
  tenantId,
  schemaData,
  liveData,
  selectedNodeId,
  onSelectNode,
  onRefreshLive,
  isLoading = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // View style: Interactive 2D Canvas vs Structured Matrix
  const [viewStyle, setViewStyle] = useState<ViewStyle>("canvas");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");

  // Pan & Zoom state
  const [zoom, setZoom] = useState({ scale: 0.95, x: 20, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleResetZoom = () => {
    setZoom({ scale: 0.95, x: 20, y: 10 });
  };

  const handleZoom = (factor: number) => {
    setZoom((prev) => ({
      ...prev,
      scale: Math.max(0.4, Math.min(2.5, prev.scale * factor)),
    }));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    handleZoom(factor);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".graph-interactive-node, .graph-interactive-edge")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setZoom((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Fixed Canvas Dimensions
  const W = 1240;
  const H = 760;

  // Node Card dimensions
  const cardW = 210;
  const cardH = 74;

  // Determine Semantic Family
  const getNodeFamily = (moduleOrType: string): SemanticFamily => {
    const s = moduleOrType.toLowerCase();
    if (s.includes("talent") || s.includes("employee") || s.includes("skill") || s.includes("performance")) {
      return "talent";
    }
    if (s.includes("planning") || s.includes("headcount") || s.includes("risk") || s.includes("compensation") || s.includes("attrition")) {
      return "planning";
    }
    return "structure";
  };

  // Colors per domain
  const domainColors = {
    structure: {
      accent: "#0284c7", // Sky blue
      bg: "rgba(2, 132, 199, 0.08)",
      border: "rgba(2, 132, 199, 0.35)",
      text: "#0284c7",
      label: "Organization & Structure",
      icon: Building2,
    },
    talent: {
      accent: "#8b5cf6", // Purple
      bg: "rgba(139, 92, 246, 0.08)",
      border: "rgba(139, 92, 246, 0.35)",
      text: "#8b5cf6",
      label: "Talent & Workforce",
      icon: Users2,
    },
    planning: {
      accent: "#d97706", // Amber
      bg: "rgba(217, 119, 6, 0.08)",
      border: "rgba(217, 119, 6, 0.35)",
      text: "#d97706",
      label: "Planning & Governance",
      icon: Target,
    },
  };

  // Structured Layout calculations
  const { positionedNodes, positionedEdges, connectedNodeIds, domainColumns } = useMemo(() => {
    const nodePosMap = new Map<string, { x: number; y: number }>();
    const connSet = new Set<string>();

    if (mode === "schema" && schemaData) {
      const nodes = schemaData.nodes;

      // Group nodes into 3 distinct architectural columns
      const orgNodes = nodes.filter((n) => getNodeFamily(n.module) === "structure");
      const talentNodes = nodes.filter((n) => getNodeFamily(n.module) === "talent");
      const planNodes = nodes.filter((n) => getNodeFamily(n.module) === "planning");

      const colX = {
        structure: 170,
        talent: 580,
        planning: 990,
      };

      const startY = 160;
      const stepY = 140;

      orgNodes.forEach((n, idx) => {
        nodePosMap.set(n.id, { x: colX.structure, y: startY + idx * (stepY + 20) + 60 });
      });

      talentNodes.forEach((n, idx) => {
        nodePosMap.set(n.id, { x: colX.talent, y: startY + idx * stepY });
      });

      planNodes.forEach((n, idx) => {
        nodePosMap.set(n.id, { x: colX.planning, y: startY + idx * stepY });
      });

      if (selectedNodeId) {
        connSet.add(selectedNodeId);
        schemaData.edges.forEach((e) => {
          if (e.source === selectedNodeId) connSet.add(e.target);
          if (e.target === selectedNodeId) connSet.add(e.source);
        });
      }

      // Edges with smart anchor points connecting the card boundaries
      const edges = schemaData.edges.map((e, idx) => {
        const from = nodePosMap.get(e.source);
        const to = nodePosMap.get(e.target);
        if (!from || !to) return null;

        const isLeftToRight = to.x > from.x;
        const isRightToLeft = to.x < from.x;

        // Card anchor points
        const startX = isLeftToRight ? from.x + cardW / 2 : isRightToLeft ? from.x - cardW / 2 : from.x;
        const startY = from.y;
        const endX = isLeftToRight ? to.x - cardW / 2 : isRightToLeft ? to.x + cardW / 2 : to.x;
        const endY = to.y;

        const dx = endX - startX;
        const dy = endY - startY;

        // Smooth cubic bezier or curved arc
        const curveOffset = ((idx % 3) - 1) * 24;
        const mx = (startX + endX) / 2;
        const my = (startY + endY) / 2 + curveOffset;

        const path = `M ${startX} ${startY} C ${startX + dx * 0.45} ${startY}, ${endX - dx * 0.45} ${endY}, ${endX} ${endY}`;
        const family = getEdgeFamily(e.relation);
        const isConnected = selectedNodeId ? e.source === selectedNodeId || e.target === selectedNodeId : false;

        return {
          id: `edge-${idx}`,
          source: e.source,
          target: e.target,
          relation: e.relation,
          family,
          path,
          midX: mx,
          midY: my,
          isConnected,
        };
      }).filter(Boolean);

      const mappedNodes = nodes.map((n) => {
        const family = getNodeFamily(n.module);
        return {
          id: n.id,
          label: n.label,
          type: n.module,
          family,
          pos: nodePosMap.get(n.id) || { x: 500, y: 300 },
          propertiesCount: n.property_count,
          isCenter: false,
          pending: n.pending_property_count > 0,
        };
      });

      return {
        positionedNodes: mappedNodes,
        positionedEdges: edges,
        connectedNodeIds: connSet,
        domainColumns: [
          { key: "structure", label: "Organization Structure", x: colX.structure, count: orgNodes.length },
          { key: "talent", label: "Talent & Workforce", x: colX.talent, count: talentNodes.length },
          { key: "planning", label: "Planning & Governance", x: colX.planning, count: planNodes.length },
        ],
      };
    }

    if (mode === "live" && liveData) {
      const nodes = liveData.nodes;
      const centerNode = nodes.find((n) => n.center) || nodes.find((n) => n.graph_id === selectedNodeId) || nodes[0];

      // Focal center coordinate
      const cxLive = 600;
      const cyLive = 370;

      if (centerNode) {
        nodePosMap.set(centerNode.graph_id, { x: cxLive, y: cyLive });
      }

      // Categorize other nodes into structured quadrants around the focal node
      const others = nodes.filter((n) => n.graph_id !== centerNode?.graph_id);
      const orgGroup = others.filter((n) => getNodeFamily(n.entity_type) === "structure");
      const talentGroup = others.filter((n) => getNodeFamily(n.entity_type) === "talent");
      const planGroup = others.filter((n) => getNodeFamily(n.entity_type) === "planning");

      // Top-Left: Organization & Hierarchy
      orgGroup.forEach((n, idx) => {
        nodePosMap.set(n.graph_id, {
          x: 200,
          y: 180 + idx * 140,
        });
      });

      // Top-Right: Positions / Level
      planGroup.forEach((n, idx) => {
        nodePosMap.set(n.graph_id, {
          x: 1000,
          y: 180 + idx * 130,
        });
      });

      // Bottom Area: Talent links, peers, skills, reviews
      talentGroup.forEach((n, idx) => {
        const isLeft = idx % 2 === 0;
        const col = isLeft ? 200 : 1000;
        const row = Math.floor(idx / 2);
        nodePosMap.set(n.graph_id, {
          x: col,
          y: 460 + row * 130,
        });
      });

      const activeId = selectedNodeId || centerNode?.graph_id;
      if (activeId) {
        connSet.add(activeId);
        liveData.edges.forEach((e) => {
          if (e.source_graph_id === activeId) connSet.add(e.target_graph_id);
          if (e.target_graph_id === activeId) connSet.add(e.source_graph_id);
        });
      }

      const edges = liveData.edges.map((e, idx) => {
        const from = nodePosMap.get(e.source_graph_id);
        const to = nodePosMap.get(e.target_graph_id);
        if (!from || !to) return null;

        const isLeftToRight = to.x > from.x;
        const isRightToLeft = to.x < from.x;

        const startX = isLeftToRight ? from.x + cardW / 2 : isRightToLeft ? from.x - cardW / 2 : from.x;
        const startY = from.y;
        const endX = isLeftToRight ? to.x - cardW / 2 : isRightToLeft ? to.x + cardW / 2 : to.x;
        const endY = to.y;

        const dx = endX - startX;
        const path = `M ${startX} ${startY} C ${startX + dx * 0.4} ${startY}, ${endX - dx * 0.4} ${endY}, ${endX} ${endY}`;
        const family = getEdgeFamily(e.relation_type);
        const isConnected = activeId ? e.source_graph_id === activeId || e.target_graph_id === activeId : false;

        return {
          id: `live-edge-${idx}`,
          source: e.source_graph_id,
          target: e.target_graph_id,
          relation: e.relation_type,
          family,
          path,
          midX: (startX + endX) / 2,
          midY: (startY + endY) / 2,
          isConnected,
        };
      }).filter(Boolean);

      const mappedNodes = nodes.map((n) => {
        const family = getNodeFamily(n.entity_type);
        return {
          id: n.graph_id,
          label: n.label,
          type: n.entity_type,
          family,
          pos: nodePosMap.get(n.graph_id) || { x: 500, y: 300 },
          propertiesCount: 0,
          isCenter: n.graph_id === centerNode?.graph_id,
          pending: false,
        };
      });

      return {
        positionedNodes: mappedNodes,
        positionedEdges: edges,
        connectedNodeIds: connSet,
        domainColumns: [],
      };
    }

    return { positionedNodes: [], positionedEdges: [], connectedNodeIds: connSet, domainColumns: [] };
  }, [mode, schemaData, liveData, selectedNodeId]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return positionedNodes.filter((n) => {
      const matchSearch = !q || n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
      const matchFamily = selectedFamily === "all" || n.family === selectedFamily;
      return matchSearch && matchFamily;
    });
  }, [positionedNodes, searchQuery, selectedFamily]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/90 p-3 backdrop-blur-md">
        {/* Left: Mode Switcher + View Style (Canvas vs Matrix) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live vs Schema Mode Toggle */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => onModeChange("live")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                mode === "live"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Live Tenant Graph
            </button>
            <button
              type="button"
              onClick={() => onModeChange("schema")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                mode === "schema"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Ontology Schema
            </button>
          </div>

          {/* View Presentation Switcher */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setViewStyle("canvas")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                viewStyle === "canvas"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Interactive Diagram View"
            >
              <Network className="size-3.5" /> Diagram
            </button>
            <button
              type="button"
              onClick={() => setViewStyle("matrix")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                viewStyle === "matrix"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Structured Domain Matrix View"
            >
              <LayoutGrid className="size-3.5" /> Domain Matrix
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter nodes or relations..."
              className="h-8 w-44 pl-8 text-xs sm:w-56"
            />
          </div>
        </div>

        {/* Right: Domain Filter & Zoom controls */}
        <div className="flex items-center gap-2">
          {/* Domain Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFamily("all")}
              className={cn(
                "px-2 py-1 rounded font-medium text-[11px] transition-colors",
                selectedFamily === "all" ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              All Domains
            </button>
            <button
              type="button"
              onClick={() => setSelectedFamily("structure")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] transition-colors",
                selectedFamily === "structure" ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-sky-500" /> Structure
            </button>
            <button
              type="button"
              onClick={() => setSelectedFamily("talent")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] transition-colors",
                selectedFamily === "talent" ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-purple-500" /> Talent
            </button>
            <button
              type="button"
              onClick={() => setSelectedFamily("planning")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] transition-colors",
                selectedFamily === "planning" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-amber-500" /> Planning
            </button>
          </div>

          {mode === "live" && onRefreshLive && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={onRefreshLive}
              disabled={isLoading}
            >
              <RotateCcw className={cn("mr-1.5 size-3", isLoading && "animate-spin")} />
              Sync
            </Button>
          )}

          {viewStyle === "canvas" && (
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => handleZoom(0.85)} title="Zoom Out">
                <ZoomOut className="size-3.5" />
              </Button>
              <span className="w-11 text-center font-mono text-[11px] text-muted-foreground">
                {Math.round(zoom.scale * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => handleZoom(1.18)} title="Zoom In">
                <ZoomIn className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={handleResetZoom} title="Reset (Fit)">
                <Maximize2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Status Strip */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 truncate">
          {mode === "schema" ? (
            <>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                Schema Architecture
              </Badge>
              <span className="font-semibold text-foreground">Three-Tier Domain Blueprint</span>
              <span>·</span>
              <span>{positionedNodes.length} core entities</span>
              <span>·</span>
              <span>{positionedEdges.length} semantic relationships</span>
            </>
          ) : (
            <>
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                Live Tenant
              </Badge>
              <span className="font-semibold text-foreground">Tenant: {tenantId}</span>
              <span>·</span>
              <span>{liveData?.node_count_total?.toLocaleString() ?? 0} total records</span>
              <span>·</span>
              <span>showing {positionedNodes.length} connected entities</span>
            </>
          )}
        </div>
        <span className="hidden text-[11px] md:inline">
          {mode === "schema"
            ? "Click an entity card to inspect its properties and connected edges"
            : "Click any node to load its live neighbourhood and traverse relationships"}
        </span>
      </div>

      {/* VIEW STYLE: INTERACTIVE CANVAS */}
      {viewStyle === "canvas" ? (
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={cn(
            "relative flex-1 cursor-grab overflow-hidden select-none",
            isDragging && "cursor-grabbing",
          )}
          style={{
            background: "radial-gradient(circle at 50% 50%, var(--border, #e2e8f0) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="size-full min-h-[580px]"
            role="img"
            aria-label="High-Legibility Knowledge Graph"
          >
            <defs>
              {/* High-visibility Arrowheads for each semantic family */}
              <marker id="arrow-structure-hd" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#0284c7" />
              </marker>
              <marker id="arrow-talent-hd" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
              </marker>
              <marker id="arrow-planning-hd" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#d97706" />
              </marker>

              {/* Card drop shadows */}
              <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" />
              </filter>
              <filter id="card-glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f59e0b" floodOpacity="0.65" />
              </filter>
              <filter id="card-glow-connected" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#10b981" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Viewport container for pan & zoom */}
            <g transform={`translate(${zoom.x} ${zoom.y}) scale(${zoom.scale})`}>
              {/* Architecture Domain Columns Headers (Schema Mode) */}
              {mode === "schema" && (
                <g className="domain-headers-layer pointer-events-none">
                  {domainColumns.map((col) => {
                    const cfg = domainColors[col.key as SemanticFamily];
                    return (
                      <g key={col.key} transform={`translate(${col.x - cardW / 2}, 70)`}>
                        {/* Column Header Card */}
                        <rect
                          width={cardW}
                          height="44"
                          rx="8"
                          fill="var(--card)"
                          stroke={cfg.accent}
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          opacity="0.85"
                        />
                        <rect width="4" height="44" rx="2" fill={cfg.accent} />
                        <text
                          x="16"
                          y="20"
                          fill={cfg.accent}
                          fontSize="9"
                          fontWeight="800"
                          letterSpacing="0.08em"
                        >
                          {col.label.toUpperCase()}
                        </text>
                        <text x="16" y="34" fill="var(--muted-foreground)" fontSize="10">
                          {col.count} entity models
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Edge Connecting Lines Layer */}
              <g className="edges-layer">
                {positionedEdges.map((edge) => {
                  if (!edge) return null;

                  const isVisible = visibleNodeIds.size === 0 || (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
                  const isDimmed = !isVisible;
                  const isConnected = edge.isConnected;

                  const colorCfg = domainColors[edge.family];

                  return (
                    <g
                      key={edge.id}
                      className={cn(
                        "graph-interactive-edge transition-opacity duration-200 cursor-pointer",
                        isDimmed && "opacity-10",
                        isConnected && "opacity-100",
                      )}
                    >
                      {/* Base path */}
                      <path
                        d={edge.path}
                        fill="none"
                        stroke={colorCfg.accent}
                        strokeWidth={isConnected ? 3 : 1.8}
                        strokeOpacity={isConnected ? 1 : 0.65}
                        markerEnd={`url(#arrow-${edge.family}-hd)`}
                      />

                      {/* Edge Label Pill at Midpoint */}
                      <g
                        transform={`translate(${edge.midX}, ${edge.midY})`}
                        className="select-none"
                      >
                        <rect
                          x="-48"
                          y="-10"
                          width="96"
                          height="20"
                          rx="6"
                          fill="var(--card)"
                          stroke={colorCfg.accent}
                          strokeWidth={isConnected ? 2 : 1}
                          opacity="0.96"
                        />
                        <text
                          y="4"
                          textAnchor="middle"
                          fill={colorCfg.accent}
                          fontSize="9"
                          fontWeight="700"
                          letterSpacing="0.02em"
                        >
                          {edge.relation}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* Node Cards Layer */}
              <g className="nodes-layer">
                {positionedNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isConnected = connectedNodeIds.has(node.id);
                  const isDimmed = !visibleNodeIds.has(node.id);
                  const cfg = domainColors[node.family];

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.pos.x - cardW / 2}, ${node.pos.y - cardH / 2})`}
                      onClick={() => onSelectNode(node.id)}
                      className={cn(
                        "graph-interactive-node cursor-pointer select-none transition-all duration-200",
                        isDimmed && "opacity-20",
                      )}
                    >
                      {/* Outer Card Background */}
                      <rect
                        width={cardW}
                        height={cardH}
                        rx="10"
                        fill="var(--card)"
                        stroke={
                          isSelected
                            ? "#f59e0b"
                            : isConnected
                              ? "#10b981"
                              : cfg.border
                        }
                        strokeWidth={isSelected ? 3 : isConnected ? 2.5 : 1.5}
                        filter={
                          isSelected
                            ? "url(#card-glow-selected)"
                            : isConnected
                              ? "url(#card-glow-connected)"
                              : "url(#card-shadow)"
                        }
                        className="transition-colors"
                      />

                      {/* Left colored domain stripe */}
                      <rect
                        x="0"
                        y="0"
                        width="5"
                        height={cardH}
                        rx="3"
                        fill={cfg.accent}
                      />

                      {/* Domain Pill Badge (Top Left) */}
                      <rect
                        x="14"
                        y="10"
                        width={node.type.length * 7 + 16}
                        height="16"
                        rx="4"
                        fill={cfg.bg}
                        stroke={cfg.border}
                        strokeWidth="1"
                      />
                      <text
                        x="22"
                        y="22"
                        fill={cfg.text}
                        fontSize="8.5"
                        fontWeight="800"
                        letterSpacing="0.05em"
                      >
                        {node.type.toUpperCase()}
                      </text>

                      {/* Focal Node Badge (if center in live mode) */}
                      {node.isCenter && (
                        <g transform={`translate(${cardW - 80}, 10)`}>
                          <rect width="66" height="16" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1" />
                          <text x="33" y="12" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="800">
                            FOCAL NODE
                          </text>
                        </g>
                      )}

                      {/* Pending Warning Icon (if applicable) */}
                      {node.pending && (
                        <g transform={`translate(${cardW - 24}, 12)`}>
                          <circle r="6" fill="#f59e0b" />
                          <text y="3" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">!</text>
                        </g>
                      )}

                      {/* Main Node Label */}
                      <text
                        x="14"
                        y="46"
                        fill="var(--foreground)"
                        fontSize="12.5"
                        fontWeight="700"
                        letterSpacing="-0.01em"
                      >
                        {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                      </text>

                      {/* Sub-label / properties or status */}
                      <text
                        x="14"
                        y="62"
                        fill="var(--muted-foreground)"
                        fontSize="9.5"
                      >
                        {mode === "schema"
                          ? `${node.propertiesCount} properties · schema model`
                          : `ID: ${node.id.length > 24 ? `${node.id.slice(0, 22)}…` : node.id}`}
                      </text>

                      <title>{`${node.type}: ${node.label} (${node.id})`}</title>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* Floating High-Legibility Canvas Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border bg-card/95 p-3.5 shadow-lg backdrop-blur-md">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Domain Architecture</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-sky-500" />
                <span className="font-semibold text-foreground">Organization & Structure</span>
                <span className="text-[10px] text-muted-foreground ml-auto">Dept, Position</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-purple-500" />
                <span className="font-semibold text-foreground">Talent & Workforce</span>
                <span className="text-[10px] text-muted-foreground ml-auto">Employee, Skill, Perf</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-foreground">Planning & Governance</span>
                <span className="text-[10px] text-muted-foreground ml-auto">Plan, Risk, Band</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW STYLE: STRUCTURED DOMAIN MATRIX (Ultra-legible directory view) */
        <ScrollArea className="flex-1 p-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(["structure", "talent", "planning"] as const).map((family) => {
              const cfg = domainColors[family];
              const nodesInDomain = filteredNodes.filter((n) => n.family === family);

              return (
                <div key={family} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col">
                  {/* Domain Header */}
                  <div className="flex items-center gap-2.5 border-b border-border/80 pb-3 mb-3">
                    <div className="grid size-8 place-items-center rounded-lg" style={{ background: cfg.bg, color: cfg.accent }}>
                      <cfg.icon className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{cfg.label}</h4>
                      <span className="text-[11px] text-muted-foreground">{nodesInDomain.length} entities</span>
                    </div>
                  </div>

                  {/* Cards inside domain */}
                  <div className="space-y-3 flex-1">
                    {nodesInDomain.map((n) => {
                      const isSelected = selectedNodeId === n.id;
                      return (
                        <div
                          key={n.id}
                          onClick={() => onSelectNode(n.id)}
                          className={cn(
                            "cursor-pointer rounded-lg border p-3 transition-all",
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 shadow-sm"
                              : "border-border/70 bg-background/50 hover:border-primary/50 hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Badge variant="outline" className="text-[9px] uppercase font-bold" style={{ borderColor: cfg.border, color: cfg.text }}>
                                {n.type}
                              </Badge>
                              <h5 className="mt-1 font-bold text-xs text-foreground">{n.label}</h5>
                            </div>
                            <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
                              <ArrowRight className="size-3" />
                            </Button>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">ID: {n.id}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
