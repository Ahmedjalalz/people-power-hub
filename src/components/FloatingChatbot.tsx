import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Chatbot } from "./Chatbot";
import { VisualStageCard } from "./VisualStageCard";
import type { ActiveVisual } from "@/types/chat";
import { cn } from "@/lib/utils";

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [activeVisual, setActiveVisual] = useState<ActiveVisual | null>(null);

  const handleClose = () => {
    setOpen(false);
    setActiveVisual(null);
  };

  return (
    <>
      <button
        onClick={() => {
          if (open) handleClose();
          else setOpen(true);
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg grid place-items-center transition-all",
          "bg-primary text-primary-foreground hover:scale-105",
        )}
        aria-label="Open HR assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleClose}
          />

          <div
            className={cn(
              "fixed bottom-24 z-50 h-[80vh] max-h-[calc(100vh-8rem)] flex items-stretch gap-4 pointer-events-none transition-all duration-300",
              activeVisual
                ? "left-4 right-4 md:left-6 md:right-6"
                : "left-4 right-4 md:left-auto md:right-6 md:w-[70%]",
            )}
          >
            {/* Visual Stage outside the box in front of the backdrop blur (Desktop screens) */}
            {activeVisual && (
              <div className="hidden md:flex flex-1 min-w-0 h-full rounded-2xl border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden flex-col pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-300">
                <VisualStageCard visual={activeVisual} onClose={() => setActiveVisual(null)} />
              </div>
            )}

            {/* Chat Box (shrinks further to ~36% when visual stage is open) */}
            <div
              className={cn(
                "h-full rounded-2xl border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden pointer-events-auto transition-all duration-300",
                activeVisual ? "w-full md:w-[38%] lg:w-[35%] shrink-0" : "w-full",
              )}
            >
              <Chatbot
                autoFocus
                compact
                onClose={handleClose}
                activeVisual={activeVisual}
                onActiveVisualChange={setActiveVisual}
                isExternalVisualOpen={Boolean(activeVisual)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

