import { createFileRoute } from "@tanstack/react-router";

const API_BASE = "https://hr-work-force.onrender.com";
const UPSTREAM_TIMEOUT_MS = 120_000;

export const Route = createFileRoute("/api/auth/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => forward(request, params.action),
      POST: async ({ request, params }) => forward(request, params.action),
    },
  },
});

const ALLOWED_ACTIONS = new Set([
  "login",
  "signup",
  "logout",
  "me",
  "resend-verification",
  "forgot-password",
  "reset-password",
]);

async function forward(request: Request, action: string): Promise<Response> {
  if (!ALLOWED_ACTIONS.has(action)) {
    return Response.json({ error: "Unknown auth action." }, { status: 400 });
  }

  const upstreamUrl = `${API_BASE}/auth/${action}`;

  try {
    const authorization = request.headers.get("Authorization");
    const isBodyRequest = request.method !== "GET" && request.method !== "HEAD";
    const body = isBodyRequest ? await request.text() : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
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
        `Auth proxy [${action}] failed [${upstream.status}]: ${responseBody}`,
      );
    }

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error(`Auth proxy [${action}] network error:`, error);
    return Response.json(
      { detail: "Unable to reach the authentication service. Please try again." },
      { status: 502 },
    );
  }
}
