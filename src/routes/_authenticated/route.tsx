import { createFileRoute, redirect, Outlet, useRouterState } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { isSignedIn } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => { if (!isSignedIn()) throw redirect({ to: "/auth" }); },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const isChatbotPage = useRouterState({ select: (state) => state.location.pathname === "/chatbot" });
  return <><Header /><Outlet />{!isChatbotPage && <FloatingChatbot />}</>;
}
