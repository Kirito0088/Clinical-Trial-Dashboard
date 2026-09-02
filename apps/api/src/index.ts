import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { colors as C, log } from './lib/logger.js';

async function main(): Promise<void> {
  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    log.banner([
      `${C.bold}Clinical Trials Dashboard API${C.reset}  ${C.green}http://localhost:${env.PORT}${C.reset}`,
      `${C.dim}health    http://localhost:${env.PORT}/api/health${C.reset}`,
      `${C.dim}trials    http://localhost:${env.PORT}/api/trials${C.reset}`,
    ]);
  });

  // Graceful shutdown so `tsx watch` restarts don't leave the port held.
  const shutdown = (signal: string) => {
    log.info(`${signal} received, shutting down`);
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  log.error('failed to start');
  console.error(err);
  process.exit(1);
});
