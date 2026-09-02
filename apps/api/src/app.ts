import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, env, isTest } from './config/env.js';
import { getDbStatus } from './db/connect.js';
import { attachUser } from './middleware/auth.js';
import { auditLogger } from './middleware/audit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { ok } from './lib/http.js';
import { aiStatus } from './modules/ai/index.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { ingestRouter } from './modules/ingest/ingest.routes.js';
import { itemRouter } from './modules/items/item.routes.js';
import { mlRouter } from './modules/ml/ml.routes.js';
import { reportRouter } from './modules/report/report.routes.js';

/**
 * Built separately from the listener so tests can mount the app with supertest
 * without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  // crossOriginResourcePolicy is relaxed so the Vite dev server on :5173 can
  // display images served from GridFS on :4000.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '50mb' })); // CSV ingest posts parsed rows
  app.use(express.urlencoded({ extended: true }));
  if (!isTest) app.use(morgan('dev'));

  app.use(attachUser);
  app.use(auditLogger);

  app.get('/api/health', (_req, res) => {
    const db = getDbStatus();
    ok(res, {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      env: env.NODE_ENV,
      db: db ? { tier: db.tier, notes: db.notes } : { tier: 'disconnected', notes: [] },
      ai: aiStatus(),
      ml: { enabled: env.ML_ENABLED, baseUrl: env.ML_BASE_URL },
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/items', itemRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/datasets', ingestRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/ml', mlRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
