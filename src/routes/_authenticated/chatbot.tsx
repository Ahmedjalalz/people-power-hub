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
    <div className="h-full flex flex-col p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 flex items-stretch gap-4">
        {/* External visual stage on desktop */}
        {activeVisual && (
          <div className="hidden lg:flex flex-1 min-w-0 h-full rounded-2xl border bg-card/95 shadow-md overflow-hidden flex-col animate-in fade-in duration-300">
            <VisualStageCard visual={activeVisual} onClose={() => setActiveVisual(null)} />
          </div>
        )}

        <div
          className={cn(
            "h-full min-h-0 transition-all duration-300 flex flex-col",
            activeVisual ? "w-full lg:w-[500px] xl:w-[540px] shrink-0" : "w-full max-w-4xl lg:max-w-5xl mx-auto",
          )}
        >
          <Chatbot
            autoFocus={true}
            activeVisual={activeVisual}
            onActiveVisualChange={setActiveVisual}
            isExternalVisualOpen={Boolean(activeVisual)}
          />
        </div>
      </div>
    </div>
  );
}
