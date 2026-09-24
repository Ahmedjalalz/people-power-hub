import { createFileRoute } from "@tanstack/react-router";
import { forwardUpstreamResponse } from "@/lib/proxy-helper";

const API_BASE =
  process.env["HR_MANAGEMENT_API_BASE"]?.trim().replace(/\/$/, "") ||
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

const UPSTREAM_TIMEOUT_MS = 30_000;

export const Route = createFileRoute("/api/ontology")({
  server: {
    handlers: {
      GET: async ({ request }) => forward(request),
      POST: async ({ request }) => forward(request),
      PATCH: async ({ request }) => forward(request),
      DELETE: async ({ request }) => forward(request),
    },
  },
});

async function forward(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const targetPath = url.searchParams.get("path") ?? "";

  if (!targetPath) {
    return Response.json({ error: "Missing required 'path' query parameter." }, { status: 400 });
  }

  // Security check: only allow approved prefix paths
  const allowedPrefixes = [
    "/ontology-studio",
    "/organization-onboarding",
    "/tenant-management",
    "/tenant-graph",
    "/ontology",
    "/mapping",
  ];
  const isAllowed = allowedPrefixes.some((prefix) => targetPath.startsWith(prefix));
  if (!isAllowed) {
    return Response.json({ error: "Path not permitted." }, { status: 403 });
  }

  const upstreamUrl = new URL(`${API_BASE}${targetPath}`);

  // Forward extra query params from the incoming request except 'path'
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "path" && !upstreamUrl.searchParams.has(key)) {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  // Extract tenantId from search params or headers
  const tenantId =
    upstreamUrl.searchParams.get("tenant_id") ||
    url.searchParams.get("tenant_id") ||
    request.headers.get("X-Organization-ID") ||
    request.headers.get("x-organization-id") ||
    request.headers.get("X-Tenant-ID") ||
    request.headers.get("x-tenant-id");

  if (tenantId && !upstreamUrl.searchParams.has("tenant_id")) {
    if (
      upstreamUrl.pathname.includes("/dashboard") ||
      upstreamUrl.pathname.includes("/live-graph")
    ) {
      upstreamUrl.searchParams.set("tenant_id", tenantId);
    }
  }

  const authorization = request.headers.get("Authorization");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (authorization) {
    headers["Authorization"] = authorization;
  }
  if (tenantId) {
    headers["X-Organization-ID"] = tenantId;
    headers["X-Tenant-ID"] = tenantId;
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return await forwardUpstreamResponse(upstream, `Ontology API [${targetPath}]`);
  } catch (error) {
    clearTimeout(timeout);
    const isTimeout = error instanceof Error && error.message === "upstream_timeout";
    return Response.json(
      {
        error: isTimeout
          ? "The ontology service took too long to respond."
          : "Unable to reach the ontology service.",
      },
      { status: 504 },
    );
  }
}
