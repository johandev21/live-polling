import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  service: z.literal('backend'),
});

export const readinessResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  checks: z.object({
    database: z.enum(['ok', 'error']),
    redis: z.enum(['ok', 'error']),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
