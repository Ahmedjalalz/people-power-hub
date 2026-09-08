import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, Activity } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActionCenterTab } from "@/components/action-center/ActionCenterTab";
import { ActivityTab } from "@/components/activity/ActivityTab";

export const Route = createFileRoute("/_authenticated/task-center")({
  validateSearch: (
    search: Record<string, unknown>
  ): { tab?: "action-center" | "activity" } => ({
    tab: (search.tab as "action-center" | "activity") || undefined,
  }),
  head: () => ({
    meta: [
      { title: "HR Task Center — PeopleLens" },
      {
        name: "description",
        content: "HR action workflows and comprehensive activity audit log.",
      },
      { property: "og:title", content: "HR Task Center — PeopleLens" },
      {
        property: "og:description",
        content: "HR action workflows and comprehensive activity audit log.",
      },
    ],
  }),
  component: HRTaskCenterPage,
});

function HRTaskCenterPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const selectedTab = search.tab || "action-center";

  const handleTabChange = (nextTab: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        tab: nextTab as "action-center" | "activity",
      }),
      replace: true,
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Tabs
        value={selectedTab}
        onValueChange={handleTabChange}
        className="w-full space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <TabsList className="h-10 bg-muted/70 p-1">
            <TabsTrigger
              value="action-center"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
            >
              <CheckSquare className="h-4 w-4" />
              Action Center
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
            >
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="action-center"
          className="m-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <ActionCenterTab
            onNavigateToActivity={() => handleTabChange("activity")}
          />
        </TabsContent>

        <TabsContent
          value="activity"
          className="m-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
