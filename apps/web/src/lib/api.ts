import type { ApiResponse, PageMeta } from '@ctd/shared';

const BASE = import.meta.env.VITE_API_URL ?? '';

/** Carries the server's error code and field details through to the UI. */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Appended as a query string; undefined and '' values are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * The single fetch wrapper. Unwraps the { ok, data, meta } envelope so callers
 * work with plain values, and turns { ok: false } into a thrown ApiError that
 * TanStack Query surfaces as an error state.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta?: PageMeta }> {
  const { body, params, headers, ...rest } = options;

  const url = new URL(`${BASE}/api${path}`, window.location.origin);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // 204 and empty bodies are legitimate.
  const text = await res.text();
  const json = (text ? JSON.parse(text) : { ok: true, data: null }) as ApiResponse<T>;

  if (!json.ok) {
    throw new ApiError(json.error.message, json.error.code, res.status, json.error.details);
  }

  return { data: json.data, meta: json.meta as PageMeta | undefined };
}

export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) =>
    request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
