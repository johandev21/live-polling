import { z } from 'zod';
import { MAX_DISPLAY_NAME } from '../participants/participant.domain';
import { sessionStatusSchema, uuidSchema } from './session.contract';

export const displayNameSchema = z.string().trim().min(1).max(MAX_DISPLAY_NAME);

export const joinRequestSchema = z
  .object({
    roomCode: z.string().trim().min(1).max(20).optional(),
    invitationUrl: z.string().url().optional(),
    displayName: displayNameSchema,
    token: z.string().nullable().optional(),
  })
  .refine(
    (value) =>
      value.roomCode !== undefined || value.invitationUrl !== undefined,
    { message: 'roomCode or invitationUrl is required' },
  );

export const participantSnapshotSchema = z.object({
  id: uuidSchema,
  sessionId: uuidSchema,
  displayName: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const participantPollSnapshotSchema = z.object({
  id: uuidSchema,
  text: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'open_ended']),
  position: z.number().int().nonnegative(),
  maxSelections: z.number().int().nonnegative().nullable(),
  options: z.array(
    z.object({
      id: uuidSchema,
      text: z.string(),
      position: z.number().int().nonnegative(),
    }),
  ),
  isOpen: z.boolean(),
  resultsRevealed: z.boolean(),
});

export const participantSessionSnapshotSchema = z.object({
  session: z.object({
    id: uuidSchema,
    name: z.string(),
    status: sessionStatusSchema,
    revision: z.number().int().positive(),
    startedAt: z.date().nullable(),
    endedAt: z.date().nullable(),
  }),
  polls: z.array(participantPollSnapshotSchema),
});

export const joinResponseSchema = z.object({
  token: z.string(),
  participant: participantSnapshotSchema,
  snapshot: participantSessionSnapshotSchema,
});

export const updateDisplayNameRequestSchema = z.object({
  displayName: displayNameSchema,
});

export type ParticipantSnapshot = z.infer<typeof participantSnapshotSchema>;
export type ParticipantSessionSnapshot = z.infer<
  typeof participantSessionSnapshotSchema
>;
export type JoinResponse = z.infer<typeof joinResponseSchema>;
