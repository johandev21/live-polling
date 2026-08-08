import { z } from 'zod';

export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  HOST_EMAIL_NOT_VERIFIED: 'HOST_EMAIL_NOT_VERIFIED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_DRAFT: 'SESSION_DRAFT',
  SESSION_ENDED: 'SESSION_ENDED',
  POLL_NOT_FOUND: 'POLL_NOT_FOUND',
  POLL_LOCKED: 'POLL_LOCKED',
  CLOSED_POLL: 'CLOSED_POLL',
  RESULTS_NOT_REVEALED: 'RESULTS_NOT_REVEALED',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  CONFIRMATION_REQUIRED: 'CONFIRMATION_REQUIRED',
  NO_POLLS: 'NO_POLLS',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string().optional(),
});

export const sessionStatusSchema = z.enum(['draft', 'live', 'ended']);

export const sessionSnapshotSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  roomCode: z.string(),
  status: sessionStatusSchema,
  revision: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  startedAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  pollCount: z.number().int().nonnegative().optional(),
  participantCount: z.number().int().nonnegative().optional(),
});

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionSnapshotSchema),
});

export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;

export const pollOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  position: z.number().int(),
});

export const pollSnapshotSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  text: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'open_ended']),
  position: z.number().int(),
  maxSelections: z.number().int().nullable(),
  isOpen: z.boolean(),
  resultsRevealed: z.boolean(),
  hasResponses: z.boolean(),
  options: z.array(pollOptionSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const pollListResponseSchema = z.object({
  polls: z.array(pollSnapshotSchema),
});

export type PollSnapshot = z.infer<typeof pollSnapshotSchema>;

export const participantSnapshotSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  displayName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ParticipantSnapshot = z.infer<typeof participantSnapshotSchema>;

export const participantPollSnapshotSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'open_ended']),
  position: z.number().int().nonnegative(),
  maxSelections: z.number().int().nonnegative().nullable(),
  options: z.array(
    z.object({
      id: z.string().uuid(),
      text: z.string(),
      position: z.number().int().nonnegative(),
    }),
  ),
  isOpen: z.boolean(),
  resultsRevealed: z.boolean(),
});

export type ParticipantPollSnapshot = z.infer<
  typeof participantPollSnapshotSchema
>;

export const participantResponseSchema = z.object({
  id: z.string().uuid(),
  pollId: z.string().uuid(),
  participantId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()).optional(),
  text: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ParticipantResponseSnapshot = z.infer<typeof participantResponseSchema>;

export const participantResultsSchema = z.object({
  pollId: z.string().uuid(),
  total: z.number().int().nonnegative(),
  counts: z.array(
    z.object({
      optionId: z.string().uuid(),
      count: z.number().int().nonnegative(),
      percentage: z.number().nonnegative(),
    }),
  ),
});

export type ParticipantResults = z.infer<typeof participantResultsSchema>;

export const participantSessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: sessionStatusSchema,
  revision: z.number().int().positive(),
  startedAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
});

export type ParticipantSession = z.infer<typeof participantSessionSchema>;

export const participantSessionResponseSchema = z.object({
  session: participantSessionSchema,
  displayName: z.string(),
  polls: z.array(participantPollSnapshotSchema),
  myResponse: participantResponseSchema.nullable(),
  participantCount: z.number().int().nonnegative(),
});

export type ParticipantSessionResponse = z.infer<
  typeof participantSessionResponseSchema
>;

export const joinResponseSchema = z.object({
  token: z.string(),
  participant: participantSnapshotSchema,
  snapshot: participantSessionResponseSchema,
});

export type JoinResponse = z.infer<typeof joinResponseSchema>;

export const hostResultsSchema = z.object({
  pollId: z.string().uuid(),
  total: z.number().int().nonnegative(),
  counts: z.array(
    z.object({
      optionId: z.string().uuid(),
      text: z.string(),
      count: z.number().int().nonnegative(),
      percentage: z.number().nonnegative(),
    }),
  ),
  responses: z.array(
    z.object({
      id: z.string().uuid(),
      text: z.string(),
      createdAt: z.coerce.date(),
    }),
  ),
});

export type HostResults = z.infer<typeof hostResultsSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

export const authSessionSchema = z.object({
  user: authUserSchema.nullable(),
  session: z
    .object({
      id: z.string(),
      userId: z.string(),
      expiresAt: z.coerce.date(),
    })
    .nullable(),
});

export type AuthSessionResponse = z.infer<typeof authSessionSchema>;
