import { z } from 'zod';

export const healthCheckSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  env: z.string(),
  db: z.object({
    connected: z.boolean(),
  }),
  ai: z.object({
    provider: z.string(),
    configured: z.boolean(),
  }),
});
export type HealthCheck = z.infer<typeof healthCheckSchema>;
