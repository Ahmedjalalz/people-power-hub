import { createFileRoute } from "@tanstack/react-router";

const resources = new Set([
  "overview",
  "trend",
  "departments",
  "distribution",
  "attention",
  "employee",
  "employee-trend",
  "employee-kpis",
  "employee-recommendations",
  "employee-learning-history",
  "ask",
]);

const passthroughParams = ["month", "department", "role_band", "months", "search", "limit", "offset", "sort_by", "sort_direction"];

export const Route = createFileRoute("/api/performance")({
  server: {
    handlers: {
      GET: async ({ request }) => forward(request),
      POST: async ({ request }) => forward(request),
    },
  },
});

async function forward(request: Request): Promise<Response> {
  const apiBaseUrl = process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "")
    || process.env["VITE_API_URL"]?.trim().replace(/\/$/, "");
  if (!apiBaseUrl) {
    return Response.json({ error: "NEXT_PUBLIC_API_BASE_URL is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? "";
  const employeeId = url.searchParams.get("employeeId");
  if (!resources.has(resource)) {
    return Response.json({ error: "Unknown performance resource." }, { status: 400 });
  }

  const base = "/api/v1/dashboard/performance";
  const employeeBase = employeeId ? `${base}/employees/${encodeURIComponent(employeeId)}` : null;

  const path =
    resource === "overview" ? `${base}/overview`
    : resource === "trend" ? `${base}/trend`
    : resource === "departments" ? `${base}/departments`
    : resource === "distribution" ? `${base}/distribution`
    : resource === "attention" ? `${base}/attention`
    : resource === "ask" ? "/pipeline/performance"
    : !employeeBase ? null
    : resource === "employee" ? employeeBase
    : resource === "employee-trend" ? `${employeeBase}/trend`
    : resource === "employee-kpis" ? `${employeeBase}/kpis`
    : resource === "employee-recommendations" ? `${employeeBase}/recommendations`
    : resource === "employee-learning-history" ? `${employeeBase}/learning-history`
    : null;

  if (!path) {
    return Response.json({ error: "employeeId is required for this resource." }, { status: 400 });
  }

  const upstreamUrl = new URL(`${apiBaseUrl}${path}`);
  for (const key of passthroughParams) {
    const value = url.searchParams.get(key);
    if (value) upstreamUrl.searchParams.set(key, value);
  }

  try {
    const authorization = request.headers.get("Authorization");
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body,
      signal: request.signal,
    });
    const responseBody = await upstream.text();
    if (!upstream.ok) {
      console.error(`Performance API failed [${upstream.status}] ${upstreamUrl.pathname}: ${responseBody}`);
    }
    return new Response(responseBody, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (error) {
    console.error("Performance dashboard request failed:", error);
    return Response.json({ error: "Unable to reach the performance service." }, { status: 502 });
  }
}
