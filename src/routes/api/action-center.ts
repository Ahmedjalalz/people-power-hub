import { createFileRoute } from "@tanstack/react-router";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

const UPSTREAM_TIMEOUT_MS = 120_000;

export const Route = createFileRoute("/api/action-center")({
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
  const subpath = url.searchParams.get("path") || "/summary";

  // Construct upstream URL
  const upstreamUrl = new URL(`${API_BASE}/api/action-center${subpath.startsWith("/") ? subpath : `/${subpath}`}`);

  // Forward all query parameters except 'path'
  url.searchParams.forEach((value, key) => {
    if (key !== "path") {
      upstreamUrl.searchParams.set(key, value);
    }
  });

  try {
    const authorization = request.headers.get("Authorization");
    const isBodyRequest = request.method !== "GET" && request.method !== "HEAD";
    const body = isBodyRequest ? await request.text() : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl.toString(), {
        method: request.method,
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
        `Action Center proxy [${request.method} ${subpath}] failed [${upstream.status}]: ${responseBody}`
      );
    }

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`Action Center proxy exception [${request.method} ${subpath}]:`, error);
    return Response.json(
      { error: "Failed to communicate with Action Center service.", details: String(error) },
      { status: 502 }
    );
  }
}
