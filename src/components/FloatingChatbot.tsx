import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Chatbot } from "./Chatbot";
import { cn } from "@/lib/utils";

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
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
            onClick={() => setOpen(false)} 
          />
          <div className="fixed bottom-24 left-6 right-6 z-50 h-[80vh] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border bg-card/95 backdrop-blur overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
            <Chatbot autoFocus />
          </div>
        </>
      )}
    </>
  );
}

