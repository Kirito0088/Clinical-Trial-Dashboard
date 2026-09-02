import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient singleton.
 *
 * In development `tsx watch` restarts the module on every save. Without this
 * guard each restart leaks a connection. The globalThis trick is the standard
 * Prisma recommendation.
 */

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
