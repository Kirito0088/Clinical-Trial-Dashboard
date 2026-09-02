import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import type { ApiErr } from '@gvhax/shared';
import { HttpError } from '../lib/http.js';
import { isDev } from '../config/env.js';
import { log } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`No route for ${req.method} ${req.originalUrl}`));
};

/** Turns anything thrown into the single ApiErr shape the client expects. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let code = 'INTERNAL';
  let message = 'Something went wrong';
  let details: Record<string, string[]> | undefined;

  if (err instanceof HttpError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION';
    message = 'Validation failed';
    details = err.flatten().fieldErrors as Record<string, string[]>;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = 'VALIDATION';
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, [v.message]]),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    code = 'BAD_ID';
    message = `Invalid value for "${err.path}"`;
  } else if (isMongoDuplicate(err)) {
    status = 409;
    code = 'CONFLICT';
    const field = Object.keys((err as { keyPattern?: object }).keyPattern ?? {})[0] ?? 'field';
    message = `That ${field} is already taken`;
  } else if (err instanceof Error) {
    message = isDev ? err.message : message;
  }

  if (status >= 500) log.error(String(err instanceof Error ? err.stack : err));

  const body: ApiErr = { ok: false, error: { message, code, ...(details ? { details } : {}) } };
  res.status(status).json(body);
};

function isMongoDuplicate(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
