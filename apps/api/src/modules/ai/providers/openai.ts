import type { ChatMessage } from '@gvhax/shared';
import { env } from '../../../config/env.js';
import { ProviderError, postJson, type AiProvider, type ChatOptions, type ChatResult } from '../provider.js';

interface ChatCompletion {
  model: string;
  choices: { message: { content: string | null } }[];
}
interface EmbeddingResponse {
  data: { embedding: number[] }[];
}

/** OpenAI over raw HTTP — one dependency fewer, and the surface used here is tiny. */
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';

  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  }

  private headers() {
    return { authorization: `Bearer ${env.OPENAI_API_KEY}` };
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    try {
      const payload = {
        model: env.OPENAI_MODEL,
        max_tokens: opts.maxTokens ?? 4096,
        temperature: opts.temperature ?? 0.7,
        messages: opts.system ? [{ role: 'system', content: opts.system }, ...messages] : messages,
      };
      const res = await postJson<ChatCompletion>(
        'https://api.openai.com/v1/chat/completions',
        payload,
        this.headers(),
      );
      return { content: (res.choices[0]?.message.content ?? '').trim(), model: res.model };
    } catch (err) {
      throw new ProviderError(this.name, err instanceof Error ? err.message : String(err));
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await postJson<EmbeddingResponse>(
      'https://api.openai.com/v1/embeddings',
      { model: env.OPENAI_EMBED_MODEL, input: texts },
      this.headers(),
    );
    return res.data.map((d) => d.embedding);
  }
}
