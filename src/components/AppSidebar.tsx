import React, { createContext, useContext, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  MessageSquare,
  Users,
  LogOut,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { getCurrentUser, logout as clearLocalSession } from "@/lib/auth";
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

  const signOut = async () => {
    close();
    await queryClient.cancelQueries();
    queryClient.clear();
    await clearLocalSession();
    await navigate({ to: "/auth", replace: true });
  };

  const isHrInsightsActive = pathname === "/";
  const isAssistantActive = pathname === "/chatbot";
  const isEmployeesActive = pathname === "/employees";

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
              "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
              isHrInsightsActive
                ? "bg-pastel-teal/70 font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  isHrInsightsActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                )}
              >
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <div className="leading-tight">HR Insights</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Overview & Attrition
                </div>
              </div>
            </div>

            {isHrInsightsActive && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>

          {/* Employees Tab */}
          <Link
            to="/employees"
            onClick={onItemClick}
            className={cn(
              "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
              isEmployeesActive
                ? "bg-pastel-teal/70 font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  isEmployeesActive
                    ? "bg-primary text-primary-foreground shadow-xs"
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
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>

          {/* Assistant Tab */}
          <Link
            to="/chatbot"
            onClick={onItemClick}
            className={cn(
              "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
              isAssistantActive
                ? "bg-pastel-teal/70 font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  isAssistantActive
                    ? "bg-primary text-primary-foreground shadow-xs"
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
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
        </nav>
      </div>

      {/* ── Bottom Section: Logged User's Info ── */}
      <div className="border-t border-border bg-muted/30 p-4">
        <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Logged In User
        </div>

        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pastel-teal font-semibold text-primary shadow-xs">
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
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
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
              className="h-8 gap-1.5 rounded-full px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
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
      <aside className="hidden md:flex h-screen sticky top-0 w-64 shrink-0 flex-col justify-between border-r border-border bg-card/60 backdrop-blur z-20">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-pastel-teal shadow-xs">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-base font-semibold leading-tight text-foreground">
                PeopleLens
              </div>
              <div className="text-[11px] text-muted-foreground">HR Management</div>
            </div>
          </Link>
        </div>

        {renderNavList()}
      </aside>

      {/* ── Mobile: Pull-out sheet drawer (only on mobile screen sizes) ── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="flex h-full w-80 max-w-[85vw] flex-col justify-between border-r bg-card p-0 shadow-2xl transition-all duration-300 md:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Access HR Insights, Assistant, and user account</SheetDescription>
          </SheetHeader>

          <div>
            <div className="flex items-center justify-between border-b px-5 py-4">
              <Link
                to="/"
                onClick={close}
                className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-pastel-teal shadow-xs">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-base font-semibold leading-tight text-foreground">
                    PeopleLens
                  </div>
                  <div className="text-xs text-muted-foreground">HR Management</div>
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
