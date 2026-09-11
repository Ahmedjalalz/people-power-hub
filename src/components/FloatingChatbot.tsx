import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Chatbot } from "./Chatbot";
import { ChatVisualSplitLayout } from "./ChatVisualSplitLayout";
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
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg grid place-items-center transition-all duration-200 cursor-pointer",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95 hover:shadow-xl",
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
              "fixed bottom-24 z-50 h-[80vh] max-h-[calc(100vh-8rem)] pointer-events-none transition-all duration-300",
              activeVisual
                ? "left-4 right-4 md:left-6 md:right-6"
                : "left-4 right-4 md:left-auto md:right-6 md:w-[70%] max-w-4xl",
            )}
          >
            <ChatVisualSplitLayout
              activeVisual={activeVisual}
              onCloseVisual={() => setActiveVisual(null)}
              breakpoint="md"
              defaultSplit={52}
              isFloating={true}
              storageKey="peoplelens-floating-split-ratio"
            >
              <Chatbot
                autoFocus
                compact
                onClose={handleClose}
                activeVisual={activeVisual}
                onActiveVisualChange={setActiveVisual}
                isExternalVisualOpen={Boolean(activeVisual)}
              />
            </ChatVisualSplitLayout>
          </div>
        </>
      )}
    </>
  );
}

