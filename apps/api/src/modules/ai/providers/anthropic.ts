import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '@gvhax/shared';
import { env } from '../../../config/env.js';
import { ProviderError, type AiProvider, type ChatOptions, type ChatResult } from '../provider.js';

/**
 * Anthropic via the official SDK.
 *
 * Notes that are easy to get wrong and cost time mid-sprint:
 *  - `response.content` is a discriminated union; narrow on `type === 'text'`
 *    before reading `.text`.
 *  - Current models use adaptive thinking. `budget_tokens` is rejected.
 *  - There is no embeddings endpoint here — see `embeddings.ts`.
 */
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private client: Anthropic | null = null;

  isConfigured(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY);
  }

  private get sdk(): Anthropic {
    this.client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    // The API takes the system prompt as a top-level field, not a message.
    const system = [opts.system, ...messages.filter((m) => m.role === 'system').map((m) => m.content)]
      .filter(Boolean)
      .join('\n\n');

    const turns = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const res = await this.sdk.messages.create({
        model: env.ANTHROPIC_MODEL,
        max_tokens: opts.maxTokens ?? 4096,
        ...(system ? { system } : {}),
        messages: turns,
      });

      const content = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      return { content, model: res.model };
    } catch (err) {
      throw new ProviderError(this.name, err instanceof Error ? err.message : String(err));
    }
  }
}
