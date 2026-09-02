import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * Validate and COERCE one part of the request, replacing it with the parsed
 * value. Because the parsed value is written back, downstream handlers get
 * numbers where the schema says number, not query strings.
 */
export const validate =
  <S extends ZodTypeAny>(schema: S, source: 'body' | 'query' | 'params' = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    // req.query is a getter on some Express versions; assign defensively.
    Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
    next();
  };

export type Validated<S extends ZodTypeAny> = z.infer<S>;
