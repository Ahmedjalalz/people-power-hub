import { createFileRoute, redirect, Outlet, useRouterState } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { AppSidebar, SidebarProvider } from "@/components/AppSidebar";
import { isSignedIn } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => { if (!isSignedIn()) throw redirect({ to: "/auth" }); },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const isChatbotPage = useRouterState({ select: (state) => state.location.pathname === "/chatbot" });
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
        {!isChatbotPage && <FloatingChatbot />}
      </div>
    </SidebarProvider>
  );
}
