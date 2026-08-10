import { createFileRoute } from "@tanstack/react-router";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

/** Render cold-starts can take ~60 s. Give the upstream plenty of runway. */
const UPSTREAM_TIMEOUT_MS = 120_000;

const paths: Record<string, string> = {
  simulate: "/pipeline/scenario",
  "employee-search": "/tools/employee-search",
};

export const Route = createFileRoute("/api/scenario")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const resource = url.searchParams.get("resource") ?? "simulate";
        const path = paths[resource];
        if (!path) {
          return Response.json({ error: "Unknown scenario resource." }, { status: 400 });
        }

        const authorization = request.headers.get("Authorization");
        const body = await request.text();

        // Independent timeout — never forward the browser abort signal.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

        try {
          const upstream = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              ...(authorization ? { Authorization: authorization } : {}),
            },
            body,
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const responseBody = await upstream.text();
          if (!upstream.ok) {
            console.error(`Scenario API failed [${upstream.status}] ${path}: ${responseBody}`);
          }

          return new Response(responseBody, {
            status: upstream.status,
            headers: {
              "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            },
          });
        } catch (error) {
          clearTimeout(timeout);
          const isTimeout = error instanceof Error && error.message === "upstream_timeout";
          console.error("Scenario simulation request failed:", error);
          return Response.json(
            {
              error: isTimeout
                ? "The scenario service took too long to respond. Please try again."
                : "Unable to reach the scenario service.",
            },
            { status: 504 },
          );
        }
      },
    },
  },
});
