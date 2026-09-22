import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getCriticalOpenCount } from "@/lib/trigger-engine";
import { HRInsightsWorkspace } from "@/components/HRInsightsWorkspace";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "HR Insights — PeopleLens" },
      {
        name: "description",
        content: "Attrition prediction, headcount, and workforce performance insights.",
      },
      { property: "og:title", content: "HR Insights — PeopleLens" },
      {
        property: "og:description",
        content: "Attrition prediction, headcount, and workforce performance insights.",
      },
    ],
  }),
  component: HRInsights,
});

function HRInsights() {
  const [criticalTriggers, setCriticalTriggers] = useState(() => getCriticalOpenCount());

  useEffect(() => {
    function handleUpdate() {
      setCriticalTriggers(getCriticalOpenCount());
    }
    window.addEventListener("trigger-cases-updated", handleUpdate);
    return () => window.removeEventListener("trigger-cases-updated", handleUpdate);
  }, []);
  return <HRInsightsWorkspace criticalTriggers={criticalTriggers} />;
}
