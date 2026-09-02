import type { Server as HttpServer } from 'node:http';
import { Server as IOServer } from 'socket.io';
import { SOCKET_EVENTS } from '@gvhax/shared';
import { corsOrigins } from '../config/env.js';
import { log } from '../lib/logger.js';

let io: IOServer | null = null;
let ticker: NodeJS.Timeout | null = null;

/**
 * Room-per-resource model: a client sends `subscribe` with a room name
 * ("items", "queue", "metrics") and receives only that room's events.
 * Keeps the live-queue and live-dashboard statements to a few lines each.
 */
export function initSocket(server: HttpServer): IOServer {
  io = new IOServer(server, { cors: { origin: corsOrigins, credentials: true } });

  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.SUBSCRIBE, (room: unknown) => {
      if (typeof room === 'string' && room.length < 64) void socket.join(room);
    });
    socket.on(SOCKET_EVENTS.UNSUBSCRIBE, (room: unknown) => {
      if (typeof room === 'string') void socket.leave(room);
    });
  });

  // A synthetic metric heartbeat so live charts have something to show before
  // any real data source exists. Harmless to leave on; delete when you wire
  // a real stream.
  ticker = setInterval(() => {
    io?.to('metrics').emit(SOCKET_EVENTS.METRIC_TICK, {
      at: new Date().toISOString(),
      value: Number((50 + Math.sin(Date.now() / 8000) * 25 + Math.random() * 8).toFixed(2)),
    });
  }, 2000);
  ticker.unref();

  log.ok('socket.io ready');
  return io;
}

/** Emit into a room. Safe to call before the server is up — it just no-ops. */
export function emit(room: string, event: string, payload: unknown): void {
  io?.to(room).emit(event, payload);
}

export function closeSocket(): void {
  if (ticker) clearInterval(ticker);
  io?.close();
  io = null;
}
