import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim().replace(/\/$/, "") ||
  process.env["VITE_API_URL"]?.trim().replace(/\/$/, "") ||
  "https://hr-work-force.onrender.com";

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  thread_id: z.string().trim().min(1).max(200),
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

        try {
          const upstream = await fetch(`${API_BASE}/chat/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
              ...(authorization ? { Authorization: authorization } : {}),
            },
            body: JSON.stringify(result.data),
            signal: request.signal,
          });

          if (!upstream.ok) {
            const errorBody = await upstream.text();
            console.error(`HR chat request failed [${upstream.status}]: ${errorBody}`);
            return Response.json(
              { error: `Chat service request failed (${upstream.status}).` },
              { status: 502 },
            );
          }

          if (!upstream.body) {
            return Response.json(
              { error: "Chat service returned no response stream." },
              { status: 502 },
            );
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
            },
          });
        } catch (error) {
          if (request.signal.aborted) {
            return new Response(null, { status: 499 });
          }
          console.error("HR chat request failed:", error);
          return Response.json({ error: "Unable to reach the chat service." }, { status: 502 });
        }
      },
    },
  },
});