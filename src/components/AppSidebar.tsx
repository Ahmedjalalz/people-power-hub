import React, { createContext, useContext, useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FlaskConical,
  MessageSquare,
  ShieldAlert,
  Users,
  LogOut,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { getCurrentUser, logout as clearLocalSession } from "@/lib/auth";
import { getCriticalOpenCount } from "@/lib/trigger-engine";
import { fetchDecisionCases } from "@/services/decision-cases";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function AppSidebar() {
  const { isOpen, setIsOpen, close } = useSidebarContext();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const { data: decisionCasesData } = useQuery({
    queryKey: ["decision-cases"],
    queryFn: ({ signal }) => fetchDecisionCases({ active_only: false }, signal),
    staleTime: 60 * 1000,
  });

  const signOut = async () => {
    close();
    await queryClient.cancelQueries();
    queryClient.clear();
    await clearLocalSession();
    await navigate({ to: "/auth", replace: true });
  };

  const isHrInsightsActive = pathname === "/";
  const isEmployeesActive = pathname === "/employees";
  const isScenarioActive = pathname === "/scenario";
  const isTriggersActive = pathname === "/triggers";
  const isAssistantActive = pathname === "/chatbot";

  const [localCriticalCount, setLocalCriticalCount] = useState(() => getCriticalOpenCount());

  React.useEffect(() => {
    function handleUpdate() {
      setLocalCriticalCount(getCriticalOpenCount());
    }
    window.addEventListener("trigger-cases-updated", handleUpdate);
    return () => window.removeEventListener("trigger-cases-updated", handleUpdate);
  }, []);

  const criticalCount = React.useMemo(() => {
    if (decisionCasesData?.cases && Array.isArray(decisionCasesData.cases)) {
      return decisionCasesData.cases.filter(
        (c) => c.priority === "Critical" && c.status !== "Resolved" && c.status !== "Closed"
      ).length;
    }
    return localCriticalCount;
  }, [decisionCasesData, localCriticalCount]);

  const userInitial = (user?.full_name?.trim() || user?.email?.trim() || "U")
    .charAt(0)
    .toUpperCase();

  const renderNavList = (onItemClick?: () => void) => (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto">
      {/* ── Navigation Links ── */}
      <div className="p-4">
        <div className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </div>
        <nav className="space-y-1.5">
          {/* HR Insights Tab */}
          <Link
            to="/"
            onClick={onItemClick}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              isHrInsightsActive
                ? "bg-primary/10 font-semibold text-primary shadow-2xs border border-primary/20"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {isHrInsightsActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
            )}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  isHrInsightsActive
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                )}
              >
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <div className="leading-tight">HR Insights</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Workforce Analytics
                </div>
              </div>
            </div>

            {isHrInsightsActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Link>

          {/* Employees Tab */}
          <Link
            to="/employees"
            onClick={onItemClick}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              isEmployeesActive
                ? "bg-primary/10 font-semibold text-primary shadow-2xs border border-primary/20"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {isEmployeesActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
            )}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  isEmployeesActive
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                )}
              >
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="leading-tight">Employees</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Directory & Teams
                </div>
              </div>
            </div>

            {isEmployeesActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Link>

          {/* Scenario Simulator Tab */}
          <Link
            to="/scenario"
            onClick={onItemClick}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              isScenarioActive
                ? "bg-primary/10 font-semibold text-primary shadow-2xs border border-primary/20"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {isScenarioActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
            )}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  isScenarioActive
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                )}
              >
                <FlaskConical className="h-4 w-4" />
              </div>
              <div>
                <div className="leading-tight">Scenario Simulator</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Workforce Modeling
                </div>
              </div>
            </div>

            {isScenarioActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Link>

          {/* Decision Triggers Tab */}
          <Link
            to="/triggers"
            onClick={onItemClick}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              isTriggersActive
                ? "bg-primary/10 font-semibold text-primary shadow-2xs border border-primary/20"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {isTriggersActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
            )}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  isTriggersActive
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                )}
              >
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <div className="leading-tight">Decision Triggers</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Case Monitoring
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  {criticalCount}
                </span>
              )}
              {isTriggersActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          </Link>

          {/* Assistant Tab */}
          <Link
            to="/chatbot"
            onClick={onItemClick}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              isAssistantActive
                ? "bg-primary/10 font-semibold text-primary shadow-2xs border border-primary/20"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {isAssistantActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
            )}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  isAssistantActive
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="leading-tight">Assistant</div>
                <div className="text-xs font-normal text-muted-foreground">
                  AI HR Copilot
                </div>
              </div>
            </div>

            {isAssistantActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Link>
        </nav>
      </div>

      {/* ── Bottom Section: Logged User's Info ── */}
      <div className="border-t border-border/80 bg-card/40 p-4">
        <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Logged In User
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/25 font-bold text-sm shadow-xs">
              {userInitial}
            </div>

            <div className="min-w-0 flex-1">
              {user?.full_name ? (
                <>
                  <div className="truncate text-sm font-semibold text-foreground">
                    {user.full_name}
                  </div>
                  <div
                    className="truncate text-xs text-muted-foreground"
                    title={user.email || ""}
                  >
                    {user.email || "No email available"}
                  </div>
                </>
              ) : (
                <div
                  className="truncate text-sm font-medium text-foreground"
                  title={user?.email || ""}
                >
                  {user?.email || "Authenticated User"}
                </div>
              )}

              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user?.role ? user.role : "Active Session"}</span>
              </div>
            </div>
          </div>

          {/* User Quick Actions */}
          <div className="mt-3 flex items-center justify-between border-t border-border/80 pt-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 gap-1.5 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="h-8 gap-1.5 rounded-xl px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: Fixed sidebar taking full height and permanent space ── */}
      <aside className="hidden md:flex h-screen sticky top-0 w-64 shrink-0 flex-col justify-between border-r border-border/80 bg-card/80 backdrop-blur-xl z-20">
        <div className="flex h-16 items-center border-b border-border/80 px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-base font-bold leading-tight tracking-tight text-foreground">
                PeopleLens
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">HR Intelligence</div>
            </div>
          </Link>
        </div>

        {renderNavList()}
      </aside>

      {/* ── Mobile: Pull-out sheet drawer (only on mobile screen sizes) ── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="flex h-full w-80 max-w-[85vw] flex-col justify-between border-r bg-card/95 backdrop-blur-xl p-0 shadow-2xl transition-all duration-300 md:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Access HR Insights, Employees, Assistant, and user account</SheetDescription>
          </SheetHeader>

          <div>
            <div className="flex items-center justify-between border-b px-5 py-4">
              <Link
                to="/"
                onClick={close}
                className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
              >
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold leading-tight tracking-tight text-foreground">
                    PeopleLens
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">HR Intelligence</div>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {renderNavList(close)}
        </SheetContent>
      </Sheet>
    </>
  );
}
