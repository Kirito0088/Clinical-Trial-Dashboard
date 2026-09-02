import type { ChatMessage } from '@gvhax/shared';
import { env } from '../../../config/env.js';
import { ProviderError, postJson, type AiProvider, type ChatOptions, type ChatResult } from '../provider.js';

interface OllamaChat {
  message?: { content?: string };
  model?: string;
}
interface OllamaEmbed {
  embeddings?: number[][];
}

/**
 * Local models via Ollama. The only provider that works with no internet at
 * all, which is why it is worth keeping wired even if unused.
 */
export class OllamaProvider implements AiProvider {
  readonly name = 'ollama';

  // We cannot know if the daemon is up without a call; assume yes and let the
  // degradation path handle a refusal.
  isConfigured(): boolean {
    return Boolean(env.OLLAMA_BASE_URL);
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    try {
      const res = await postJson<OllamaChat>(
        `${env.OLLAMA_BASE_URL}/api/chat`,
        {
          model: env.OLLAMA_MODEL,
          stream: false,
          messages: opts.system ? [{ role: 'system', content: opts.system }, ...messages] : messages,
          options: { temperature: opts.temperature ?? 0.7 },
        },
        {},
        60_000, // local models on laptop CPUs are slow; be generous
      );
      return { content: (res.message?.content ?? '').trim(), model: res.model ?? env.OLLAMA_MODEL };
    } catch (err) {
      throw new ProviderError(this.name, err instanceof Error ? err.message : String(err));
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await postJson<OllamaEmbed>(
      `${env.OLLAMA_BASE_URL}/api/embed`,
      { model: env.OLLAMA_EMBED_MODEL, input: texts },
      {},
      60_000,
    );
    return res.embeddings ?? [];
  }
}
