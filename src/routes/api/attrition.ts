import { createFileRoute } from "@tanstack/react-router";

const allowedResources = new Set(["summary", "attrition-rate", "people-at-risk", "detail", "profile", "department-risk", "top-risk-drivers", "refresh"]);

export const Route = createFileRoute("/api/attrition")({
  server: {
    handlers: {
      GET: async ({ request }) => forward(request),
      POST: async ({ request }) => forward(request),
    },
  },
});

async function forward(request: Request): Promise<Response> {
  const apiBaseUrl = process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "");
  if (!apiBaseUrl) {
    return Response.json({ error: "NEXT_PUBLIC_API_BASE_URL is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? "";
  const employeeId = url.searchParams.get("employeeId");
  if (!allowedResources.has(resource)) {
    return Response.json({ error: "Unknown attrition resource." }, { status: 400 });
  }

  const path =
    resource === "summary" ? "/api/v1/dashboard/attrition/summary"
    : resource === "attrition-rate" ? "/api/v1/dashboard/attrition/attrition-rate"
    : resource === "people-at-risk" ? "/api/v1/dashboard/attrition/people-at-risk"
    : resource === "department-risk" ? "/api/v1/dashboard/attrition/department-risk"
    : resource === "top-risk-drivers" ? "/api/v1/dashboard/attrition/top-risk-drivers"
    : resource === "refresh" ? "/api/v1/dashboard/attrition/refresh"
    : resource === "detail" && employeeId ? `/api/v1/dashboard/attrition/people-at-risk/${encodeURIComponent(employeeId)}`
    : resource === "profile" && employeeId ? `/api/v1/dashboard/attrition/employees/${encodeURIComponent(employeeId)}/profile`
    : null;

  if (!path) {
    return Response.json({ error: "employeeId is required for this resource." }, { status: 400 });
  }

  const upstreamUrl = new URL(`${apiBaseUrl}${path}`);
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

  try {
    const requestBody = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: { Accept: "application/json" },
      body: requestBody,
      signal: request.signal,
    });
    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (error) {
    console.error("Attrition dashboard request failed:", error);
    return Response.json({ error: "Unable to reach the attrition service." }, { status: 502 });
  }
}
