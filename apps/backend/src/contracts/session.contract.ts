import { z } from 'zod';
import { SESSION_STATUSES } from '../sessions/session.domain';

export const sessionStatusSchema = z.enum(SESSION_STATUSES);

export const sessionNameSchema = z.string().trim().min(1).max(120);

export const uuidSchema = z.string().uuid();

export const sessionIdSchema = uuidSchema;

export const createSessionRequestSchema = z.object({
  name: sessionNameSchema,
});

export const updateSessionRequestSchema = createSessionRequestSchema;

export const deleteSessionRequestSchema = z.object({
  confirm: z.boolean(),
});

export const sessionSnapshotSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  roomCode: z.string(),
  status: sessionStatusSchema,
  revision: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
  startedAt: z.date().nullable(),
  endedAt: z.date().nullable(),
  pollCount: z.number().int().nonnegative().optional(),
  participantCount: z.number().int().nonnegative().optional(),
});

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionSnapshotSchema),
});

export const invitationLinkResponseSchema = z.object({
  roomCode: z.string(),
  url: z.string().url(),
});

export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;
