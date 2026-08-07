import { z } from 'zod';
import { MAX_OPEN_RESPONSE_TEXT } from '../responses/response.domain';
import { uuidSchema } from './session.contract';

export const submitResponseRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(64),
  optionIds: z.array(uuidSchema).min(1).max(10).optional(),
  text: z.string().trim().min(1).max(MAX_OPEN_RESPONSE_TEXT).optional(),
});

export const responseSnapshotSchema = z.object({
  id: uuidSchema,
  pollId: uuidSchema,
  participantId: uuidSchema,
  optionIds: z.array(uuidSchema),
  text: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const participantResultsSchema = z.object({
  pollId: uuidSchema,
  total: z.number().int().nonnegative(),
  counts: z.array(
    z.object({
      optionId: uuidSchema,
      count: z.number().int().nonnegative(),
      percentage: z.number().nonnegative(),
    }),
  ),
});

export const hostResultsSchema = z.object({
  pollId: uuidSchema,
  total: z.number().int().nonnegative(),
  counts: z.array(
    z.object({
      optionId: uuidSchema,
      text: z.string(),
      count: z.number().int().nonnegative(),
      percentage: z.number().nonnegative(),
    }),
  ),
  responses: z.array(
    z.object({
      id: uuidSchema,
      text: z.string(),
      createdAt: z.date(),
    }),
  ),
});

export type ResponseSnapshot = z.infer<typeof responseSnapshotSchema>;
export type ParticipantResults = z.infer<typeof participantResultsSchema>;
export type HostResults = z.infer<typeof hostResultsSchema>;
