import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, FlaskConical, LogOut, MessageSquare, Moon, ShieldAlert, Sun, Users, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { getCurrentUser, logout as clearLocalSession } from "@/lib/auth";
import { getCriticalOpenCount } from "@/lib/trigger-engine";
import { fetchDecisionCases } from "@/services/decision-cases";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SidebarContextType = { isOpen: boolean; setIsOpen: (open: boolean) => void; toggle: () => void; close: () => void };
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle: () => setIsOpen((value) => !value), close: () => setIsOpen(false) }}>{children}</SidebarContext.Provider>;
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebarContext must be used within a SidebarProvider");
  return context;
}

const navigation = [
  { to: "/" as const, label: "HR Insights", description: "Workforce signals and priorities", icon: BarChart3 },
  { to: "/employees" as const, label: "People", description: "Employees and teams", icon: Users },
  { to: "/scenario" as const, label: "Plan a change", description: "Test workforce scenarios", icon: FlaskConical },
  { to: "/triggers" as const, label: "Action centre", description: "Cases requiring review", icon: ShieldAlert },
  { to: "/chatbot" as const, label: "Ask People AI", description: "Explore in plain language", icon: MessageSquare },
];

export function AppSidebar() {
  const { isOpen, setIsOpen, close } = useSidebarContext();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [localCriticalCount, setLocalCriticalCount] = useState(() => getCriticalOpenCount());

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: getCurrentUser });
  const { data: decisionCasesData } = useQuery({
    queryKey: ["decision-cases"],
    queryFn: ({ signal }) => fetchDecisionCases({ active_only: false }, signal),
    staleTime: 60_000,
  });

  useEffect(() => {
    const update = () => setLocalCriticalCount(getCriticalOpenCount());
    window.addEventListener("trigger-cases-updated", update);
    return () => window.removeEventListener("trigger-cases-updated", update);
  }, []);

  const criticalCount = useMemo(() => {
    if (!Array.isArray(decisionCasesData?.cases)) return localCriticalCount;
    return decisionCasesData.cases.filter((item) => item.priority === "Critical" && item.status !== "Resolved" && item.status !== "Closed").length;
  }, [decisionCasesData, localCriticalCount]);

  const signOut = async () => {
    close();
    await queryClient.cancelQueries();
    queryClient.clear();
    await clearLocalSession();
    await navigate({ to: "/auth", replace: true });
  };

  const initial = (user?.full_name?.trim() || user?.email?.trim() || "U").charAt(0).toUpperCase();

  const content = (onNavigate?: () => void) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold text-muted-foreground">Workspace</p>
        {navigation.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          const badge = item.to === "/triggers" ? criticalCount : 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className={cn("grid size-10 place-items-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground group-hover:text-foreground")}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{item.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
              {badge > 0 && <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground" aria-label={`${badge} critical cases`}>{badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 px-3 py-2">
          <span className="grid size-10 place-items-center rounded-lg bg-secondary font-bold text-secondary-foreground">{initial}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user?.full_name || "Signed in"}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email || "Active session"}</span>
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="justify-start" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
            {theme === "light" ? <Moon /> : <Sun />}{theme === "light" ? "Dark mode" : "Light mode"}
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut />Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  const brand = (
    <Link to="/" onClick={close} className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Users className="size-5" /></span>
      <span className="min-w-0"><span className="block truncate font-bold">People Power Hub</span><span className="block text-xs text-muted-foreground">People intelligence</span></span>
    </Link>
  );

  return (
    <>
      <aside className="sticky top-0 z-20 hidden h-dvh w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border px-5 py-4">{brand}</div>
        {content()}
      </aside>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="flex h-full w-80 max-w-[88vw] flex-col bg-sidebar p-0 md:hidden">
          <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle><SheetDescription>Move between People Power Hub sections</SheetDescription></SheetHeader>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-sidebar-border px-4 py-3">
            {brand}
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close navigation"><X /></Button>
          </div>
          {content(close)}
        </SheetContent>
      </Sheet>
    </>
  );
}