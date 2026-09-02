import type { RequestHandler } from 'express';
import { AuditLog } from '../modules/audit/audit.model.js';
import { log } from '../lib/logger.js';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Records every successful mutation to the audit collection.
 *
 * Several statements (secure document vault, approval workflows, land-record
 * tracking) ask for "who did what, when" out of the box. Doing it as global
 * middleware means individual routes never have to remember.
 *
 * Writes happen after the response is sent, and failures are swallowed — an
 * audit problem must never turn a successful request into a failed one.
 */
export const auditLogger: RequestHandler = (req, res, next) => {
  if (!MUTATING.has(req.method)) return next();

  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    const segments = req.baseUrl.split('/').filter(Boolean);
    const resource = segments[segments.length - 1] ?? 'unknown';

    void AuditLog.create({
      action: `${req.method} ${resource}`,
      resource,
      resourceId: typeof req.params.id === 'string' ? req.params.id : null,
      actorId: req.user?.id ?? null,
      actorName: req.user?.email ?? null,
      actorRole: req.user?.role ?? null,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip ?? null,
      changes: redact(req.body),
    }).catch((err) => log.warn(`audit write failed: ${String(err)}`));
  });

  next();
};

const SECRET_KEYS = /password|token|secret|apikey|api_key|authorization/i;

/** Never persist credentials into the audit trail. */
function redact(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    out[k] = SECRET_KEYS.test(k) ? '[redacted]' : v;
  }
  return out;
}
