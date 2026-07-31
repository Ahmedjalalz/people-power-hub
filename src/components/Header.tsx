import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, BarChart3, MessageSquare, Users, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-pastel-teal">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="text-lg font-semibold">PeopleLens</div>
          <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">HR Management</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavTab to="/" icon={<BarChart3 className="h-4 w-4" />} label="HR Insights" />
          <NavTab to="/chatbot" icon={<MessageSquare className="h-4 w-4" />} label="Assistant" />
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

function NavTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      activeProps={{ className: cn("bg-pastel-teal/60 text-foreground") }}
      activeOptions={{ exact: true }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
