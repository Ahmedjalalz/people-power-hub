import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Sparkles,
  Briefcase,
  Award,
  ShieldAlert,
  Sliders,
  Coins,
  Compass,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getEdgeFamily,
  type LiveGraphData,
  type SchemaGraphData,
  type SemanticFamily,
} from "@/services/ontology";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

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
type LabelVisibility = "focus" | "always";
type NeighborhoodScope = "1-hop" | "all";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // View style: Interactive Graph Canvas vs Structured Directory Matrix
  const [viewStyle, setViewStyle] = useState<ViewStyle>("canvas");

  // Label visibility: "focus" (shows on hover/selection) vs "always" (all labels visible)
  const [labelMode, setLabelMode] = useState<LabelVisibility>("focus");

  // Neighborhood scope for live data: "1-hop" (clean immediate neighbors) vs "all" (all loaded)
  const [scope, setScope] = useState<NeighborhoodScope>("1-hop");

  // Interactive Hover state (ONLY for SVG visual highlighting; does NOT alter DOM layout or panel heights)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Search filter & domain filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");

  // Pan & Zoom state
  const [zoom, setZoom] = useState({ scale: 0.85, x: 40, y: 30 });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; zoomX: number; zoomY: number } | null>(null);

  // Safe zoom centered at container center
  const handleZoom = useCallback((factor: number) => {
    setZoom((prev) => {
      const newScale = Math.max(0.25, Math.min(2.8, prev.scale * factor));
      const container = containerRef.current;
      const cw = container ? container.clientWidth / 2 : 500;
      const ch = container ? container.clientHeight / 2 : 350;
      const scaleRatio = newScale / prev.scale;
      const newX = cw - (cw - prev.x) * scaleRatio;
      const newY = ch - (ch - prev.y) * scaleRatio;
      return { scale: newScale, x: newX, y: newY };
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom({ scale: 0.85, x: 40, y: 30 });
  }, []);

  // NATIVE NON-PASSIVE WHEEL LISTENER (Completely blocks webpage zoom / scroll)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prev) => {
        const newScale = Math.max(0.25, Math.min(2.8, prev.scale * factor));
        const scaleRatio = newScale / prev.scale;
        const newX = mouseX - (mouseX - prev.x) * scaleRatio;
        const newY = mouseY - (mouseY - prev.y) * scaleRatio;

        // If user is zooming while dragging, sync drag anchor coordinates to prevent jumping
        if (dragStartRef.current) {
          dragStartRef.current.zoomX = newX;
          dragStartRef.current.zoomY = newY;
          dragStartRef.current.x = e.clientX;
          dragStartRef.current.y = e.clientY;
        }

        return { scale: newScale, x: newX, y: newY };
      });
    };

    container.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheelNative);
    };
  }, []);

  // Pan & Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".graph-interactive-node, .graph-interactive-edge, button")) return;
    if (e.button !== 0) return; // Only drag on primary click
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      zoomX: zoomRef.current.x,
      zoomY: zoomRef.current.y,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!isDragging || !start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const targetX = start.zoomX + dx;
    const targetY = start.zoomY + dy;

    setZoom((prev) => {
      // Guard against pointer release occurring before queued update runs
      if (!dragStartRef.current) return prev;
      return {
        ...prev,
        x: targetX,
        y: targetY,
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  // Determine Semantic Family
  const getNodeFamily = (moduleOrType: string): SemanticFamily => {
    const s = String(moduleOrType || "").toLowerCase();
    if (s.includes("talent") || s.includes("employee") || s.includes("skill") || s.includes("performance") || s.includes("learning") || s.includes("assignment") || s.includes("engagement") || s.includes("career")) {
      return "talent";
    }
    if (s.includes("planning") || s.includes("headcount") || s.includes("risk") || s.includes("compensation") || s.includes("attrition") || s.includes("decision") || s.includes("scenario") || s.includes("driver") || s.includes("budget")) {
      return "planning";
    }
    return "structure";
  };

  // Theme-adaptive colors per domain (bright luminous in dark mode, crisp in light mode)
  const domainColors: Record<SemanticFamily, {
    accent: string;
    fillLight: string;
    border: string;
    text: string;
    label: string;
    icon: React.ElementType;
  }> = useMemo(() => ({
    structure: {
      accent: isDark ? "#38bdf8" : "#0284c7", // Luminous cyan-sky
      fillLight: isDark ? "rgba(56, 189, 248, 0.16)" : "#e0f2fe",
      border: isDark ? "#38bdf8" : "#0284c7",
      text: isDark ? "#38bdf8" : "#0284c7",
      label: "Organization & Structure",
      icon: Building2,
    },
    talent: {
      accent: isDark ? "#c084fc" : "#8b5cf6", // Luminous soft lavender/violet
      fillLight: isDark ? "rgba(192, 132, 252, 0.16)" : "#ede9fe",
      border: isDark ? "#c084fc" : "#8b5cf6",
      text: isDark ? "#c084fc" : "#8b5cf6",
      label: "Talent & Workforce",
      icon: Users2,
    },
    planning: {
      accent: isDark ? "#fbbf24" : "#d97706", // Luminous golden amber
      fillLight: isDark ? "rgba(251, 191, 36, 0.16)" : "#fef3c7",
      border: isDark ? "#fbbf24" : "#d97706",
      text: isDark ? "#fbbf24" : "#d97706",
      label: "Planning & Governance",
      icon: Target,
    },
  }), [isDark]);

  // Helper to pick node vector icon
  const getNodeIconComponent = (typeOrId: string) => {
    const s = String(typeOrId || "").toLowerCase();
    if (s.includes("employee") || s.includes("emp_") || s.includes("person") || s.includes("worker") || s.includes("assignment")) return User;
    if (s.includes("dept") || s.includes("department") || s.includes("company") || s.includes("businessunit") || s.includes("location")) return Building2;
    if (s.includes("pos") || s.includes("position") || s.includes("job")) return Briefcase;
    if (s.includes("skill") || s.includes("competency")) return Sparkles;
    if (s.includes("perf") || s.includes("performance") || s.includes("review")) return Award;
    if (s.includes("risk") || s.includes("attrition") || s.includes("exception")) return ShieldAlert;
    if (s.includes("plan") || s.includes("headcount") || s.includes("scenario") || s.includes("driver")) return Sliders;
    if (s.includes("band") || s.includes("compensation") || s.includes("cost") || s.includes("budget")) return Coins;
    return Compass;
  };

  // =========================================================================
  // DYNAMIC ZERO-STACKING LAYOUT ENGINE
  // =========================================================================
  const {
    positionedNodes,
    positionedEdges,
    activeFocusId,
    activeNeighbors,
    activeRelations,
    canvasDimensions,
    columnHeaders,
    rawNodeCount,
  } = useMemo(() => {
    const nodePosMap = new Map<string, { x: number; y: number; radius: number }>();
    const neighbors = new Set<string>();

    // -----------------------------------------------------------------------
    // SCHEMA GRAPH LAYOUT: 4 Architectural Columns
    // -----------------------------------------------------------------------
    if (mode === "schema" && schemaData && schemaData.nodes.length > 0) {
      const allNodes = schemaData.nodes;
      const effectiveActiveId = selectedNodeId || (allNodes[0]?.id || "Employee");

      // Group into 4 architectural pillars
      const cols: Record<"structure" | "talent" | "performance" | "planning", typeof allNodes> = {
        structure: [],
        talent: [],
        performance: [],
        planning: [],
      };

      allNodes.forEach((n) => {
        const idLower = n.id.toLowerCase();
        const modLower = (n.module || "").toLowerCase();
        if (idLower.includes("skill") || idLower.includes("perf") || idLower.includes("course") || idLower.includes("learning")) {
          cols.performance.push(n);
        } else if (modLower.includes("talent") || idLower.includes("employee") || idLower.includes("position") || idLower.includes("job") || idLower.includes("career")) {
          cols.talent.push(n);
        } else if (modLower.includes("planning") || idLower.includes("plan") || idLower.includes("risk") || idLower.includes("band") || idLower.includes("compensation") || idLower.includes("case") || idLower.includes("rule") || idLower.includes("scenario") || idLower.includes("driver")) {
          cols.planning.push(n);
        } else {
          cols.structure.push(n);
        }
      });

      const colXPositions = {
        structure: 200,
        talent: 620,
        performance: 1040,
        planning: 1460,
      };

      const columnDefs = [
        { key: "structure" as const, label: "Organization & Structure", x: colXPositions.structure, count: cols.structure.length },
        { key: "talent" as const, label: "Workforce & Positions", x: colXPositions.talent, count: cols.talent.length },
        { key: "performance" as const, label: "Skills & Performance", x: colXPositions.performance, count: cols.performance.length },
        { key: "planning" as const, label: "Planning & Governance", x: colXPositions.planning, count: cols.planning.length },
      ];

      let maxRowCount = 0;
      (Object.keys(cols) as (keyof typeof cols)[]).forEach((colKey) => {
        const list = cols[colKey];
        maxRowCount = Math.max(maxRowCount, list.length);
        const colBaseX = colXPositions[colKey];

        list.forEach((n, idx) => {
          if (list.length > 10) {
            const subCol = idx % 2 === 0 ? -70 : 70;
            const row = Math.floor(idx / 2);
            nodePosMap.set(n.id, {
              x: colBaseX + subCol,
              y: 130 + row * 95,
              radius: 26,
            });
          } else {
            nodePosMap.set(n.id, {
              x: colBaseX,
              y: 130 + idx * 88,
              radius: 26,
            });
          }
        });
      });

      const totalH = Math.max(900, 150 + Math.ceil(maxRowCount / 2) * 98 + 120);
      const totalW = 1680;

      if (effectiveActiveId) {
        neighbors.add(effectiveActiveId);
        schemaData.edges.forEach((e) => {
          if (e.source === effectiveActiveId) neighbors.add(e.target);
          if (e.target === effectiveActiveId) neighbors.add(e.source);
        });
      }

      const edges = schemaData.edges.map((e, idx) => {
        const from = nodePosMap.get(e.source);
        const to = nodePosMap.get(e.target);
        if (!from || !to) return null;

        const isSelf = e.source === e.target;
        const family = getEdgeFamily(e.relation);
        const isConnected = effectiveActiveId ? e.source === effectiveActiveId || e.target === effectiveActiveId : false;

        if (isSelf) {
          const r = from.radius;
          const sx = from.x - r * 0.7;
          const sy = from.y - r * 0.7;
          const ex = from.x + r * 0.7;
          const ey = from.y - r * 0.7;
          const path = `M ${sx} ${sy} C ${sx - 35} ${sy - 55}, ${ex + 35} ${ey - 55}, ${ex} ${ey}`;
          return {
            id: `schema-edge-${idx}`,
            source: e.source,
            target: e.target,
            relation: e.relation,
            family,
            path,
            midX: from.x,
            midY: from.y - r - 40,
            isConnected,
          };
        }

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;

        const startX = from.x + ux * from.radius;
        const startY = from.y + uy * from.radius;
        const endX = to.x - ux * (to.radius + 8);
        const endY = to.y - uy * (to.radius + 8);

        const normalX = -uy;
        const normalY = ux;
        const curveOffset = ((idx % 3) - 1) * 16;
        const midX = (startX + endX) / 2 + normalX * curveOffset;
        const midY = (startY + endY) / 2 + normalY * curveOffset;
        const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

        return {
          id: `schema-edge-${idx}`,
          source: e.source,
          target: e.target,
          relation: e.relation,
          family,
          path,
          midX,
          midY,
          isConnected,
        };
      }).filter(Boolean);

      const mappedNodes = allNodes.map((n) => {
        const family = getNodeFamily(n.module || n.id);
        const pos = nodePosMap.get(n.id) || { x: 500, y: 300, radius: 26 };
        return {
          id: n.id,
          label: n.label || n.id,
          type: n.module || "Entity",
          family,
          pos,
          propertiesCount: n.property_count,
          isCenter: false,
          pending: n.pending_property_count > 0,
        };
      });

      const activeRels = schemaData.edges
        .filter((e) => e.source === effectiveActiveId || e.target === effectiveActiveId)
        .map((e) => ({
          direction: e.source === effectiveActiveId ? ("outbound" as const) : ("inbound" as const),
          source: e.source,
          target: e.target,
          otherNode: e.source === effectiveActiveId ? e.target : e.source,
          otherId: e.source === effectiveActiveId ? e.target : e.source,
          relation: e.relation,
          family: getEdgeFamily(e.relation),
        }));

      return {
        positionedNodes: mappedNodes,
        positionedEdges: edges,
        activeFocusId: effectiveActiveId,
        activeNeighbors: neighbors,
        activeRelations: activeRels,
        canvasDimensions: { w: totalW, h: totalH },
        columnHeaders: columnDefs,
        rawNodeCount: allNodes.length,
      };
    }

    // -----------------------------------------------------------------------
    // LIVE TENANT GRAPH LAYOUT: Robust Radial & Neighborhood Traversal
    // -----------------------------------------------------------------------
    if (mode === "live" && liveData && liveData.nodes && liveData.nodes.length > 0) {
      const allLiveNodes = liveData.nodes;

      // Identify focal node: prioritize selectedNodeId, then explicit center node, then an Employee node, then first node
      const centerNode =
        (selectedNodeId && allLiveNodes.find((n) => n.graph_id === selectedNodeId)) ||
        allLiveNodes.find((n) => n.center) ||
        allLiveNodes.find((n) => n.entity_type.toLowerCase().includes("employee")) ||
        allLiveNodes[0];

      const effectiveActiveId = centerNode?.graph_id || selectedNodeId || null;
      const cxLive = 720;
      const cyLive = 440;

      // Determine which nodes to display:
      let displayedNodes: typeof allLiveNodes = [];

      if (scope === "1-hop") {
        // Collect direct 1-hop connected neighbors
        const connectedIds = new Set<string>();
        if (effectiveActiveId) connectedIds.add(effectiveActiveId);

        liveData.edges.forEach((e) => {
          if (e.source_graph_id === effectiveActiveId) connectedIds.add(e.target_graph_id);
          if (e.target_graph_id === effectiveActiveId) connectedIds.add(e.source_graph_id);
        });

        if (connectedIds.size > 1) {
          // Has real neighborhood! Display that exact neighborhood
          displayedNodes = allLiveNodes.filter((n) => connectedIds.has(n.graph_id));
        } else {
          // If the initial sample node has no edges, NEVER show 0 nodes!
          // Display the first 24 nodes cleanly grouped so the canvas is active & clickable
          displayedNodes = allLiveNodes.slice(0, 24);
        }
      } else {
        // Display up to 50 nodes for performance and clarity
        displayedNodes = allLiveNodes.slice(0, 50);
      }

      const displayedIds = new Set(displayedNodes.map((n) => n.graph_id));

      // Place focal/center node
      if (centerNode) {
        nodePosMap.set(centerNode.graph_id, { x: cxLive, y: cyLive, radius: 34 });
      }

      // Categorize other displayed nodes into 4 quadrants
      const nonCenterNodes = displayedNodes.filter((n) => n.graph_id !== centerNode?.graph_id);
      const quadNodes: Record<"structure" | "roles" | "reports" | "records", typeof nonCenterNodes> = {
        structure: [],
        roles: [],
        reports: [],
        records: [],
      };

      nonCenterNodes.forEach((n) => {
        const typeLower = n.entity_type.toLowerCase();
        if (typeLower.includes("dept") || typeLower.includes("company") || typeLower.includes("location") || typeLower.includes("cost")) {
          quadNodes.structure.push(n);
        } else if (typeLower.includes("pos") || typeLower.includes("job") || typeLower.includes("band") || typeLower.includes("comp")) {
          quadNodes.roles.push(n);
        } else if (typeLower.includes("employee") || typeLower.includes("assignment") || typeLower.includes("worker")) {
          quadNodes.reports.push(n);
        } else {
          quadNodes.records.push(n);
        }
      });

      const quadrantAngles = {
        structure: { start: Math.PI * 1.15, span: Math.PI * 0.7 },
        roles: { start: -Math.PI * 0.2, span: Math.PI * 0.4 },
        reports: { start: Math.PI * 0.2, span: Math.PI * 0.6 },
        records: { start: Math.PI * 0.85, span: Math.PI * 0.4 },
      };

      (Object.keys(quadNodes) as (keyof typeof quadNodes)[]).forEach((qKey) => {
        const list = quadNodes[qKey];
        const config = quadrantAngles[qKey];
        if (list.length === 0) return;

        list.forEach((n, idx) => {
          const ringIndex = Math.floor(idx / 4);
          const ringRadius = 210 + ringIndex * 140;
          const posInRing = idx % 4;
          const itemsInThisRing = Math.min(4, list.length - ringIndex * 4);
          const stepAngle = itemsInThisRing > 1 ? config.span / (itemsInThisRing - 1) : 0;
          const angle = itemsInThisRing > 1 ? config.start + posInRing * stepAngle : config.start + config.span / 2;

          nodePosMap.set(n.graph_id, {
            x: cxLive + Math.cos(angle) * ringRadius,
            y: cyLive + Math.sin(angle) * ringRadius,
            radius: 25,
          });
        });
      });

      if (effectiveActiveId) {
        neighbors.add(effectiveActiveId);
        liveData.edges.forEach((e) => {
          if (e.source_graph_id === effectiveActiveId) neighbors.add(e.target_graph_id);
          if (e.target_graph_id === effectiveActiveId) neighbors.add(e.source_graph_id);
        });
      }

      // Filter and position edges
      const edges = liveData.edges
        .filter((e) => displayedIds.has(e.source_graph_id) && displayedIds.has(e.target_graph_id))
        .map((e, idx) => {
          const from = nodePosMap.get(e.source_graph_id);
          const to = nodePosMap.get(e.target_graph_id);
          if (!from || !to) return null;

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.hypot(dx, dy) || 1;
          const ux = dx / dist;
          const uy = dy / dist;

          const startX = from.x + ux * from.radius;
          const startY = from.y + uy * from.radius;
          const endX = to.x - ux * (to.radius + 8);
          const endY = to.y - uy * (to.radius + 8);

          const normalX = -uy;
          const normalY = ux;
          const curveOffset = ((idx % 3) - 1) * 14;
          const midX = (startX + endX) / 2 + normalX * curveOffset;
          const midY = (startY + endY) / 2 + normalY * curveOffset;
          const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
          const family = getEdgeFamily(e.relation_type);
          const isConnected = effectiveActiveId
            ? e.source_graph_id === effectiveActiveId || e.target_graph_id === effectiveActiveId
            : false;

          return {
            id: `live-edge-${idx}`,
            source: e.source_graph_id,
            target: e.target_graph_id,
            relation: e.relation_type,
            family,
            path,
            midX,
            midY,
            isConnected,
          };
        })
        .filter(Boolean);

      const mappedNodes = displayedNodes.map((n) => {
        const family = getNodeFamily(n.entity_type);
        const pos = nodePosMap.get(n.graph_id) || { x: cxLive, y: cyLive, radius: 25 };
        return {
          id: n.graph_id,
          label: n.label || n.graph_id,
          type: n.entity_type,
          family,
          pos,
          propertiesCount: 0,
          isCenter: n.graph_id === centerNode?.graph_id,
          pending: false,
        };
      });

      const activeRels = liveData.edges
        .filter((e) => e.source_graph_id === effectiveActiveId || e.target_graph_id === effectiveActiveId)
        .map((e) => {
          const isOut = e.source_graph_id === effectiveActiveId;
          const otherId = isOut ? e.target_graph_id : e.source_graph_id;
          const otherNode = allLiveNodes.find((n) => n.graph_id === otherId);
          return {
            direction: isOut ? ("outbound" as const) : ("inbound" as const),
            source: e.source_graph_id,
            target: e.target_graph_id,
            otherNode: otherNode?.label || otherId,
            otherId,
            relation: e.relation_type,
            family: getEdgeFamily(e.relation_type),
          };
        });

      return {
        positionedNodes: mappedNodes,
        positionedEdges: edges,
        activeFocusId: effectiveActiveId,
        activeNeighbors: neighbors,
        activeRelations: activeRels,
        canvasDimensions: { w: 1480, h: 900 },
        columnHeaders: [],
        rawNodeCount: allLiveNodes.length,
      };
    }

    return {
      positionedNodes: [],
      positionedEdges: [],
      activeFocusId: null,
      activeNeighbors: neighbors,
      activeRelations: [],
      canvasDimensions: { w: 1200, h: 800 },
      columnHeaders: [],
      rawNodeCount: 0,
    };
  }, [mode, schemaData, liveData, selectedNodeId, scope]);

  // Fit View / Center Calculation
  const handleFitView = useCallback(() => {
    if (positionedNodes.length === 0) {
      handleResetZoom();
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    positionedNodes.forEach((n) => {
      minX = Math.min(minX, n.pos.x - 70);
      maxX = Math.max(maxX, n.pos.x + 70);
      minY = Math.min(minY, n.pos.y - 40);
      maxY = Math.max(maxY, n.pos.y + 60);
    });

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = (containerWidth - 80) / graphWidth;
    const scaleY = (containerHeight - 80) / graphHeight;
    const fitScale = Math.max(0.3, Math.min(1.2, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom({
      scale: fitScale,
      x: containerWidth / 2 - centerX * fitScale,
      y: containerHeight / 2 - centerY * fitScale,
    });
  }, [positionedNodes, handleResetZoom]);

  // Filter nodes for search query
  const filteredNodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return positionedNodes.filter((n) => {
      const matchSearch = !q || n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
      const matchFamily = selectedFamily === "all" || n.family === selectedFamily;
      return matchSearch && matchFamily;
    });
  }, [positionedNodes, searchQuery, selectedFamily]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Active node entity metadata for the relationship bar
  const activeNodeEntity = useMemo(() => {
    if (!activeFocusId) return null;
    return positionedNodes.find((n) => n.id === activeFocusId) || null;
  }, [activeFocusId, positionedNodes]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* 1. PRIMARY WORKSPACE HEADER (STRICT FIXED HEIGHT: h-11, ZERO WRAP, ZERO HORIZONTAL SCROLLBAR) */}
      <div className="flex h-11 min-h-[44px] max-h-[44px] flex-shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3">
        {/* Left: Mode Switcher & View Style (No wrapping, whitespace-nowrap) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live vs Schema Segmented Control */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onModeChange("live")}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-all shrink-0",
                mode === "live"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="size-3.5 shrink-0" />
              <span>Live Tenant</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange("schema")}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-all shrink-0",
                mode === "schema"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Layers className="size-3.5 shrink-0" />
              <span>Ontology Schema</span>
            </button>
          </div>

          {/* Presentation Style: Graph Diagram vs Directory Matrix */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewStyle("canvas")}
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-all shrink-0",
                viewStyle === "canvas"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Interactive Graph Diagram"
            >
              <Compass className="size-3.5 shrink-0" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewStyle("matrix")}
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-all shrink-0",
                viewStyle === "matrix"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Structured Domain Directory"
            >
              <LayoutGrid className="size-3.5 shrink-0" />
              <span>Directory</span>
            </button>
          </div>
        </div>

        {/* Right: Quick actions (Sync, Label visibility) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {viewStyle === "canvas" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-medium whitespace-nowrap shrink-0"
              onClick={() => setLabelMode((prev) => (prev === "focus" ? "always" : "focus"))}
              title={labelMode === "focus" ? "Edge labels shown on hover/selection" : "Always showing all labels"}
            >
              {labelMode === "focus" ? (
                <>
                  <Eye className="mr-1.5 size-3 text-primary" />
                  <span>Labels: Focus</span>
                </>
              ) : (
                <>
                  <EyeOff className="mr-1.5 size-3 text-muted-foreground" />
                  <span>Labels: All</span>
                </>
              )}
            </Button>
          )}

          {mode === "live" && onRefreshLive && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-medium whitespace-nowrap shrink-0"
              onClick={onRefreshLive}
              disabled={isLoading}
            >
              <RotateCcw className={cn("mr-1.5 size-3", isLoading && "animate-spin")} />
              <span>Sync</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. SUBHEADER STATUS & FILTER STRIP (STRICT FIXED HEIGHT: h-10, ZERO WRAP, BREATHING ROOM) */}
      <div className="flex h-10 min-h-[40px] max-h-[40px] flex-shrink-0 items-center justify-between border-b border-border bg-muted/25 px-3 text-xs text-muted-foreground overflow-hidden">
        {/* Left: Live status / Count badge */}
        <div className="flex items-center gap-2 truncate shrink-0">
          {mode === "schema" ? (
            <>
              <Badge variant="outline" className="text-[9.5px] uppercase font-bold text-primary border-primary/30 py-0 shrink-0">
                Schema Architecture
              </Badge>
              <span className="font-semibold text-foreground whitespace-nowrap">
                {positionedNodes.length} entity types · {positionedEdges.length} relations
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Badge variant="outline" className="text-[9.5px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 py-0 shrink-0">
                {tenantId}
              </Badge>
              <span className="font-semibold text-foreground whitespace-nowrap">
                Showing {positionedNodes.length} nodes
              </span>
              <span className="hidden lg:inline text-muted-foreground whitespace-nowrap">
                ({rawNodeCount} available in tenant)
              </span>
            </>
          )}
        </div>

        {/* Right: Search + Scope (Live) / Domain filter (Schema) */}
        <div className="flex items-center gap-2 shrink-0">
          {mode === "live" && viewStyle === "canvas" && (
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setScope("1-hop")}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-all shrink-0",
                  scope === "1-hop"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Focused 1-hop neighborhood"
              >
                1-Hop
              </button>
              <button
                type="button"
                onClick={() => setScope("all")}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-all shrink-0",
                  scope === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="All loaded tenant nodes"
              >
                All ({Math.min(50, rawNodeCount)})
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter nodes..."
              className="h-7 w-28 pl-7 text-xs sm:w-40"
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: INTERACTIVE CANVAS OR DIRECTORY */}
      {viewStyle === "canvas" ? (
        <div className="relative flex flex-1 min-h-0 w-full flex-col overflow-hidden">
          {/* Main SVG Pan/Zoom Area */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn(
              "relative flex-1 min-h-0 w-full cursor-grab overflow-hidden select-none",
              isDragging && "cursor-grabbing",
            )}
            style={{
              background: isDark
                ? "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--border) 70%, transparent) 1.2px, transparent 1.2px), oklch(0.12 0.016 250)"
                : "radial-gradient(circle at 50% 50%, var(--border, #e2e8f0) 1px, transparent 1px), var(--background)",
              backgroundSize: "28px 28px",
            }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${canvasDimensions.w} ${canvasDimensions.h}`}
              className="size-full min-h-[440px]"
              role="img"
              aria-label="High-Legibility Knowledge Graph"
            >
              <defs>
                {/* Arrow markers */}
                <marker id="arrow-structure-node" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={domainColors.structure.accent} />
                </marker>
                <marker id="arrow-talent-node" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={domainColors.talent.accent} />
                </marker>
                <marker id="arrow-planning-node" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={domainColors.planning.accent} />
                </marker>

                {/* Drop Shadows & Glow Filters */}
                <filter id="node-shadow" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor={isDark ? "#000000" : "#64748b"} floodOpacity={isDark ? 0.7 : 0.15} />
                </filter>
                <filter id="node-glow-active" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={isDark ? "#60a5fa" : "#3b82f6"} floodOpacity={isDark ? 0.9 : 0.8} />
                </filter>
                <filter id="node-glow-focal" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#10b981" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* Viewport container for pan & zoom */}
              <g transform={`translate(${zoom.x} ${zoom.y}) scale(${zoom.scale})`}>
                {/* Schema Column Headers */}
                {mode === "schema" && columnHeaders.length > 0 && (
                  <g className="schema-headers pointer-events-none">
                    {columnHeaders.map((col) => {
                      const cfg = domainColors[col.key === "performance" ? "talent" : col.key];
                      return (
                        <g key={col.key} transform={`translate(${col.x}, 65)`}>
                          <rect
                            x="-160"
                            y="-18"
                            width="320"
                            height="36"
                            rx="8"
                            fill={isDark ? "oklch(0.18 0.024 250)" : "var(--card)"}
                            stroke={cfg.accent}
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            opacity="0.9"
                          />
                          <text
                            y="4"
                            textAnchor="middle"
                            fill={cfg.accent}
                            fontSize="11"
                            fontWeight="800"
                            letterSpacing="0.06em"
                          >
                            {col.label.toUpperCase()}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Edges Layer */}
                <g className="edges-layer">
                  {positionedEdges.map((edge) => {
                    if (!edge) return null;

                    const isDimmed =
                      (hoveredNodeId && edge.source !== hoveredNodeId && edge.target !== hoveredNodeId) ||
                      (selectedNodeId && !hoveredNodeId && !edge.isConnected) ||
                      (visibleNodeIds.size > 0 && (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)));

                    const isHighlighted =
                      (hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) ||
                      (hoveredEdgeId === edge.id) ||
                      (selectedNodeId && !hoveredNodeId && edge.isConnected);

                    const showLabel = labelMode === "always" || isHighlighted;
                    const colorCfg = domainColors[edge.family];

                    return (
                      <g
                        key={edge.id}
                        className={cn(
                          "graph-interactive-edge transition-opacity duration-150 cursor-pointer",
                          isDimmed ? (isDark ? "opacity-30" : "opacity-15") : "opacity-100",
                        )}
                        onMouseEnter={() => setHoveredEdgeId(edge.id)}
                        onMouseLeave={() => setHoveredEdgeId(null)}
                      >
                        {/* Invisible thick path for easy mouse targeting */}
                        <path d={edge.path} fill="none" stroke="transparent" strokeWidth="20" />

                        {/* Visible Line */}
                        <path
                          d={edge.path}
                          fill="none"
                          stroke={colorCfg.accent}
                          strokeWidth={isHighlighted ? 3.4 : (isDark ? 2 : 1.6)}
                          strokeOpacity={isHighlighted ? 1 : (isDark ? 0.82 : 0.65)}
                          markerEnd={`url(#arrow-${edge.family}-node)`}
                          className="transition-all duration-150"
                        />

                        {/* Edge Label Pill */}
                        {showLabel && (
                          <g
                            transform={`translate(${edge.midX}, ${edge.midY})`}
                            className="edge-pill select-none pointer-events-none"
                          >
                            <rect
                              x={-(edge.relation.length * 4.2 + 14)}
                              y="-10"
                              width={edge.relation.length * 8.4 + 28}
                              height="20"
                              rx="10"
                              fill={isDark ? "oklch(0.19 0.025 250)" : "var(--card)"}
                              stroke={isHighlighted ? colorCfg.accent : isDark ? "oklch(0.32 0.02 250)" : "var(--border)"}
                              strokeWidth={isHighlighted ? 2 : 1}
                              className="shadow-sm"
                            />
                            <text
                              y="3.5"
                              textAnchor="middle"
                              fill={isHighlighted ? colorCfg.accent : (isDark ? "#ffffff" : "var(--foreground)")}
                              fontSize="9"
                              fontWeight={isHighlighted ? "800" : "600"}
                              letterSpacing="0.04em"
                            >
                              {edge.relation}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Nodes Layer */}
                <g className="nodes-layer">
                  {positionedNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const isHovered = hoveredNodeId === node.id;
                    const isFocal = node.isCenter;
                    const isNeighbor = activeNeighbors.has(node.id);
                    const isActive = isSelected || isHovered;

                    const isDimmed =
                      (hoveredNodeId && !isHovered && !positionedEdges.some((e) => e && ((e.source === hoveredNodeId && e.target === node.id) || (e.target === hoveredNodeId && e.source === node.id)))) ||
                      (selectedNodeId && !hoveredNodeId && !isActive && !isNeighbor) ||
                      (visibleNodeIds.size > 0 && !visibleNodeIds.has(node.id));

                    const cfg = domainColors[node.family];
                    const IconComp = getNodeIconComponent(node.id || node.type);
                    const r = node.pos.radius;

                    const boxW = Math.max(90, Math.min(180, node.label.length * 7.5 + 24));

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.pos.x}, ${node.pos.y})`}
                        onClick={() => onSelectNode(node.id)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className={cn(
                          "graph-interactive-node cursor-pointer select-none transition-opacity duration-150",
                          isDimmed ? (isDark ? "opacity-35" : "opacity-20") : "opacity-100",
                        )}
                      >
                        {/* Outer Glow Halo for Focal / Active Nodes */}
                        {(isActive || isFocal) && (
                          <circle
                            r={r + 7}
                            fill="none"
                            stroke={isFocal ? "#10b981" : cfg.accent}
                            strokeWidth="2.5"
                            strokeDasharray="4 3"
                            className="animate-spin-slow"
                            opacity="0.9"
                          />
                        )}

                        {/* Neighbor highlight ring */}
                        {isNeighbor && !isActive && !isFocal && (
                          <circle
                            r={r + 5}
                            fill="none"
                            stroke={cfg.accent}
                            strokeWidth="1.8"
                            opacity="0.6"
                          />
                        )}

                        {/* Node Center Circle */}
                        <circle
                          r={r}
                          fill={isDark ? "oklch(0.18 0.024 250)" : "var(--card)"}
                          stroke={isFocal ? "#10b981" : isActive ? (isDark ? "#60a5fa" : "#3b82f6") : cfg.border}
                          strokeWidth={isActive ? 3.5 : isFocal ? 3 : 2.2}
                          filter={isFocal ? "url(#node-glow-focal)" : isActive ? "url(#node-glow-active)" : "url(#node-shadow)"}
                        />

                        {/* Subtle color disc tint inside circle */}
                        <circle
                          r={r - 4}
                          fill={cfg.accent}
                          fillOpacity={isDark ? 0.22 : 0.16}
                          stroke={cfg.accent}
                          strokeWidth="1"
                          strokeOpacity={isDark ? 0.5 : 0.3}
                        />

                        {/* Vector Node Icon */}
                        <foreignObject
                          x={-12}
                          y={-12}
                          width="24"
                          height="24"
                          className="pointer-events-none"
                        >
                          <div className="flex size-full items-center justify-center">
                            <IconComp
                              className="size-4"
                              style={{ color: isFocal ? "#10b981" : cfg.accent }}
                            />
                          </div>
                        </foreignObject>

                        {/* Focal Node Tag */}
                        {isFocal && (
                          <g transform={`translate(0, ${-r - 12})`}>
                            <rect x="-36" y="-8" width="72" height="16" rx="4" fill="#10b981" />
                            <text y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
                              ROOT FOCAL
                            </text>
                          </g>
                        )}

                        {/* High-Contrast Capsule Under Node (Contains Name + Entity Type) */}
                        <g transform={`translate(0, ${r + 14})`}>
                          <rect
                            x={-boxW / 2}
                            y="-9"
                            width={boxW}
                            height="30"
                            rx="6"
                            fill={isDark ? "oklch(0.19 0.025 250)" : "var(--card)"}
                            stroke={isActive ? cfg.accent : isDark ? "oklch(0.32 0.02 250)" : "var(--border)"}
                            strokeWidth={isActive ? 2 : 1}
                            className="shadow-sm"
                          />

                          {/* Line 1: Primary Label */}
                          <text
                            y="4"
                            textAnchor="middle"
                            fill={isDark ? "#ffffff" : "var(--foreground)"}
                            fontSize="10.5"
                            fontWeight={isActive ? "800" : "700"}
                          >
                            {node.label.length > 20 ? `${node.label.slice(0, 18)}…` : node.label}
                          </text>

                          {/* Line 2: Entity Type Badge */}
                          <text
                            y="16"
                            textAnchor="middle"
                            fill={cfg.accent}
                            fontSize="8"
                            fontWeight="800"
                            letterSpacing="0.06em"
                          >
                            {node.type.toUpperCase()}
                          </text>
                        </g>

                        <title>{`${node.type}: ${node.label} (${node.id})`}</title>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>

            {/* FLOATING ZOOM HUD (Bottom-Right, Professional Figma-like Controls) */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-lg backdrop-blur-md">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => handleZoom(0.85)} title="Zoom Out">
                <ZoomOut className="size-3.5" />
              </Button>
              <span className="w-10 text-center font-mono text-[11px] font-semibold text-muted-foreground">
                {Math.round(zoom.scale * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => handleZoom(1.18)} title="Zoom In">
                <ZoomIn className="size-3.5" />
              </Button>
              <div className="h-4 w-px bg-border mx-0.5" />
              <Button variant="ghost" size="icon" className="size-7" onClick={handleFitView} title="Fit to View">
                <Maximize2 className="size-3.5" />
              </Button>
            </div>

            {/* Edge Hover Tooltip */}
            {hoveredEdgeId && (() => {
              const edge = positionedEdges.find((e) => e?.id === hoveredEdgeId);
              if (!edge) return null;
              const srcNode = positionedNodes.find((n) => n.id === edge.source);
              const tgtNode = positionedNodes.find((n) => n.id === edge.target);
              const cfg = domainColors[edge.family];

              return (
                <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-1.5 shadow-xl backdrop-blur-md animate-in fade-in">
                  <span className="size-2 rounded-full" style={{ background: cfg.accent }} />
                  <span className="font-bold text-xs text-foreground">{srcNode?.label || edge.source}</span>
                  <span className="font-mono text-[11px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                    {edge.relation}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="font-bold text-xs text-foreground">{tgtNode?.label || edge.target}</span>
                </div>
              );
            })()}

            {/* Floating Legend */}
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-border bg-card/95 p-2.5 shadow-md backdrop-blur-md">
              <p className="mb-1 text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">Domain Families</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: domainColors.structure.accent }} />
                  <span className="font-semibold text-foreground text-[10.5px]">Organization & Structure</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: domainColors.talent.accent }} />
                  <span className="font-semibold text-foreground text-[10.5px]">Talent & Workforce</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: domainColors.planning.accent }} />
                  <span className="font-semibold text-foreground text-[10.5px]">Planning & Governance</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. DEDICATED RELATIONSHIP NAVIGATOR (STRICT FIXED HEIGHT: h-20, NEVER JUMPS) */}
          <div className="h-20 min-h-[80px] max-h-[80px] flex-shrink-0 border-t border-border bg-card/95 p-2 backdrop-blur-md overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1">
              <div className="flex items-center gap-2 truncate">
                <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">
                  {activeNodeEntity ? activeNodeEntity.type : "Node"}
                </Badge>
                <span className="text-xs font-bold text-foreground truncate">
                  {activeNodeEntity ? activeNodeEntity.label : "Select a node to inspect relationships"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({activeRelations.length} connection{activeRelations.length === 1 ? "" : "s"})
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Click any relation pill to traverse to that node
              </span>
            </div>

            {/* Relationship Chips List with clean horizontal scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
              {activeRelations.length === 0 ? (
                <span className="text-[11px] text-muted-foreground italic py-0.5">
                  Click any node on the canvas to inspect its relationships.
                </span>
              ) : (
                activeRelations.map((rel, idx) => {
                  const cfg = domainColors[rel.family];
                  const isOutbound = rel.direction === "outbound";
                  const neighborNode = positionedNodes.find((n) => n.id === rel.otherNode || n.id === rel.otherId);
                  const neighborLabel = neighborNode?.label || rel.otherNode;
                  const neighborId = neighborNode?.id || rel.otherId;

                  return (
                    <button
                      key={`${rel.source}-${rel.relation}-${rel.target}-${idx}`}
                      type="button"
                      onClick={() => onSelectNode(neighborId)}
                      className="group flex items-center gap-1.5 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-xs transition-all hover:border-primary/60 hover:bg-muted/60 shrink-0"
                    >
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: cfg.accent }} />
                      <span className="text-[9.5px] font-mono font-bold" style={{ color: cfg.accent }}>
                        {isOutbound ? `→ ${rel.relation}` : `${rel.relation} →`}
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[130px]">
                        {neighborLabel}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DIRECTORY MATRIX VIEW */
        <ScrollArea className="flex-1 min-h-0 p-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(["structure", "talent", "planning"] as const).map((family) => {
              const cfg = domainColors[family];
              const nodesInDomain = filteredNodes.filter((n) => n.family === family);

              return (
                <div key={family} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2.5 border-b border-border/80 pb-3 mb-3">
                    <div className="grid size-8 place-items-center rounded-lg" style={{ background: cfg.fillLight, color: cfg.accent }}>
                      <cfg.icon className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{cfg.label}</h4>
                      <span className="text-[11px] text-muted-foreground">{nodesInDomain.length} node entities</span>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    {nodesInDomain.map((n) => {
                      const isSelected = selectedNodeId === n.id;
                      const IconComp = getNodeIconComponent(n.id);

                      return (
                        <div
                          key={n.id}
                          onClick={() => onSelectNode(n.id)}
                          className={cn(
                            "flex items-center justify-between gap-3 cursor-pointer rounded-lg border p-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/70 bg-background/50 hover:border-primary/50 hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card">
                              <IconComp className="size-3.5" style={{ color: cfg.accent }} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-foreground truncate">{n.label}</h5>
                              <p className="text-[10px] text-muted-foreground truncate">{n.type} · ID: {n.id}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground">
                            <ArrowRight className="size-3" />
                          </Button>
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
