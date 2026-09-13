import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Chatbot } from "@/components/Chatbot";
import { ChatVisualSplitLayout } from "@/components/ChatVisualSplitLayout";
import type { ActiveVisual } from "@/types/chat";

export const Route = createFileRoute("/_authenticated/chatbot")({
  head: () => ({
    meta: [
      { title: "Ask People AI — People Power Hub" },
      {
        name: "description",
        content: "Ask plain-language questions about people, teams, risks, and performance.",
      },
      { property: "og:title", content: "Ask People AI — People Power Hub" },
      {
        property: "og:description",
        content: "Ask plain-language questions about people, teams, risks, and performance.",
      },
    ],
  }),
  component: ChatbotPage,
});

function ChatbotPage() {
  const [activeVisual, setActiveVisual] = useState<ActiveVisual | null>(null);

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden p-3 sm:p-4 lg:p-5">
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
    </main>
  );
}
