import { createFileRoute } from "@tanstack/react-router";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

const UPSTREAM_TIMEOUT_MS = 120_000;

const allowedResources = new Set([
  "summary",
  "attrition-rate",
  "people-at-risk",
  "detail",
  "profile",
  "department-risk",
  "top-risk-drivers",
  "refresh",
]);

export const Route = createFileRoute("/api/attrition")({
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

  if (!allowedResources.has(resource)) {
    return Response.json({ error: "Unknown attrition resource." }, { status: 400 });
  }

  const path =
    resource === "summary"           ? "/api/v1/dashboard/attrition/summary"
    : resource === "attrition-rate"  ? "/api/v1/dashboard/attrition/attrition-rate"
    : resource === "people-at-risk"  ? "/api/v1/dashboard/attrition/people-at-risk"
    : resource === "department-risk" ? "/api/v1/dashboard/attrition/department-risk"
    : resource === "top-risk-drivers"? "/api/v1/dashboard/attrition/top-risk-drivers"
    : resource === "refresh"         ? "/api/v1/dashboard/attrition/refresh"
    : resource === "detail" && employeeId
      ? `/api/v1/dashboard/attrition/people-at-risk/${encodeURIComponent(employeeId)}`
    : resource === "profile" && employeeId
      ? `/api/v1/dashboard/attrition/employees/${encodeURIComponent(employeeId)}/profile`
    : null;

  if (!path) {
    return Response.json({ error: "employeeId is required for this resource." }, { status: 400 });
  }

  const upstreamUrl = new URL(`${API_BASE}${path}`);

  if (resource === "people-at-risk") {
    for (const key of ["offset", "limit", "department", "position_criticality", "search"]) {
      const value = url.searchParams.get(key);
      if (value) upstreamUrl.searchParams.set(key, value);
    }
  }
  if (resource === "top-risk-drivers") {
    const limit = url.searchParams.get("limit");
    if (limit) upstreamUrl.searchParams.set("limit", limit);
  }

  const authorization = request.headers.get("Authorization");
  const requestBody =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  // Independent timeout — do NOT pass request.signal.
  // The browser may cancel the request early (React Query cleanup / navigation),
  // but we want the slow Render backend to finish.
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
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseBody = await upstream.text();

    if (!upstream.ok) {
      console.error(`Attrition API [${resource}] failed [${upstream.status}]: ${responseBody}`);
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
    console.error(`Attrition dashboard request failed [${resource}]:`, error);
    return Response.json(
      {
        error: isTimeout
          ? "The attrition service took too long to respond. Please try again."
          : "Unable to reach the attrition service.",
      },
      { status: 504 },
    );
  }
}
