import { env } from '../../config/env.js';
import { log } from '../../lib/logger.js';
import { registry } from './index.js';

export type EmbedSource = 'openai' | 'ollama' | 'mock' | 'none';

/**
 * Pick an embedding backend.
 *
 * Anthropic exposes no embeddings endpoint, so even with AI_PROVIDER=anthropic
 * the vectors have to come from somewhere else. Order: whatever EMBED_PROVIDER
 * names, else OpenAI if keyed, else the mock's hashed vectors.
 */
export function embedSource(): EmbedSource {
  if (env.EMBED_PROVIDER === 'none') return 'none';
  if (env.EMBED_PROVIDER === 'openai') return env.OPENAI_API_KEY ? 'openai' : 'none';
  if (env.EMBED_PROVIDER === 'ollama') return 'ollama';
  // auto
  if (env.OPENAI_API_KEY) return 'openai';
  return 'mock';
}

/**
 * Embed a batch. Returns null when embeddings are unavailable, which is the
 * signal for the RAG layer to use keyword retrieval instead — a degraded
 * search beats a broken one.
 */
export async function embed(texts: string[]): Promise<number[][] | null> {
  const source = embedSource();
  if (source === 'none' || texts.length === 0) return null;

  const provider = registry[source];
  if (!provider?.embed) return null;

  try {
    return await provider.embed(texts);
  } catch (err) {
    log.warn(`embedding via ${source} failed: ${String(err)}`);
    // Hashed vectors keep the pipeline running rather than dropping to keyword.
    if (source === 'mock') return null;
    const fallback = registry.mock.embed;
    return fallback ? await fallback.call(registry.mock, texts) : null;
  }
}

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
