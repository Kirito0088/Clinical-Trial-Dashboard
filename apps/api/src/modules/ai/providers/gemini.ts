import type { ChatMessage } from '../provider.js';
import { env } from '../../../config/env.js';
import { ProviderError, postJson, type AiProvider, type ChatOptions, type ChatResult } from '../provider.js';

interface GenerateResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';

  isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY);
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    try {
      // Gemini calls the assistant role "model" and takes the system prompt
      // in its own `systemInstruction` field.
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
      const res = await postJson<GenerateResponse>(
        url,
        {
          contents,
          ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
          generationConfig: {
            maxOutputTokens: opts.maxTokens ?? 4096,
            temperature: opts.temperature ?? 0.7,
          },
        },
        {},
      );

      const content = (res.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? '')
        .join('')
        .trim();
      return { content, model: env.GEMINI_MODEL };
    } catch (err) {
      throw new ProviderError(this.name, err instanceof Error ? err.message : String(err));
    }
  }
}
