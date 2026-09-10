import { createFileRoute } from "@tanstack/react-router";
import { TriggersPage } from "@/components/triggers/TriggersPage";

export const Route = createFileRoute("/_authenticated/triggers")({
  head: () => ({
    meta: [
      { title: "Decision Triggers — PeopleLens" },
      {
        name: "description",
        content: "Automated workforce risk alerts, rule triggers, and case decision-support monitoring.",
      },
      { property: "og:title", content: "Decision Triggers — PeopleLens" },
    ],
  }),
  component: TriggersPage,
});
