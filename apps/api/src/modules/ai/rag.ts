import { Schema, model } from 'mongoose';
import type { RagAnswer, RagChunk } from '@gvhax/shared';
import { jsonTransform } from '../../lib/query.js';
import { chat } from './index.js';
import { cosine, embed } from './embeddings.js';

const chunkSchema = new Schema(
  {
    corpus: { type: String, required: true, index: true },
    title: { type: String, default: null },
    text: { type: String, required: true },
    /** Empty when embeddings were unavailable — keyword retrieval still works. */
    vector: { type: [Number], default: [], select: false },
    tokens: { type: [String], default: [], select: false },
  },
  { timestamps: true, toJSON: jsonTransform },
);

export const Chunk = model('Chunk', chunkSchema);

const CHUNK_CHARS = 900;
const OVERLAP = 150;

/**
 * Split on paragraph boundaries, packing up to ~900 characters with a small
 * overlap so a fact spanning a boundary is not lost. Deliberately simple —
 * at demo corpus sizes a smarter splitter buys nothing.
 */
export function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length + 2 <= CHUNK_CHARS) {
      current = current ? `${current}\n\n${para}` : para;
      continue;
    }
    if (current) chunks.push(current);
    if (para.length <= CHUNK_CHARS) {
      current = para;
    } else {
      // A single oversized paragraph gets a sliding window.
      for (let i = 0; i < para.length; i += CHUNK_CHARS - OVERLAP) {
        chunks.push(para.slice(i, i + CHUNK_CHARS));
      }
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const tokenize = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];

export async function ingest(corpus: string, text: string, title?: string): Promise<number> {
  const pieces = chunkText(text);
  if (pieces.length === 0) return 0;

  const vectors = await embed(pieces);

  await Chunk.insertMany(
    pieces.map((piece, i) => ({
      corpus,
      title: title ?? null,
      text: piece,
      vector: vectors?.[i] ?? [],
      tokens: [...new Set(tokenize(piece))],
    })),
  );

  return pieces.length;
}

interface ScoredDoc {
  d: Record<string, unknown>;
  score: number;
}

/**
 * Retrieve top-k chunks.
 *
 * Cosine similarity over stored vectors when we have them; otherwise a small
 * IDF-weighted keyword score. Scanning the whole corpus in memory is fine at
 * hackathon scale and avoids a vector-database dependency entirely.
 */
export async function retrieve(
  corpus: string,
  question: string,
  topK: number,
): Promise<{ chunks: RagChunk[]; mode: 'embedding' | 'keyword' }> {
  const docs = await Chunk.find({ corpus }).select('+vector +tokens').lean();
  if (docs.length === 0) return { chunks: [], mode: 'keyword' };

  const haveVectors = docs.some((d) => (d.vector?.length ?? 0) > 0);

  if (haveVectors) {
    const embedded = await embed([question]);
    const qv = embedded?.[0];
    if (qv) {
      const scored: ScoredDoc[] = docs
        .map((d) => ({
          d: d as Record<string, unknown>,
          score: d.vector?.length ? cosine(qv, d.vector) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      return { chunks: scored.map(toChunk), mode: 'embedding' };
    }
  }

  // Keyword fallback: rarer query terms count for more.
  const qTokens = [...new Set(tokenize(question))];
  const df = new Map<string, number>();
  for (const t of qTokens) {
    df.set(t, docs.filter((d) => d.tokens?.includes(t)).length || 1);
  }

  const scored: ScoredDoc[] = docs
    .map((d) => {
      const set = new Set(d.tokens ?? []);
      let score = 0;
      for (const t of qTokens) {
        if (set.has(t)) score += Math.log(docs.length / (df.get(t) ?? 1)) + 1;
      }
      return { d: d as Record<string, unknown>, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return { chunks: scored.map(toChunk), mode: 'keyword' };
}

function toChunk({ d, score }: ScoredDoc): RagChunk {
  return {
    id: String(d._id),
    title: (d.title as string | null) ?? null,
    text: d.text as string,
    score: Number(score.toFixed(4)),
  };
}

/** Retrieve, then answer strictly from what was retrieved. */
export async function answer(corpus: string, question: string, topK: number): Promise<RagAnswer> {
  const { chunks, mode } = await retrieve(corpus, question, topK);

  if (chunks.length === 0) {
    return {
      answer:
        'Nothing has been ingested into this corpus yet, so there is no source material to answer from.',
      sources: [],
      retrieval: mode,
      provider: 'none',
      degraded: false,
    };
  }

  const context = chunks
    .map((c, i) => `[${i + 1}]${c.title ? ` (${c.title})` : ''}\n${c.text}`)
    .join('\n\n---\n\n');

  const res = await chat(
    [{ role: 'user', content: `Question: ${question}\n\nSources:\n\n${context}` }],
    {
      system:
        'Answer using ONLY the numbered sources provided. Cite the sources you used as [1], [2] and so on. ' +
        'If the sources do not contain the answer, say so plainly rather than guessing.',
      maxTokens: 1500,
      temperature: 0.2,
    },
  );

  return {
    answer: res.content,
    sources: chunks,
    retrieval: mode,
    provider: res.provider,
    degraded: res.degraded,
  };
}

export async function clearCorpus(corpus: string): Promise<number> {
  const { deletedCount } = await Chunk.deleteMany({ corpus });
  return deletedCount ?? 0;
}

export async function corpora() {
  return Chunk.aggregate([
    { $group: { _id: '$corpus', chunks: { $sum: 1 }, updatedAt: { $max: '$updatedAt' } } },
    { $sort: { updatedAt: -1 } },
  ]);
}
