import { Link } from "@tanstack/react-router";
import { Moon, Sun, BarChart3, MessageSquare, Users } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-pastel-lavender grid place-items-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="font-semibold text-lg">PeopleLens</div>
          <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">HR Management</span>
        </div>

        <nav className="flex items-center gap-1">
          <NavTab to="/" icon={<BarChart3 className="w-4 h-4" />} label="HR Insights" />
          <NavTab to="/chatbot" icon={<MessageSquare className="w-4 h-4" />} label="Assistant" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="ml-2 rounded-full"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
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
      className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
      activeProps={{ className: cn("bg-pastel-lavender/60 text-foreground") }}
      activeOptions={{ exact: true }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
