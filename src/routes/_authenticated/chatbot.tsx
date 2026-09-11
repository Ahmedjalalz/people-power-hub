import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Chatbot } from "@/components/Chatbot";
import { ChatVisualSplitLayout } from "@/components/ChatVisualSplitLayout";
import type { ActiveVisual } from "@/types/chat";

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
      <div className="flex-1 min-h-0 flex items-stretch">
        <ChatVisualSplitLayout
          activeVisual={activeVisual}
          onCloseVisual={() => setActiveVisual(null)}
          breakpoint="lg"
          defaultSplit={54}
          storageKey="peoplelens-page-split-ratio"
        >
          <Chatbot
            autoFocus={true}
            activeVisual={activeVisual}
            onActiveVisualChange={setActiveVisual}
            isExternalVisualOpen={Boolean(activeVisual)}
          />
        </ChatVisualSplitLayout>
      </div>
    </div>
  );
}
