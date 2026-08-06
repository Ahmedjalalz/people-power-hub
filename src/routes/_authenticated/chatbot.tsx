import { createFileRoute } from "@tanstack/react-router";
import { Chatbot } from "@/components/Chatbot";

export const Route = createFileRoute("/_authenticated/chatbot")({
  head: () => ({
    meta: [
      { title: "HR Assistant — PeopleLens" },
      {
        name: "description",
        content: "Chat with your HR insights assistant about attrition risk and retention.",
      },
      { property: "og:title", content: "HR Assistant — PeopleLens" },
      {
        property: "og:description",
        content: "Chat with your HR insights assistant about attrition risk and retention.",
      },
    ],
  }),
  component: ChatbotPage,
});

function ChatbotPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">HR Assistant</h1>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          Ask natural questions about your team — attrition risk, retention, exit reasons. Employee names
          in answers are clickable.
        </p>
      </div>
      <div className="h-[calc(100vh-14rem)] min-h-[500px]">
        <Chatbot />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-pastel-teal/50 px-3 py-1.5">Try: "Is Usman expected to leave soon?"</span>
        <span className="rounded-full bg-pastel-sky/60 px-3 py-1.5">Try: "Who is at highest risk?"</span>
        <span className="rounded-full bg-pastel-lavender/60 px-3 py-1.5">Try: "Why did people leave?"</span>
      </div>
    </main>
  );
}
