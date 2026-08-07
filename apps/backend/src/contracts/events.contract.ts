import { z } from 'zod';
import { participantPollSnapshotSchema } from './participant.contract';
import { pollSnapshotSchema } from './poll.contract';
import {
  hostResultsSchema,
  participantResultsSchema,
} from './response.contract';
import {
  sessionIdSchema,
  sessionSnapshotSchema,
  sessionStatusSchema,
  uuidSchema,
} from './session.contract';

export const REALTIME_EVENTS = {
  SESSION_UPDATED: 'session.updated',
  SESSION_DELETED: 'session.deleted',
  POLL_CREATED: 'poll.created',
  POLL_UPDATED: 'poll.updated',
  POLL_DELETED: 'poll.deleted',
  POLL_REORDERED: 'poll.reordered',
  POLL_OPENED: 'poll.opened',
  POLL_CLOSED: 'poll.closed',
  RESULTS_REVEALED: 'results.revealed',
  RESULTS_HIDDEN: 'results.hidden',
  RESPONSE_ACCEPTED: 'response.accepted',
  PRESENCE_UPDATED: 'presence.updated',
  RESYNC_REQUESTED: 'resync.requested',
  AUTH_ERROR: 'auth.error',
} as const;

export const sessionRevisionSchema = z.number().int().positive();

const baseEventSchema = z.object({
  sessionId: sessionIdSchema,
  revision: sessionRevisionSchema,
});

export const hostSessionEventSchema = baseEventSchema.extend({
  session: sessionSnapshotSchema,
});

export const participantSessionEventSchema = baseEventSchema.extend({
  session: z.object({
    id: uuidSchema,
    name: z.string(),
    status: sessionStatusSchema,
    revision: sessionRevisionSchema,
    startedAt: z.date().nullable(),
    endedAt: z.date().nullable(),
  }),
});

export const sessionDeletedEventSchema = baseEventSchema;

export const hostPollEventSchema = baseEventSchema.extend({
  poll: pollSnapshotSchema,
});

export const participantPollEventSchema = baseEventSchema.extend({
  poll: participantPollSnapshotSchema,
});

export const pollDeletedEventSchema = baseEventSchema.extend({
  pollId: uuidSchema,
});

export const pollReorderedEventSchema = baseEventSchema.extend({
  pollIds: z.array(uuidSchema),
});

export const resultsVisibilityEventSchema = baseEventSchema.extend({
  pollId: uuidSchema,
});

export const hostResponseEventSchema = baseEventSchema.extend({
  pollId: uuidSchema,
  results: hostResultsSchema,
});

export const participantResponseEventSchema = baseEventSchema.extend({
  pollId: uuidSchema,
  results: participantResultsSchema.nullable(),
});

export const hostPresenceEventSchema = baseEventSchema.extend({
  count: z.number().int().nonnegative(),
  participants: z.array(
    z.object({
      participantId: uuidSchema,
      displayName: z.string(),
    }),
  ),
});

export const participantPresenceEventSchema = baseEventSchema.extend({
  count: z.number().int().nonnegative(),
});

export const resyncRequestSchema = z.object({
  sessionId: sessionIdSchema,
  revision: sessionRevisionSchema,
});

export const socketAuthErrorSchema = z.object({
  code: z.string(),
});
