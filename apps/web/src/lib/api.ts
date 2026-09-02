import type { ApiResponse, PageMeta } from '@gvhax/shared';

const BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'gvhax.token';

export const auth = {
  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode — the session just won't persist across reloads */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

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

  const token = auth.token;
  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // 204 and empty bodies are legitimate.
  const text = await res.text();
  const json = (text ? JSON.parse(text) : { ok: true, data: null }) as ApiResponse<T>;

  if (!json.ok) {
    // An expired token should drop the session rather than loop on 401s.
    if (res.status === 401) auth.clear();
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

  /** Multipart upload — must not set content-type, the browser sets the boundary. */
  async upload<T>(path: string, file: File, field = 'file'): Promise<T> {
    const form = new FormData();
    form.append(field, file);
    const token = auth.token;
    const res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.ok) throw new ApiError(json.error.message, json.error.code, res.status, json.error.details);
    return json.data;
  },

  /** Trigger a file download from a POST endpoint (the PDF report route). */
  async download(path: string, body: unknown, filename: string): Promise<void> {
    const token = auth.token;
    const res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new ApiError('Download failed', 'DOWNLOAD', res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const fileUrl = (fileId: string): string => `${BASE}/api/files/${fileId}`;
