import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiErr } from '@ctd/shared';
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
  } else if (err instanceof Error) {
    message = isDev ? err.message : message;
  }

  if (status >= 500) log.error(String(err instanceof Error ? err.stack : err));

  const body: ApiErr = { ok: false, error: { message, code, ...(details ? { details } : {}) } };
  res.status(status).json(body);
};
