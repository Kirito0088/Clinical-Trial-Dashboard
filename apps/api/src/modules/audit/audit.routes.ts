import { Router } from 'express';
import { listQuerySchema } from '@gvhax/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { listResource } from '../../lib/query.js';
import { paginated, wrap } from '../../lib/http.js';
import { AuditLog } from './audit.model.js';

export const auditRouter: Router = Router();

/** Read-only. Staff and above — the trail is not public. */
auditRouter.get(
  '/',
  requireAuth,
  requireRole('staff'),
  validate(listQuerySchema.passthrough(), 'query'),
  wrap(async (req, res) => {
    const { items, meta } = await listResource(AuditLog, req.query as never, {
      filterable: ['resource', 'actorId', 'method'],
      sortable: ['createdAt', 'statusCode'],
      searchable: ['action', 'path', 'actorName'],
    });
    paginated(res, items, meta);
  }),
);
