import { z } from 'zod';

export const chatRoleSchema = z.enum(['system', 'user', 'assistant']);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  system: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  content: z.string(),
  /** Which adapter actually served this. "mock" means we degraded. */
  provider: z.string(),
  model: z.string(),
  degraded: z.boolean(),
  /** Populated when we degraded, so the UI can show why. */
  degradedReason: z.string().optional(),
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;

/** Ingest arbitrary text into the RAG corpus. */
export const ragIngestSchema = z.object({
  corpus: z.string().trim().min(1).max(60).default('default'),
  title: z.string().trim().max(200).optional(),
  text: z.string().min(1),
});
export type RagIngestInput = z.infer<typeof ragIngestSchema>;

export const ragQuerySchema = z.object({
  corpus: z.string().trim().min(1).max(60).default('default'),
  question: z.string().trim().min(1),
  topK: z.number().int().min(1).max(20).default(4),
});
export type RagQueryInput = z.infer<typeof ragQuerySchema>;

export const ragChunkSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  text: z.string(),
  score: z.number(),
});
export type RagChunk = z.infer<typeof ragChunkSchema>;

export const ragAnswerSchema = z.object({
  answer: z.string(),
  sources: z.array(ragChunkSchema),
  /** "embedding" when vectors were available, "keyword" for the offline fallback. */
  retrieval: z.enum(['embedding', 'keyword']),
  provider: z.string(),
  degraded: z.boolean(),
});
export type RagAnswer = z.infer<typeof ragAnswerSchema>;

/** Ask the model to pull structured fields out of free text. */
export const extractRequestSchema = z.object({
  text: z.string().min(1),
  /** Field name -> plain-English description of what to pull out. */
  fields: z.record(z.string(), z.string()),
});
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
