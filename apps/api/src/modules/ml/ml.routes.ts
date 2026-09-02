import { Router } from 'express';
import { env } from '../../config/env.js';
import { HttpError, ok, wrap } from '../../lib/http.js';

export const mlRouter: Router = Router();

/**
 * Thin proxy to the optional Python sidecar (apps/ml).
 *
 * Everything statistical lives there — pandas, scikit-learn, rapidfuzz,
 * Tesseract — because reimplementing those in JS under time pressure is a bad
 * trade. The proxy exists so the browser only ever talks to one origin and
 * never needs to know whether the sidecar is running.
 *
 * If the sidecar is down, callers get a clear 503 naming the start command
 * rather than an opaque connection error.
 */

async function forward(path: string, init: RequestInit): Promise<unknown> {
  if (!env.ML_ENABLED) {
    throw new HttpError(503, 'ML sidecar is disabled (set ML_ENABLED=true)', 'ML_DISABLED');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${env.ML_BASE_URL}${path}`, { ...init, signal: controller.signal });
    const text = await res.text();
    const body: unknown = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const detail =
        (body as { detail?: string } | null)?.detail ?? `sidecar returned ${res.status}`;
      throw new HttpError(res.status, detail, 'ML_ERROR');
    }
    return body;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(
      503,
      `Python sidecar unreachable at ${env.ML_BASE_URL}. Start it with: npm run dev:ml`,
      'ML_DOWN',
    );
  } finally {
    clearTimeout(timer);
  }
}

mlRouter.get(
  '/health',
  wrap(async (_req, res) => ok(res, await forward('/health', { method: 'GET' }))),
);

/**
 * Catch-all POST proxy. Any endpoint added to the sidecar is reachable
 * immediately as /api/ml/<same path> with no Node-side change.
 */
mlRouter.post(
  /^\/(.+)/,
  wrap(async (req, res) => {
    const path = req.path;
    ok(
      res,
      await forward(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req.body ?? {}),
      }),
    );
  }),
);
