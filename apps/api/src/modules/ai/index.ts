import { env } from '../../config/env.js';
import { log } from '../../lib/logger.js';
import type { AiProvider, ChatOptions, ChatMessage, ChatResult } from './provider.js';
import { GeminiProvider } from './providers/gemini.js';

// ── Inline mock provider ────────────────────────────────────────────────────

class MockProvider implements AiProvider {
  readonly name = 'mock';
  isConfigured(): boolean {
    return true;
  }
  async chat(_messages: ChatMessage[], _opts?: ChatOptions): Promise<ChatResult> {
    return { content: '(mock — no AI provider configured)', model: 'mock' };
  }
}

// ── Registry ────────────────────────────────────────────────────────────────

const registry: Record<string, AiProvider> = {
  gemini: new GeminiProvider(),
  mock: new MockProvider(),
};

export const mock = registry.mock;

/** The provider named in .env, or null when it has no credentials. */
export function selected(): AiProvider | null {
  const p = registry[env.AI_PROVIDER];
  if (!p) return null;
  return p.isConfigured() ? p : null;
}

export interface ChatResponse extends ChatResult {
  provider: string;
  degraded: boolean;
  degradedReason?: string;
}

/**
 * Chat with automatic degradation.
 *
 * If the configured provider is missing credentials or the call fails for any
 * reason — no network, bad key, rate limit, timeout — we answer from the mock
 * provider instead of surfacing a 500. The response says `degraded: true` and
 * carries the reason.
 */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResponse> {
  const provider = selected();

  if (!provider) {
    const reason =
      env.AI_PROVIDER === 'mock'
        ? 'AI_PROVIDER=mock'
        : `${env.AI_PROVIDER} has no API key configured`;
    const res = await mock.chat(messages, opts);
    return { ...res, provider: 'mock', degraded: env.AI_PROVIDER !== 'mock', degradedReason: reason };
  }

  try {
    const res = await provider.chat(messages, opts);
    return { ...res, provider: provider.name, degraded: false };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log.warn(`${provider.name} failed, falling back to mock: ${reason}`);
    const res = await mock.chat(messages, opts);
    return { ...res, provider: 'mock', degraded: true, degradedReason: `${provider.name}: ${reason}` };
  }
}

/**
 * Ask for JSON back. The model is instructed to emit only JSON, and the result
 * is defensively unwrapped.
 */
export async function extractJson<T = unknown>(
  prompt: string,
  fields: Record<string, string>,
): Promise<{ data: T | null; raw: string; provider: string; degraded: boolean }> {
  const spec = Object.entries(fields)
    .map(([k, v]) => `  "${k}": ${JSON.stringify(v)}`)
    .join(',\n');

  const res = await chat(
    [{ role: 'user', content: `Extract the requested fields from the text below.\n\nTEXT:\n${prompt}` }],
    {
      system: `You extract structured data. Reply with a single JSON object and nothing else — no prose, no code fences.\nThe value of each key describes what to extract; use null when the text does not contain it.\n\nSchema:\n{\n${spec}\n}`,
      maxTokens: 2048,
      temperature: 0,
    },
  );

  return {
    data: parseLooseJson<T>(res.content),
    raw: res.content,
    provider: res.provider,
    degraded: res.degraded,
  };
}

export function parseLooseJson<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

/** Reported on /api/health so the team can see at a glance what is live. */
export function aiStatus() {
  return {
    provider: env.AI_PROVIDER,
    configured: selected() !== null,
  };
}

export { registry };
export type { ChatMessage, ChatOptions, ChatResult, AiProvider } from './provider.js';
