import { useState, useRef, useEffect, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { VisualStageCard } from "./VisualStageCard";
import type { ActiveVisual } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatVisualSplitLayoutProps {
  activeVisual: ActiveVisual | null;
  onCloseVisual: () => void;
  children: ReactNode;
  breakpoint?: "md" | "lg";
  defaultSplit?: number;
  minVisualPercent?: number;
  maxVisualPercent?: number;
  storageKey?: string;
  isFloating?: boolean;
  className?: string;
}

export function ChatVisualSplitLayout({
  activeVisual,
  onCloseVisual,
  children,
  breakpoint = "lg",
  defaultSplit = 52,
  minVisualPercent = 30,
  maxVisualPercent = 70,
  storageKey = "peoplelens-chat-visual-split",
  isFloating = false,
  className,
}: ChatVisualSplitLayoutProps) {
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = parseFloat(saved);
          if (Number.isFinite(parsed) && parsed >= minVisualPercent && parsed <= maxVisualPercent) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return defaultSplit;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with localStorage on changes
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        localStorage.setItem(storageKey, splitRatio.toString());
      } catch {
        // ignore
      }
    }
  }, [splitRatio, storageKey]);

  // Window-level event listeners for guaranteed smooth drag tracking even across iframes/SVGs
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(Math.max(rawPercent, minVisualPercent), maxVisualPercent);
      setSplitRatio(clamped);
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging, minVisualPercent, maxVisualPercent]);

  // Handle pointer interactions for butter-smooth resizing
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary button
    e.preventDefault();
    setIsDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(Math.max(rawPercent, minVisualPercent), maxVisualPercent);
    setSplitRatio(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleDoubleClick = () => {
    setSplitRatio(defaultSplit);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSplitRatio((prev) => Math.max(prev - 2, minVisualPercent));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSplitRatio((prev) => Math.min(prev + 2, maxVisualPercent));
    } else if (e.key === "Home" || e.key === "Enter") {
      e.preventDefault();
      setSplitRatio(defaultSplit);
    }
  };

  // If no visual is active, render the chatbox in its default centered or floating container
  if (!activeVisual) {
    if (isFloating) {
      return (
        <div className="w-full h-full rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden pointer-events-auto">
          {children}
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto h-full min-h-0 flex flex-col">
        {children}
      </div>
    );
  }

  const isMd = breakpoint === "md";

  return (
    <div
      ref={containerRef}
      style={
        {
          "--split-visual": `calc(${splitRatio}% - 8px)`,
          "--split-chat": `calc(${100 - splitRatio}% - 8px)`,
        } as React.CSSProperties
      }
      className={cn(
        "relative w-full h-full min-h-0 flex items-stretch gap-0 select-none",
        isDragging ? "cursor-col-resize select-none" : "",
        className
      )}
    >
      {/* ── Left Panel: Visual Stage Card ── */}
      <div
        className={cn(
          "h-full min-w-[320px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden flex-col pointer-events-auto",
          isMd
            ? "hidden md:flex md:w-[var(--split-visual)]"
            : "hidden lg:flex lg:w-[var(--split-visual)]",
          isDragging ? "transition-none pointer-events-none select-none" : "transition-[width] duration-150 ease-out"
        )}
      >
        <VisualStageCard visual={activeVisual} onClose={onCloseVisual} />
      </div>

      {/* ── Middle: Resizable Slider Handle ── */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitRatio)}
        aria-valuemin={minVisualPercent}
        aria-valuemax={maxVisualPercent}
        aria-label="Resize panels"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        title="Drag to resize panels · Double-click to reset"
        className={cn(
          "relative z-30 shrink-0 items-center justify-center cursor-col-resize select-none touch-none group outline-none",
          isMd ? "hidden md:flex" : "hidden lg:flex",
          "w-4 px-0.5 py-4 pointer-events-auto"
        )}
      >
        {/* Subtle vertical line */}
        <div
          className={cn(
            "h-full w-1 rounded-full transition-all duration-150",
            isDragging
              ? "bg-primary shadow-[0_0_12px_rgba(37,99,235,0.6)] w-1.5"
              : "bg-border/80 group-hover:bg-primary/70 group-hover:w-1.5"
          )}
        />

        {/* Central Tactile Grip Pill */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-4.5 items-center justify-center rounded-full border bg-card shadow-md transition-all duration-150",
            isDragging
              ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg ring-4 ring-primary/20"
              : "border-border/80 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary group-hover:scale-105"
          )}
        >
          <GripVertical className="h-3 w-3" />
        </div>

        {/* Live Size Percentage Badge while dragging */}
        {isDragging && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full border border-primary/30 bg-card px-2.5 py-0.5 text-[10px] font-bold text-primary shadow-md whitespace-nowrap pointer-events-none animate-in fade-in-0 duration-150">
            {Math.round(splitRatio)}% · {Math.round(100 - splitRatio)}%
          </div>
        )}
      </div>

      {/* ── Right Panel: Chatbox ── */}
      <div
        className={cn(
          "h-full w-full rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden pointer-events-auto flex flex-col",
          isMd
            ? "md:min-w-[340px] md:w-[var(--split-chat)]"
            : "lg:min-w-[340px] lg:w-[var(--split-chat)]",
          isDragging ? "transition-none pointer-events-none select-none" : "transition-[width] duration-150 ease-out"
        )}
      >
        {children}
      </div>
    </div>
  );
}
