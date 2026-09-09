import { createFileRoute } from "@tanstack/react-router";
import { ScenarioPage } from "@/components/scenario/ScenarioPage";

export const Route = createFileRoute("/_authenticated/scenario")({
  head: () => ({
    meta: [
      { title: "Scenario Simulator — PeopleLens" },
      {
        name: "description",
        content: "Model workforce what-if scenarios and get projected impact, risks, and recommendations.",
      },
      { property: "og:title", content: "Scenario Simulator — PeopleLens" },
    ],
  }),
  component: ScenarioPage,
});
