/**
 * Centralized API client.
 * - Reads JWT from localStorage (key: "token") and adds Authorization header.
 * - Routes all calls through `/api/*` (proxied to FastAPI by Vite/Express).
 * - Throws an Error with the backend's `detail` message when a request fails.
 */

// In dev, leave VITE_API_URL unset → calls go to "/api/*", proxied by Vite to FastAPI.
// In production (Vercel), set VITE_API_URL=https://your-backend.example.com so calls
// go straight to the deployed backend.
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem('token'),
  set: (t: string) => localStorage.setItem('token', t),
  clear: () => localStorage.removeItem('token'),
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean; // default true; pass `false` to skip the Authorization header
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      (data && typeof data === 'object' && 'detail' in data && data.detail) ||
      res.statusText ||
      'Request failed';
    const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

// ---------- Typed helpers ----------

import type {
  ChallengeResponse,
  LeaderboardEntry,
  Submission,
  User,
} from '../types';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const api = {
  // Auth
  signup: (payload: { email: string; username: string; password: string }) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: payload, auth: false }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: payload, auth: false }),

  // Me
  me: () => request<User>('/me'),
  mySubmissions: () => request<Submission[]>('/me/submissions'),

  // Challenges
  todaysChallenge: (difficulty: 'easy' | 'medium' | 'hard') =>
    request<ChallengeResponse>(`/challenges/today?difficulty=${difficulty}`, { auth: false }),

  // Submissions
  submit: (payload: { challenge_id: number | string; language: string; code: string }) =>
    request<Submission>('/submissions', { method: 'POST', body: payload }),

  // Leaderboard
  leaderboard: (by: 'score' | 'streak' = 'score', limit = 50) =>
    request<LeaderboardEntry[]>(`/leaderboard?by=${by}&limit=${limit}`, { auth: false }),
};
