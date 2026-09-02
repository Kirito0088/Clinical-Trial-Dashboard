import 'dotenv/config';
import { z } from 'zod';

/**
 * Every value has a default. The app must boot with a completely empty .env —
 * that is what makes the offline demo path work.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  MONGO_URI: z.string().default(''),
  MONGO_LOCAL_URI: z.string().default('mongodb://127.0.0.1:27017'),
  MONGO_DB_NAME: z.string().default('gvhax'),
  MONGO_FORCE_MEMORY: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),

  JWT_SECRET: z.string().default('dev-only-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  AI_PROVIDER: z.enum(['anthropic', 'openai', 'gemini', 'ollama', 'mock']).default('mock'),
  ANTHROPIC_API_KEY: z.string().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-opus-5'),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  OLLAMA_BASE_URL: z.string().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2'),
  // Anthropic exposes no embeddings endpoint, so RAG sources vectors elsewhere.
  EMBED_PROVIDER: z.enum(['auto', 'openai', 'ollama', 'none']).default('auto'),
  OPENAI_EMBED_MODEL: z.string().default('text-embedding-3-small'),
  OLLAMA_EMBED_MODEL: z.string().default('nomic-embed-text'),

  ML_BASE_URL: z.string().default('http://127.0.0.1:8000'),
  ML_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Should be unreachable given every field has a default, but if someone
  // sets PORT=banana we want to say so loudly rather than boot half-broken.
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
