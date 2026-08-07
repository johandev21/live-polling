import { z } from 'zod';
import { POLL_TYPES } from '../polls/poll.domain';
import {
  MAX_MAX_SELECTIONS,
  MAX_OPTION_TEXT,
  MAX_POLL_OPTIONS,
  MAX_POLL_TEXT,
  MIN_MAX_SELECTIONS,
  MIN_POLL_OPTIONS,
} from '../polls/poll.domain';
import { uuidSchema } from './session.contract';

export const pollTypeSchema = z.enum(POLL_TYPES);

export const pollTextSchema = z.string().trim().min(1).max(MAX_POLL_TEXT);

export const pollOptionSchema = z.string().trim().min(1).max(MAX_OPTION_TEXT);

export const pollOptionsSchema = z
  .array(pollOptionSchema)
  .min(MIN_POLL_OPTIONS)
  .max(MAX_POLL_OPTIONS);

export const maxSelectionsSchema = z
  .number()
  .int()
  .min(MIN_MAX_SELECTIONS)
  .max(MAX_MAX_SELECTIONS)
  .nullable()
  .optional();

export const createPollRequestSchema = z.object({
  type: pollTypeSchema,
  text: pollTextSchema,
  options: pollOptionsSchema.optional(),
  maxSelections: maxSelectionsSchema,
});

export const updatePollRequestSchema = z.object({
  text: pollTextSchema,
  options: pollOptionsSchema.optional(),
  maxSelections: maxSelectionsSchema,
});

export const reorderPollsRequestSchema = z.object({
  pollIds: z.array(uuidSchema).min(1),
});

export const pollOptionSnapshotSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  position: z.number().int().nonnegative(),
});

export const pollSnapshotSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  text: z.string(),
  type: pollTypeSchema,
  position: z.number().int().nonnegative(),
  maxSelections: z.number().int().nonnegative().nullable(),
  isOpen: z.boolean(),
  resultsRevealed: z.boolean(),
  hasResponses: z.boolean(),
  options: z.array(pollOptionSnapshotSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const pollListResponseSchema = z.object({
  polls: z.array(pollSnapshotSchema),
});

export type PollSnapshot = z.infer<typeof pollSnapshotSchema>;
