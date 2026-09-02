import { Router } from 'express';
import { z } from 'zod';
import {
  createItemSchema,
  listQuerySchema,
  transitionSchema,
  updateItemSchema,
  SOCKET_EVENTS,
} from '@gvhax/shared';
import { validate } from '../../middleware/validate.js';
import { attachUser, requireAuth } from '../../middleware/auth.js';
import { ok, paginated, wrap } from '../../lib/http.js';
import { emit } from '../../realtime/socket.js';
import { historyFor, nextStages } from '../workflow/workflow.service.js';
import * as svc from './item.service.js';

export const itemRouter: Router = Router();

itemRouter.use(attachUser);

const actorOf = (req: { user?: { id: string; email: string } }) =>
  req.user ? { id: req.user.id, name: req.user.email } : null;

/** Notify every subscriber that this collection moved. Drives live dashboards. */
const announce = (action: string, id?: string) =>
  emit(svc.RESOURCE, SOCKET_EVENTS.RESOURCE_CHANGED, { resource: svc.RESOURCE, action, id });

// ── Reads ────────────────────────────────────────────────────────────────
// Declared before "/:id" so they aren't swallowed by the id route.

itemRouter.get('/stats', wrap(async (_req, res) => ok(res, await svc.stats())));
itemRouter.get('/geo', wrap(async (_req, res) => ok(res, await svc.geo())));
itemRouter.get('/timeline', wrap(async (_req, res) => ok(res, await svc.timeline())));

itemRouter.get(
  '/',
  validate(listQuerySchema.passthrough(), 'query'),
  wrap(async (req, res) => {
    const { items, meta } = await svc.list(req.query as never);
    paginated(res, items, meta);
  }),
);

itemRouter.get(
  '/:id',
  wrap(async (req, res) => {
    const doc = await svc.getById(req.params.id);
    ok(res, {
      ...doc.toJSON(),
      nextStages: nextStages(doc.stage),
      history: await historyFor(svc.RESOURCE, req.params.id),
    });
  }),
);

// ── Writes ───────────────────────────────────────────────────────────────

itemRouter.post(
  '/',
  requireAuth,
  validate(createItemSchema),
  wrap(async (req, res) => {
    const doc = await svc.create(req.body, req.user?.id ?? null);
    announce('created', String(doc._id));
    res.status(201);
    ok(res, doc.toJSON());
  }),
);

itemRouter.patch(
  '/:id',
  requireAuth,
  validate(updateItemSchema),
  wrap(async (req, res) => {
    const doc = await svc.update(req.params.id, req.body);
    announce('updated', req.params.id);
    ok(res, doc.toJSON());
  }),
);

itemRouter.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    await svc.remove(req.params.id);
    announce('deleted', req.params.id);
    ok(res, { id: req.params.id });
  }),
);

/** Stage changes go through the state machine, never through PATCH. */
itemRouter.post(
  '/:id/transition',
  requireAuth,
  validate(transitionSchema),
  wrap(async (req, res) => {
    const doc = await svc.moveStage(req.params.id, req.body.to, req.body.note, actorOf(req));
    announce('transitioned', req.params.id);
    ok(res, doc.toJSON());
  }),
);

itemRouter.post(
  '/:id/vote',
  validate(z.object({ delta: z.union([z.literal(1), z.literal(-1)]).default(1) })),
  wrap(async (req, res) => {
    const doc = await svc.vote(req.params.id, req.body.delta);
    announce('voted', req.params.id);
    ok(res, doc.toJSON());
  }),
);

itemRouter.post(
  '/:id/rate',
  validate(z.object({ score: z.coerce.number().min(1).max(5) })),
  wrap(async (req, res) => {
    const doc = await svc.rate(req.params.id, req.body.score);
    ok(res, doc.toJSON());
  }),
);
