import type { Review } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "codelensai-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (networkErr) {
    // Network-level failure (server not running, CORS, etc.)
    throw new Error(
      "Cannot reach the server. Make sure both frontend and backend are running (npm run dev)."
    );
  }

  const json = await res.json().catch(() => ({ error: "Server returned an invalid response." }));

  if (!res.ok) {
    const err = new Error(json.error || `Request failed (${res.status})`) as Error & {
      code?: string;
      status?: number;
    };
    err.code = json.code;
    err.status = res.status;
    throw err;
  }

  return json;
}

// ── Auth ──────────────────────────────────────────────────────
export async function signUp(email: string, password: string, name: string) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function signIn(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function signOut() {
  try {
    await apiFetch("/auth/signout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export async function getMe() {
  return apiFetch("/auth/me");
}

export async function verifyEmail(token: string) {
  return apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(email: string) {
  return apiFetch("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

// ── Reviews ───────────────────────────────────────────────────
export async function getReviews(): Promise<Review[]> {
  return apiFetch("/reviews");
}

export async function deleteReview(id: string): Promise<void> {
  await apiFetch(`/reviews/${id}`, { method: "DELETE" });
}

export async function callReviewFunction(
  code: string,
  language: string,
  filename: string
) {
  const data = await apiFetch("/reviews/review", {
    method: "POST",
    body: JSON.stringify({ code, language, filename }),
  });
  return data.feedback;
}
