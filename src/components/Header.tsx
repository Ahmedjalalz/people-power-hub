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
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Mobile pull-out trigger: only visible on mobile screen sizes */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className="flex items-center gap-2 rounded-full border-border/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground shadow-xs cursor-pointer md:hidden"
            aria-label="Navigation menu"
            title="Open navigation"
          >
            <Menu className="h-4 w-4" />
            <span>Navigation</span>
          </Button>

          {/* Mobile-only brand header */}
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-pastel-teal shadow-xs">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-base font-semibold text-foreground">PeopleLens</div>
          </Link>

          {/* Desktop breadcrumb / section indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">PeopleLens</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-semibold text-foreground">{pageTitle}</span>
          </div>
        </div>

        {/* The rest of the navbar kept intact: user session info, theme toggle, sign out */}
        <nav className="flex items-center gap-1">
          {user && (
            <div className="ml-4 mr-2 flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{user.email}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="ml-2 rounded-full"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="rounded-full"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
