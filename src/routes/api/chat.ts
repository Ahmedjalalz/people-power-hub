import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  thread_id: z.string().trim().min(1).max(200).optional(),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const result = chatRequestSchema.safeParse(await request.json());
        if (!result.success) {
          return Response.json({ error: "Invalid chat request." }, { status: 400 });
        }

        const authorization = request.headers.get("Authorization");
        const acceptHeader = request.headers.get("Accept");
        const wantsStream = acceptHeader?.includes("text/event-stream");
        const targetEndpoint = wantsStream ? `${API_BASE}/chat/stream` : `${API_BASE}/chat`;

        try {
          const upstream = await fetch(targetEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(wantsStream ? { Accept: "text/event-stream" } : {}),
              ...(authorization ? { Authorization: authorization } : {}),
            },
            body: JSON.stringify(result.data),
            signal: request.signal,
          });

          if (!upstream.ok) {
            const errorBody = await upstream.text();
            const isHtml = errorBody.trim().startsWith("<") || errorBody.includes("<!DOCTYPE");
            if (isHtml) {
              console.warn(
                `[Chat API] Upstream returned status ${upstream.status} (HTML/Cloudflare response). Suppressing raw HTML log.`,
              );
            } else {
              console.error(`HR chat request failed [${upstream.status}]: ${errorBody}`);
            }
            return Response.json(
              {
                error:
                  upstream.status === 429
                    ? "The chat service is temporarily rate-limited. Please wait a moment."
                    : upstream.status === 503
                    ? "The chat service is currently waking up from sleep on Render. Please wait ~30s and try again."
                    : `Chat service request failed (${upstream.status}).`,
              },
              { status: upstream.status },
            );
          }

          if (wantsStream && upstream.body) {
            return new Response(upstream.body, {
              status: upstream.status,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }

          const data = await upstream.json();
          return Response.json(data, { status: 200 });
        } catch (error) {
          if (request.signal?.aborted) {
            return new Response(null, { status: 499 });
          }
          console.error("HR chat request failed:", error);
          return Response.json({ error: "Unable to reach the chat service." }, { status: 502 });
        }
      },
    },
  },
});