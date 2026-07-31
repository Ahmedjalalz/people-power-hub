import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session && !localStorage.getItem("preview-bypass")) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
