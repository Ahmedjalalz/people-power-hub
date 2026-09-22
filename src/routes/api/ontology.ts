import { createFileRoute } from "@tanstack/react-router";

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
  const allowedPrefixes = ["/ontology-studio", "/organization-onboarding", "/tenant-management"];
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

  const authorization = request.headers.get("Authorization");
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

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

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
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
