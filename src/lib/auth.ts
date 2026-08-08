/**
 * Auth helpers.
 *
 * All network calls go through our own server-side proxy at /api/auth/*
 * to avoid CORS issues when calling the Render backend from the browser.
 */

const AUTH_PROXY = "/api/auth";

const ACCESS_TOKEN_KEY = "peoplelens_access_token";
const REFRESH_TOKEN_KEY = "peoplelens_refresh_token";
const USER_CACHE_KEY = "peoplelens_user_cache";

export interface User {
  id: string;
  full_name?: string | null;
  email: string | null;
  role: string | null;
  email_confirmed: boolean;
}

// Matches LoginResponse from the API
interface LoginApiResponse {
  message: string;
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in?: number | null;
    expires_at?: number | null;
  };
}

// ─── Token / user storage ────────────────────────────────────────────────────

export function setTokens(access: string, refresh: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_CACHE_KEY);
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function getCachedUser(): User | null {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(USER_CACHE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function cacheUser(user: User) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }
}

export function isSignedIn(): boolean {
  return !!getAccessToken();
}

export function getAuthHeader(): { Authorization?: string } {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "AuthError";
  }
}

// ─── Low-level proxy fetch ────────────────────────────────────────────────────

/**
 * POST (or GET) through the /api/auth/* server-side proxy.
 * Never throws on HTTP errors — returns the response for the caller to check.
 */
async function authFetch(
  action: string,
  body?: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  const isGet = body === undefined;
  return fetch(`${AUTH_PROXY}/${action}`, {
    method: isGet ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    ...(isGet ? {} : { body: JSON.stringify(body) }),
  });
}

/**
 * Extract the best human-readable error message from a failed API response.
 */
async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as Record<string, unknown>;
    if (Array.isArray(data.detail)) {
      return (data.detail as { msg?: string }[]).map((d) => d.msg ?? "").join(", ");
    }
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
  } catch {
    /* ignore parse failures */
  }
  return fallback;
}

// ─── Warm-up ─────────────────────────────────────────────────────────────────

/**
 * Pings /api/auth/me (which goes via our proxy → /health on the backend)
 * to wake the Render server from its cold-start sleep.
 * Fire-and-forget — call on page mount.
 */
export async function wakeUpServer(): Promise<void> {
  try {
    // Just GET /api/auth/me — the proxy will hit the backend regardless of auth state
    await fetch("/api/auth/me", { method: "GET", headers: { "Content-Type": "application/json" } });
  } catch {
    /* ignore — this is best-effort */
  }
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<User> {
  const res = await authFetch("login", { email, password });

  if (!res.ok) {
    const msg = await extractErrorMessage(res, "Failed to login. Please check your credentials.");
    throw new AuthError(msg);
  }

  // The API returns: { message, user, session: { access_token, refresh_token, … } }
  const data = await res.json() as LoginApiResponse;
  const { access_token, refresh_token } = data.session;
  setTokens(access_token, refresh_token);
  cacheUser(data.user);
  return data.user;
}

export async function signup(
  full_name: string,
  email: string,
  password: string,
  confirm_password?: string,
): Promise<void> {
  const res = await authFetch("signup", {
    full_name,
    email,
    password,
    confirm_password: confirm_password ?? password,
  });

  if (!res.ok) {
    const msg = await extractErrorMessage(res, "Failed to sign up.");
    throw new AuthError(msg);
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await authFetch("forgot-password", { email });
  if (!res.ok) {
    const msg = await extractErrorMessage(res, "Failed to request password reset.");
    throw new AuthError(msg);
  }
}

export async function resetPassword(
  new_password: string,
  refresh_token: string,
  confirm_password?: string,
): Promise<void> {
  const res = await authFetch("reset-password", {
    refresh_token,
    new_password,
    confirm_password: confirm_password ?? new_password,
  });
  if (!res.ok) {
    const msg = await extractErrorMessage(res, "Failed to reset password.");
    throw new AuthError(msg);
  }
}

export async function resendVerification(email: string): Promise<void> {
  const res = await authFetch("resend-verification", { email });
  if (!res.ok) {
    const msg = await extractErrorMessage(res, "Failed to resend verification email.");
    throw new AuthError(msg);
  }
}

export async function logout(): Promise<void> {
  clearTokens();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getAccessToken();
  if (!token) return null;

  // Return cached user immediately so protected routes don't flicker
  const cached = getCachedUser();

  try {
    const res = await fetch(`${AUTH_PROXY}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      // 401 / 403 → token was rejected by the server → log out
      if (res.status === 401 || res.status === 403) {
        clearTokens();
        return null;
      }
      // Any other server error → keep the cached user to avoid spurious logouts
      return cached;
    }

    // API returns: { authenticated: true, user: { … } }
    const data = await res.json() as { authenticated?: boolean; user?: User };
    const user = data.user ?? (data as unknown as User);
    cacheUser(user);
    return user;
  } catch {
    // Network error (cold start, offline) → use cached user
    return cached;
  }
}
