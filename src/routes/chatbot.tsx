import { createFileRoute } from "@tanstack/react-router";
import { Chatbot } from "@/components/Chatbot";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "HR Assistant — PeopleLens" },
      { name: "description", content: "Chat with your HR insights assistant about attrition risk and retention." },
      { property: "og:title", content: "HR Assistant — PeopleLens" },
      { property: "og:description", content: "Chat with your HR insights assistant about attrition risk and retention." },
    ],
  }),
  component: ChatbotPage,
});

function ChatbotPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">HR Assistant</h1>
        <p className="text-muted-foreground mt-1">
          Ask natural questions about your team — attrition risk, retention, exit reasons.
        </p>
      </div>
      <div className="h-[calc(100vh-14rem)] min-h-[500px]">
        <Chatbot />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="px-3 py-1.5 rounded-full bg-pastel-mint/40">Try: "Is Usman expected to leave soon?"</span>
        <span className="px-3 py-1.5 rounded-full bg-pastel-peach/50">Try: "Who is at highest risk?"</span>
        <span className="px-3 py-1.5 rounded-full bg-pastel-blue/40">Try: "Why did people leave?"</span>
      </div>
    </main>
  );
}
