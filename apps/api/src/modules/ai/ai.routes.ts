import { Router } from 'express';
import { z } from 'zod';
import {
  chatRequestSchema,
  extractRequestSchema,
  ragIngestSchema,
  ragQuerySchema,
} from '@gvhax/shared';
import { validate } from '../../middleware/validate.js';
import { ok, wrap } from '../../lib/http.js';
import { aiStatus, chat, extractJson } from './index.js';
import * as rag from './rag.js';

export const aiRouter: Router = Router();

/** Shows which provider is live and whether it will degrade. Handy on stage. */
aiRouter.get('/status', (_req, res) => ok(res, aiStatus()));

aiRouter.post(
  '/chat',
  validate(chatRequestSchema),
  wrap(async (req, res) => {
    const { messages, system, temperature, maxTokens } = req.body;
    ok(res, await chat(messages, { system, temperature, maxTokens }));
  }),
);

/** Pull named fields out of free text — OCR post-processing, form autofill. */
aiRouter.post(
  '/extract',
  validate(extractRequestSchema),
  wrap(async (req, res) => {
    ok(res, await extractJson(req.body.text, req.body.fields));
  }),
);

/** Generate a quiz from any text — the LMS statements need exactly this. */
aiRouter.post(
  '/quiz',
  validate(z.object({ text: z.string().min(1), count: z.coerce.number().min(1).max(10).default(5) })),
  wrap(async (req, res) => {
    const { text, count } = req.body;
    const result = await chat(
      [{ role: 'user', content: `Create a ${count}-question quiz from this text:\n\n${text}` }],
      {
        system:
          'You write multiple-choice quizzes. Reply with only a JSON object of the form ' +
          '{"questions":[{"id":1,"question":"...","options":["a","b","c","d"],"answerIndex":0}]}. ' +
          'No prose, no code fences.',
        temperature: 0.4,
        maxTokens: 2048,
      },
    );
    const { parseLooseJson } = await import('./index.js');
    ok(res, {
      quiz: parseLooseJson(result.content),
      raw: result.content,
      provider: result.provider,
      degraded: result.degraded,
    });
  }),
);

// ── RAG ──────────────────────────────────────────────────────────────────

aiRouter.get('/rag/corpora', wrap(async (_req, res) => ok(res, await rag.corpora())));

aiRouter.post(
  '/rag/ingest',
  validate(ragIngestSchema),
  wrap(async (req, res) => {
    const { corpus, text, title } = req.body;
    const chunks = await rag.ingest(corpus, text, title);
    res.status(201);
    ok(res, { corpus, chunks });
  }),
);

aiRouter.post(
  '/rag/query',
  validate(ragQuerySchema),
  wrap(async (req, res) => {
    const { corpus, question, topK } = req.body;
    ok(res, await rag.answer(corpus, question, topK));
  }),
);

/** Retrieval only, no generation — useful for tuning chunking during the sprint. */
aiRouter.post(
  '/rag/search',
  validate(ragQuerySchema),
  wrap(async (req, res) => {
    const { corpus, question, topK } = req.body;
    ok(res, await rag.retrieve(corpus, question, topK));
  }),
);

aiRouter.delete(
  '/rag/:corpus',
  wrap(async (req, res) => {
    ok(res, { deleted: await rag.clearCorpus(req.params.corpus) });
  }),
);
