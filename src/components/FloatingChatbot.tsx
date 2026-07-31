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
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border bg-card overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <Chatbot autoFocus />
        </div>
      )}
    </>
  );
}

