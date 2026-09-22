import { createFileRoute } from "@tanstack/react-router";
import { TenantDataSyncPage } from "@/components/ontology/TenantDataSyncPage";

export const Route = createFileRoute("/_authenticated/data-sync")({
  head: () => ({
    meta: [
      { title: "Tenant Data Sync — PeopleLens" },
      {
        name: "description",
        content: "Upload, map, and synchronize organization datasets into Supabase and knowledge graph.",
      },
      { property: "og:title", content: "Tenant Data Sync — PeopleLens" },
    ],
  }),
  component: TenantDataSyncPage,
});
