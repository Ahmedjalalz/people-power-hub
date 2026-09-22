import { createFileRoute } from "@tanstack/react-router";
import { OntologyStudioPage } from "@/components/ontology/OntologyStudioPage";

export const Route = createFileRoute("/_authenticated/ontologies")({
  head: () => ({
    meta: [
      { title: "Ontologies Studio — PeopleLens" },
      {
        name: "description",
        content: "Explore tenant knowledge graphs, entity models, semantic source mappings, and ontology governance.",
      },
      { property: "og:title", content: "Ontologies Studio — PeopleLens" },
    ],
  }),
  component: () => (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <OntologyStudioPage />
    </main>
  ),
});
