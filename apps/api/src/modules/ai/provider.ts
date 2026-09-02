export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResult {
  content: string;
  model: string;
}

/**
 * The one interface every backend implements. Routes depend on this, never on
 * a specific vendor — which is what makes the automatic fall back to `mock`
 * possible without touching call sites.
 */
export interface AiProvider {
  readonly name: string;
  /** False when the provider has no usable credentials, so we skip it early. */
  isConfigured(): boolean;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/** Shared fetch with a hard timeout — a hung provider must not hang the request. */
export async function postJson<T>(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  timeoutMs = 30_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
