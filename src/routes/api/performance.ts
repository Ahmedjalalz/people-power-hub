import { createFileRoute } from "@tanstack/react-router";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

const UPSTREAM_TIMEOUT_MS = 120_000;

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

const passthroughParams = [
  "month", "department", "role_band", "months",
  "search", "limit", "offset", "sort_by", "sort_direction",
];

export const Route = createFileRoute("/api/performance")({
  server: {
    handlers: {
      GET: async ({ request }) => forward(request),
      POST: async ({ request }) => forward(request),
    },
  },
});

async function forward(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? "";
  const employeeId = url.searchParams.get("employeeId");

  if (!resources.has(resource)) {
    return Response.json({ error: "Unknown performance resource." }, { status: 400 });
  }

  const base = "/api/v1/dashboard/performance";
  const employeeBase = employeeId
    ? `${base}/employees/${encodeURIComponent(employeeId)}`
    : null;

  const path =
    resource === "overview"                  ? `${base}/overview`
    : resource === "trend"                   ? `${base}/trend`
    : resource === "departments"             ? `${base}/departments`
    : resource === "distribution"            ? `${base}/distribution`
    : resource === "attention"               ? `${base}/attention`
    : resource === "ask"                     ? "/pipeline/performance"
    : !employeeBase                          ? null
    : resource === "employee"                ? employeeBase
    : resource === "employee-trend"          ? `${employeeBase}/trend`
    : resource === "employee-kpis"           ? `${employeeBase}/kpis`
    : resource === "employee-recommendations"? `${employeeBase}/recommendations`
    : resource === "employee-learning-history"? `${employeeBase}/learning-history`
    : null;

  if (!path) {
    return Response.json({ error: "employeeId is required for this resource." }, { status: 400 });
  }

  const upstreamUrl = new URL(`${API_BASE}${path}`);
  for (const key of passthroughParams) {
    const value = url.searchParams.get(key);
    if (value) upstreamUrl.searchParams.set(key, value);
  }

  const authorization = request.headers.get("Authorization");
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  // Independent timeout — do NOT pass request.signal.
  // React Query cancels browser requests on component unmount / refetch,
  // but the slow Render backend must be allowed to complete independently.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
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
      console.error(
        `Performance API failed [${upstream.status}] ${upstreamUrl.pathname}: ${responseBody}`,
      );
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
    console.error("Performance dashboard request failed:", error);
    return Response.json(
      {
        error: isTimeout
          ? "The performance service took too long to respond. Please try again."
          : "Unable to reach the performance service.",
      },
      { status: 504 },
    );
  }
}
