import { createFileRoute } from "@tanstack/react-router";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

/** Render cold-starts can take ~60 s. Give the upstream plenty of runway. */
const UPSTREAM_TIMEOUT_MS = 120_000;

// ─── Route mapping ────────────────────────────────────────────────────────────
// Maps the `resource` query param to a function that builds the upstream path.
// The function receives URLSearchParams so it can forward relevant query params.

type RouteMethod = "GET" | "POST";
type RouteEntry = { method: RouteMethod; buildPath: (params: URLSearchParams) => string };

const routes: Record<string, RouteEntry> = {
  // GET /api/v1/simulations/scenarios
  scenarios: {
    method: "GET",
    buildPath: () => "/api/v1/simulations/scenarios",
  },

  // GET /api/v1/simulations/employees?query=...&limit=...
  employees: {
    method: "GET",
    buildPath: (p) => {
      const query = p.get("query") ?? "";
      const limit = p.get("limit") ?? "20";
      return `/api/v1/simulations/employees?query=${encodeURIComponent(query)}&limit=${limit}`;
    },
  },

  // GET /api/v1/simulations/employees/{employee_id}/context
  "employee-context": {
    method: "GET",
    buildPath: (p) => {
      const id = p.get("employee_id") ?? "";
      return `/api/v1/simulations/employees/${encodeURIComponent(id)}/context`;
    },
  },

  // GET /api/v1/simulations/departments?query=...&limit=...
  departments: {
    method: "GET",
    buildPath: (p) => {
      const query = p.get("query") ?? "";
      const limit = p.get("limit") ?? "50";
      return `/api/v1/simulations/departments?query=${encodeURIComponent(query)}&limit=${limit}`;
    },
  },

  // GET /api/v1/simulations/options?scenario_type=...&employee_id=...&department_id=...&query=...
  options: {
    method: "GET",
    buildPath: (p) => {
      const forwarded = new URLSearchParams();
      for (const key of ["scenario_type", "employee_id", "department_id", "target_department_id", "query", "limit"]) {
        const v = p.get(key);
        if (v !== null && v !== "") forwarded.set(key, v);
      }
      return `/api/v1/simulations/options?${forwarded.toString()}`;
    },
  },

  // POST /api/v1/simulations/run
  run: {
    method: "POST",
    buildPath: () => "/api/v1/simulations/run",
  },
};

// ─── Route handler ────────────────────────────────────────────────────────────

async function proxyRequest({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? "";
  const route = routes[resource];

  if (!route) {
    return Response.json({ error: `Unknown simulation resource: "${resource}".` }, { status: 400 });
  }

  // Method guard: reject mismatched HTTP verbs
  if (request.method !== route.method) {
    return Response.json(
      { error: `Resource "${resource}" expects ${route.method}.` },
      { status: 405 },
    );
  }

  const authorization = request.headers.get("Authorization");
  const upstreamPath = route.buildPath(url.searchParams);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("upstream_timeout"), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamInit: RequestInit = {
      method: route.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      signal: controller.signal,
    };

    if (route.method === "POST") {
      upstreamInit.body = await request.text();
    }

    const upstream = await fetch(`${API_BASE}${upstreamPath}`, upstreamInit);
    clearTimeout(timeout);

    const responseBody = await upstream.text();
    if (!upstream.ok) {
      console.error(`Simulation API failed [${upstream.status}] ${upstreamPath}: ${responseBody}`);
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
    console.error(`Simulation proxy request failed [${upstreamPath}]:`, error);
    return Response.json(
      {
        error: isTimeout
          ? "The simulation service took too long to respond. Please try again."
          : "Unable to reach the simulation service.",
      },
      { status: 504 },
    );
  }
}

export const Route = createFileRoute("/api/scenario")({
  server: {
    handlers: {
      GET: proxyRequest,
      POST: proxyRequest,
    },
  },
});
