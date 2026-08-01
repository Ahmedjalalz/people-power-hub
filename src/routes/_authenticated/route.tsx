import { createFileRoute, redirect, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { FloatingChatbot } from "@/components/FloatingChatbot";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const isChatbotPage = useRouterState({ select: (state) => state.location.pathname === "/chatbot" });

  return (
    <>
      <Header />
      <Outlet />
      {!isChatbotPage && <FloatingChatbot />}
    </>
  );
}
