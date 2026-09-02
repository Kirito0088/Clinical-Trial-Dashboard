import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtClaims, Role } from '@gvhax/shared';
import { ROLE_RANK } from '@gvhax/shared';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: Role };
    }
  }
}

function readToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

/** Populates req.user when a valid token is present. Never rejects. */
export const attachUser: RequestHandler = (req, _res, next) => {
  const token = readToken(req.headers.authorization);
  if (!token) return next();
  try {
    const claims = jwt.verify(token, env.JWT_SECRET) as JwtClaims;
    req.user = { id: claims.sub, email: claims.email, role: claims.role };
  } catch {
    // An expired or malformed token is treated as "not logged in" rather than
    // an error, so public routes still work with a stale token in localStorage.
  }
  next();
};

/** Rejects when there is no authenticated user. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(HttpError.unauthorized());
  next();
};

/**
 * Rejects when the user's role ranks below `min`.
 * Ranked rather than exact-match so `requireRole('staff')` also admits admins.
 */
export const requireRole =
  (min: Role): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(HttpError.unauthorized());
    if (ROLE_RANK[req.user.role] < ROLE_RANK[min]) {
      return next(HttpError.forbidden(`Requires ${min} role or higher`));
    }
    next();
  };

export function signToken(claims: { id: string; email: string; role: Role }): string {
  return jwt.sign({ sub: claims.id, email: claims.email, role: claims.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}
