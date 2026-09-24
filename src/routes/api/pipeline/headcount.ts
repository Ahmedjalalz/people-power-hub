import { createFileRoute } from "@tanstack/react-router";
import { forwardUpstreamResponse } from "@/lib/proxy-helper";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

export const Route = createFileRoute("/api/pipeline/headcount")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2_500);

        try {
          const body = await request.text();
          const upstream = await fetch(`${API_BASE}/pipeline/headcount`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: body,
            signal: controller.signal,
          });

          clearTimeout(timeout);
          return await forwardUpstreamResponse(upstream, "Headcount API");
        } catch (error) {
          clearTimeout(timeout);
          console.error("Headcount pipeline request failed:", error);
          return Response.json({ status: "error", message: "Unable to reach the headcount service." }, { status: 504 });
        }
      },
    },
  },
});
