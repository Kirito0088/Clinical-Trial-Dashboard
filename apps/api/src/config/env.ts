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

  // Supabase Postgres via Prisma
  DATABASE_URL: z.string().default(''),
  DIRECT_URL: z.string().default(''),

  // AI provider — only gemini is supported; falls back to no-op
  AI_PROVIDER: z.enum(['gemini', 'mock']).default('gemini'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
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
