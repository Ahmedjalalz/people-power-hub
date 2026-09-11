import { createFileRoute } from "@tanstack/react-router";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

const UPSTREAM_TIMEOUT_MS = 120_000;

export const Route = createFileRoute("/api/decision-cases")({
  server: {
    handlers: {
      GET: async ({ request }) => forward(request),
      POST: async ({ request }) => forward(request),
      PATCH: async ({ request }) => forward(request),
    },
  },
});

async function forward(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const caseId = url.searchParams.get("case_id");
  const action = url.searchParams.get("action");

  let upstreamPath = "/api/v1/decision-cases";
  const method = request.method.toUpperCase();

  if (method === "GET") {
    if (caseId) {
      upstreamPath = `/api/v1/decision-cases/${encodeURIComponent(caseId)}`;
    } else {
      const forwarded = new URLSearchParams();
      for (const [k, v] of url.searchParams.entries()) {
        if (k !== "case_id" && k !== "action" && v !== "") {
          forwarded.set(k, v);
        }
      }
      const qs = forwarded.toString();
      upstreamPath = qs ? `/api/v1/decision-cases?${qs}` : "/api/v1/decision-cases";
    }
  } else if (method === "POST") {
    if (action === "evaluate" || url.pathname.endsWith("/evaluate")) {
      upstreamPath = "/api/v1/decision-cases/evaluate";
    }
  } else if (method === "PATCH") {
    if (!caseId) {
      return Response.json({ error: "Missing case_id parameter for status update." }, { status: 400 });
    }
    upstreamPath = `/api/v1/decision-cases/${encodeURIComponent(caseId)}/status`;
  }

  const authorization = request.headers.get("Authorization");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamInit: RequestInit = {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      signal: controller.signal,
    };

    if (method === "POST" || method === "PATCH") {
      const bodyText = await request.text();
      if (bodyText) {
        upstreamInit.body = bodyText;
      }
    }

    const upstream = await fetch(`${API_BASE}${upstreamPath}`, upstreamInit);
    clearTimeout(timeout);

    const responseBody = await upstream.text();
    if (!upstream.ok) {
      console.error(`Decision Cases API error [${upstream.status}] ${upstreamPath}: ${responseBody}`);
    }

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    clearTimeout(timeout);
    const isTimeout =
      error instanceof Error && (error.message === "upstream_timeout" || error.name === "AbortError");
    console.error(`Decision Cases proxy request failed [${upstreamPath}]:`, error);
    return Response.json(
      {
        error: isTimeout
          ? "The Decision Cases service timed out. The backend instance may be starting up."
          : "Unable to reach the Decision Cases service.",
      },
      { status: 504 },
    );
  }
}
