/**
 * Helper to process and normalize upstream responses from external services (e.g. Render).
 * Prevents raw HTML (Cloudflare Turnstile challenges, 503 Render hibernation errors)
 * from crashing client-side JSON parsers or flooding terminal logs.
 */
export async function forwardUpstreamResponse(
  upstream: Response,
  contextLabel: string,
): Promise<Response> {
  const responseText = await upstream.text();
  const isHtml = responseText.trim().startsWith("<") || responseText.includes("<!DOCTYPE");

  if (!upstream.ok) {
    if (isHtml) {
      console.warn(
        `[${contextLabel}] Upstream returned status ${upstream.status} (HTML/Cloudflare response). Suppressing raw HTML log.`,
      );
    } else {
      const truncated = responseText.length > 500 ? `${responseText.slice(0, 500)}...` : responseText;
      console.error(`[${contextLabel}] failed [${upstream.status}]: ${truncated}`);
    }
  }

  // If the upstream returned HTML (Cloudflare 429 challenge or 503 Render error page),
  // return a structured JSON response instead of HTML so that client fetch().json() does not throw a SyntaxError.
  if (isHtml) {
    const message =
      upstream.status === 429
        ? "The backend service is currently rate-limited or undergoing Cloudflare verification. Please wait a moment and try again."
        : upstream.status === 503
        ? "The backend service is currently waking up from hibernation on Render. Please allow 30-60 seconds and refresh."
        : `Upstream service returned error (${upstream.status}).`;

    return Response.json(
      {
        error: message,
        detail: message,
        status: upstream.status,
        isUpstreamHtml: true,
      },
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(responseText, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
