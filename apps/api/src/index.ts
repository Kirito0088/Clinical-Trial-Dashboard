import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './db/connect.js';
import { closeSocket, initSocket } from './realtime/socket.js';
import { colors as C, log } from './lib/logger.js';

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();
  const server = createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    log.banner([
      `${C.bold}GVHAX API${C.reset}  ${C.green}http://localhost:${env.PORT}${C.reset}`,
      `${C.dim}health    http://localhost:${env.PORT}/api/health${C.reset}`,
    ]);
  });

  // Graceful shutdown so `tsx watch` restarts don't leave the port held or an
  // in-memory mongod orphaned.
  const shutdown = async (signal: string) => {
    log.info(`${signal} received, shutting down`);
    closeSocket();
    server.close();
    await disconnectDb();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  log.error('failed to start');
  console.error(err);
  process.exit(1);
});
