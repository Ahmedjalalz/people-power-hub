const API_BASE = import.meta.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_URL || "https://hr-work-force.onrender.com";

const ACCESS_TOKEN_KEY = "peoplelens_access_token";
const REFRESH_TOKEN_KEY = "peoplelens_refresh_token";

export interface User {
  id: string;
  email: string;
  role: string;
  email_confirmed: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user: User;
}

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
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function isSignedIn(): boolean {
  return !!getAccessToken();
}

export function getAuthHeader(): { Authorization?: string } {
  const token = getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new AuthError(errorData.message || "Failed to login. Please check your credentials.", errorData.code);
  }

  const data: AuthResponse = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function signup(full_name: string, email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new AuthError(errorData.message || "Failed to sign up.", errorData.code);
  }
  // Do not auto-login after signup, as the user must verify their email first.
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new AuthError(errorData.message || "Failed to request password reset.", errorData.code);
  }
}

export async function resetPassword(password: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, token }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new AuthError(errorData.message || "Failed to reset password.", errorData.code);
  }
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new AuthError(errorData.message || "Failed to resend verification email.", errorData.code);
  }
}

export async function logout(): Promise<void> {
  clearTokens();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Failed to fetch current user", err);
    return null;
  }
}
