import { createFileRoute } from "@tanstack/react-router";
import { forwardUpstreamResponse } from "@/lib/proxy-helper";

export const Route = createFileRoute("/api/pipeline/headcount")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiBaseUrl = process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") || "https://hr-work-force.onrender.com";
        try {
          const body = await request.text();
          const upstream = await fetch(`${apiBaseUrl}/pipeline/headcount`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: body,
            signal: request.signal,
          });

          return await forwardUpstreamResponse(upstream, "Headcount API");
        } catch (error) {
          console.error("Headcount pipeline request failed:", error);
          return Response.json({ status: "error", message: "Unable to reach the headcount service." }, { status: 502 });
        }
      },
    },
  },
});
