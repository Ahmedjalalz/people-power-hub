import { createFileRoute } from "@tanstack/react-router";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

/** Render cold-starts can take ~60 s. Give the upstream plenty of runway. */
const UPSTREAM_TIMEOUT_MS = 120_000;

export const Route = createFileRoute("/pipeline/headcount")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authorization = request.headers.get("Authorization");
          const body = await request.text();

          // Use our own AbortController — never forward the browser signal.
          // React Query or navigation changes abort the browser request, but
          // we must let the slow Render backend finish independently.
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

          let upstream: Response;
          try {
            upstream = await fetch(`${API_BASE}/pipeline/headcount`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(authorization ? { Authorization: authorization } : {}),
              },
              body,
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeout);
          }

          const responseBody = await upstream.text();

          if (!upstream.ok) {
            console.error(
              `Headcount API request failed [${upstream.status}]: ${responseBody}`,
            );
            return Response.json(
              { status: "error", message: `Backend request failed (${upstream.status}).` },
              { status: upstream.status },
            );
          }

          return new Response(responseBody, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const isTimeout = error instanceof Error && error.message === "upstream_timeout";
          console.error("Headcount pipeline request failed:", error);
          return Response.json(
            {
              status: "error",
              message: isTimeout
                ? "The headcount service took too long to respond. Please try again."
                : "Unable to reach the headcount service.",
            },
            { status: 504 },
          );
        }
      },
    },
  },
});
