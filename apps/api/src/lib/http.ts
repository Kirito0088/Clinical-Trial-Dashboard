import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ApiOk, PageMeta } from '@ctd/shared';

/** Thrown anywhere in a route; normalised by the error middleware. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'ERROR',
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest = (m = 'Bad request', d?: Record<string, string[]>) =>
    new HttpError(400, m, 'BAD_REQUEST', d);
  static unauthorized = (m = 'Not authenticated') => new HttpError(401, m, 'UNAUTHORIZED');
  static forbidden = (m = 'Not allowed') => new HttpError(403, m, 'FORBIDDEN');
  static notFound = (m = 'Not found') => new HttpError(404, m, 'NOT_FOUND');
  static conflict = (m = 'Already exists') => new HttpError(409, m, 'CONFLICT');
  static unprocessable = (m = 'Cannot process', d?: Record<string, string[]>) =>
    new HttpError(422, m, 'UNPROCESSABLE', d);
}

/** Send the success envelope. Every route uses this, so the client's typed. */
export function ok<T>(res: Response, data: T, meta?: ApiOk<T>['meta']): void {
  const body: ApiOk<T> = meta ? { ok: true, data, meta } : { ok: true, data };
  res.json(body);
}

export function paginated<T>(res: Response, items: T[], meta: PageMeta): void {
  ok(res, items, meta);
}

/**
 * Wrap an async route so rejected promises reach the error middleware.
 * Express 4 does not do this itself; forgetting it is the classic
 * "request hangs forever" bug, so every route goes through it.
 */
export const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
