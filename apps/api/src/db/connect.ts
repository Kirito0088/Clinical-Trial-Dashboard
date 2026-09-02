import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { colors as C, log } from '../lib/logger.js';

export type DbTier = 'atlas' | 'local' | 'memory';

export interface DbStatus {
  tier: DbTier;
  uri: string;
  /** Why the higher tiers were skipped. Surfaced on /api/health. */
  notes: string[];
}

let status: DbStatus | null = null;
/** Held so we can stop it cleanly on shutdown. Typed loosely to avoid a hard import. */
let memoryServer: { stop: () => Promise<boolean> } | null = null;

export const getDbStatus = (): DbStatus | null => status;

/**
 * Connect to MongoDB, degrading through three tiers:
 *
 *   1. `MONGO_URI`        — a hosted cluster (Atlas). Shared across the team.
 *   2. `MONGO_LOCAL_URI`  — a mongod installed on this machine. Offline-capable.
 *   3. mongodb-memory-server — in-process, zero-install, ephemeral.
 *
 * Tier 3 means the app *always* starts. That matters most during judging,
 * where a dropped Wi-Fi connection would otherwise take the whole demo down.
 * The tradeoff is that tier 3 loses data on restart, which is why the startup
 * banner states loudly which tier actually won.
 */
export async function connectDb(): Promise<DbStatus> {
  if (status) return status;

  const notes: string[] = [];
  mongoose.set('strictQuery', true);

  const attempt = async (uri: string, tier: DbTier): Promise<DbStatus | null> => {
    try {
      await mongoose.connect(uri, {
        dbName: env.MONGO_DB_NAME,
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      return { tier, uri, notes };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notes.push(`${tier}: ${msg.split('\n')[0]}`);
      // Reset the connection object so the next attempt starts clean.
      await mongoose.disconnect().catch(() => {});
      return null;
    }
  };

  if (env.MONGO_FORCE_MEMORY) {
    notes.push('MONGO_FORCE_MEMORY=true — skipped atlas and local');
  } else {
    if (env.MONGO_URI) {
      const s = await attempt(env.MONGO_URI, 'atlas');
      if (s) return finish(s);
    } else {
      notes.push('atlas: MONGO_URI not set');
    }

    const s = await attempt(env.MONGO_LOCAL_URI, 'local');
    if (s) return finish(s);
  }

  // Tier 3. The binary is downloaded on first use and cached — pre-warm this
  // before the event (see docs/HACKATHON-PREP.md), it is slow on a cold cache.
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mem = await MongoMemoryServer.create({ instance: { dbName: env.MONGO_DB_NAME } });
  memoryServer = mem;
  const uri = mem.getUri();
  await mongoose.connect(uri, { dbName: env.MONGO_DB_NAME });
  return finish({ tier: 'memory', uri, notes });

  function finish(s: DbStatus): DbStatus {
    status = s;
    announce(s);
    return s;
  }
}

function announce(s: DbStatus) {
  const label: Record<DbTier, string> = {
    atlas: `${C.green}ATLAS${C.reset}     hosted cluster — data is shared and persistent`,
    local: `${C.green}LOCAL${C.reset}     mongod on this machine — persistent, offline-safe`,
    memory: `${C.yellow}IN-MEMORY${C.reset} ephemeral — ${C.yellow}data is lost on restart${C.reset}`,
  };
  const lines = [`${C.bold}MongoDB${C.reset}  ${label[s.tier]}`];
  for (const n of s.notes) lines.push(`${C.dim}  skipped ${n}${C.reset}`);
  if (s.tier === 'memory') {
    lines.push(`${C.dim}  run \`npm run seed\` to repopulate demo data${C.reset}`);
  }
  log.banner(lines);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) {
    await memoryServer.stop().catch(() => {});
    memoryServer = null;
  }
  status = null;
}
