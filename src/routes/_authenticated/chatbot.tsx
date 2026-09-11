import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Chatbot } from "@/components/Chatbot";
import { VisualStageCard } from "@/components/VisualStageCard";
import type { ActiveVisual } from "@/types/chat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chatbot")({
  head: () => ({
    meta: [
      { title: "HR Assistant — PeopleLens" },
      {
        name: "description",
        content: "Chat with your HR insights assistant about attrition risk, retention, and performance rankings.",
      },
      { property: "og:title", content: "HR Assistant — PeopleLens" },
      {
        property: "og:description",
        content: "Chat with your HR insights assistant about attrition risk, retention, and performance rankings.",
      },
    ],
  }),
  component: ChatbotPage,
});

function ChatbotPage() {
  const [activeVisual, setActiveVisual] = useState<ActiveVisual | null>(null);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="mb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">HR Assistant</h1>
        <p className="mt-1.5 text-muted-foreground text-sm max-w-xl mx-auto">
          Ask natural questions about your team — attrition risk, retention, and performance rankings. Employee names
          in answers are clickable.
        </p>
      </div>

      <div className="h-[calc(100vh-14rem)] min-h-[550px] flex items-stretch gap-4">
        {/* External visual stage on desktop */}
        {activeVisual && (
          <div className="hidden lg:flex flex-1 min-w-0 h-full rounded-2xl border bg-card/95 shadow-md overflow-hidden flex-col animate-in fade-in duration-300">
            <VisualStageCard visual={activeVisual} onClose={() => setActiveVisual(null)} />
          </div>
        )}

        <div
          className={cn(
            "h-full transition-all duration-300",
            activeVisual ? "w-full lg:w-[460px] xl:w-[490px] shrink-0" : "w-full max-w-4xl lg:max-w-5xl mx-auto",
          )}
        >
          <Chatbot
            activeVisual={activeVisual}
            onActiveVisualChange={setActiveVisual}
            isExternalVisualOpen={Boolean(activeVisual)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-pastel-teal/50 px-3 py-1.5">Try: "who are the top 10 performers this month"</span>
        <span className="rounded-full bg-pastel-rose/60 px-3 py-1.5">Try: "Why was Usman Ali flagged?"</span>
        <span className="rounded-full bg-pastel-amber/60 px-3 py-1.5">Try: "What are today's critical cases?"</span>
        <span className="rounded-full bg-pastel-sky/60 px-3 py-1.5">Try: "Who is at highest risk?"</span>
      </div>
    </main>
  );
}
