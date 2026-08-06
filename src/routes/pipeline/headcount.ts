import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pipeline/headcount")({
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

          if (!upstream.ok) {
            const errorBody = await upstream.text();
            console.error(`Headcount API request failed [${upstream.status}]: ${errorBody}`);
            return Response.json(
              { status: "error", message: `Backend request failed (${upstream.status}).` },
              { status: upstream.status },
            );
          }

          const responseBody = await upstream.text();
          return new Response(responseBody, {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          console.error("Headcount pipeline request failed:", error);
          return Response.json({ status: "error", message: "Unable to reach the headcount service." }, { status: 502 });
        }
      },
    },
  },
});
