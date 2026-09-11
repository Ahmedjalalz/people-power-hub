import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, Users, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { logout as clearLocalSession, getCurrentUser } from "@/lib/auth";
import { useSidebarContext } from "@/components/AppSidebar";

export function Header() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toggle: toggleSidebar } = useSidebarContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await clearLocalSession();
    await navigate({ to: "/auth", replace: true });
  };

  const pageTitle =
    pathname === "/chatbot"
      ? "Assistant"
      : pathname === "/employees"
        ? "Employees"
        : pathname.startsWith("/employee/")
          ? "Employee Profile"
          : pathname === "/scenario"
            ? "Scenario Simulator"
            : pathname === "/triggers"
              ? "Decision Triggers"
              : "HR Insights";

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Mobile pull-out trigger: only visible on mobile screen sizes */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className="flex items-center gap-2 rounded-xl border-border/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground shadow-xs cursor-pointer md:hidden"
            aria-label="Navigation menu"
            title="Open navigation"
          >
            <Menu className="h-4 w-4" />
            <span>Menu</span>
          </Button>

          {/* Mobile-only brand header */}
          <Link to="/" className="flex items-center gap-2.5 md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xs">
              <Users className="h-4 w-4" />
            </div>
            <div className="text-base font-bold tracking-tight text-foreground">PeopleLens</div>
          </Link>

          {/* Desktop breadcrumb / section indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">PeopleLens</span>
            <span className="text-muted-foreground/30 font-light">/</span>
            <span className="font-semibold text-foreground tracking-tight">{pageTitle}</span>
          </div>
        </div>

        {/* User session info, theme toggle, sign out */}
        <nav className="flex items-center gap-1.5">
          {user && (
            <div className="ml-2 sm:ml-4 mr-1 flex items-center gap-2 rounded-full border border-border/80 bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <UserIcon className="h-3.5 w-3.5 opacity-70" />
              <span className="hidden sm:inline font-medium text-foreground">{user.email}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
