import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarContext } from "@/components/AppSidebar";

const titles: Record<string, { title: string; description: string }> = {
  "/": { title: "HR Insights", description: "Workforce signals, priorities, and next steps" },
  "/employees": { title: "People", description: "Find employees and understand their context" },
  "/scenario": { title: "Plan a change", description: "Explore likely workforce impact before acting" },
  "/triggers": { title: "Action centre", description: "Review cases that need a decision" },
  "/chatbot": { title: "Ask People AI", description: "Explore workforce questions in plain language" },
  "/ontologies": { title: "Ontologies", description: "Knowledge graph explorer, entity models & governance" },
  "/data-sync": { title: "Tenant Data Sync", description: "Ingest, map & synchronize tenant datasets to Supabase and knowledge graph" },
};

export function Header() {
  const { toggle } = useSidebarContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const page = pathname.startsWith("/employee/") ? { title: "Employee profile", description: "A complete view of this person" } : titles[pathname] || titles["/"];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="outline" size="icon" onClick={toggle} className="md:hidden" aria-label="Open navigation"><Menu /></Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground sm:text-base">{page.title}</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{page.description}</p>
        </div>
        {pathname !== "/chatbot" && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/chatbot"><MessageSquareText /><span className="hidden sm:inline">Ask People AI</span></Link>
          </Button>
        )}
      </div>
    </header>
  );
}