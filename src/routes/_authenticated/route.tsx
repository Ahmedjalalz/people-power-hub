import { createFileRoute, redirect, Outlet, useRouterState } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { AppSidebar, SidebarProvider } from "@/components/AppSidebar";
import { isSignedIn } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => { if (!isSignedIn()) throw redirect({ to: "/auth" }); },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const isChatbotPage = useRouterState({ select: (state) => state.location.pathname === "/chatbot" });
  return (
    <SidebarProvider>
      <div className={cn("flex w-full bg-background", isChatbotPage ? "h-screen overflow-hidden" : "min-h-screen")}>
        <AppSidebar />
        <div className={cn("flex flex-1 flex-col min-w-0", isChatbotPage && "h-full overflow-hidden")}>
          <Header />
          <main className={cn("flex-1", isChatbotPage ? "min-h-0 overflow-hidden" : "")}>
            <Outlet />
          </main>
        </div>
        {!isChatbotPage && <FloatingChatbot />}
      </div>
    </SidebarProvider>
  );
}
