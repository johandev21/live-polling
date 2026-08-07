import { createHmac, timingSafeEqual } from 'node:crypto';

export const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MAX_DISPLAY_NAME = 40;

export type ParticipantTokenPayload = {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
};

export class InvalidParticipantTokenError extends Error {
  constructor() {
    super('Invalid participant token');
    this.name = 'InvalidParticipantTokenError';
  }
}

export class InvalidDisplayNameError extends Error {
  constructor() {
    super('Display name must be between 1 and 40 characters');
    this.name = 'InvalidDisplayNameError';
  }
}

export function normalizeDisplayName(name: string): string {
  const normalized = name.trim();
  if (normalized.length === 0 || normalized.length > MAX_DISPLAY_NAME) {
    throw new InvalidDisplayNameError();
  }
  return normalized;
}

export function encodeParticipantToken(
  payload: ParticipantTokenPayload,
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  const signature = createHmac('sha256', secret)
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
}

export function decodeParticipantToken(
  token: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1_000),
): ParticipantTokenPayload {
  const [body, signature] = token.split('.');
  if (!body || !signature) throw new InvalidParticipantTokenError();
  const expected = createHmac('sha256', secret)
    .update(body)
    .digest('base64url');
  const actual = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');
  if (
    actual.length !== expectedBuffer.length ||
    !timingSafeEqual(actual, expectedBuffer)
  ) {
    throw new InvalidParticipantTokenError();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw new InvalidParticipantTokenError();
  }
  const payload = parsed as Partial<ParticipantTokenPayload>;
  if (
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string' ||
    typeof payload.iat !== 'number' ||
    typeof payload.exp !== 'number'
  ) {
    throw new InvalidParticipantTokenError();
  }
  if (payload.exp < nowSeconds) throw new InvalidParticipantTokenError();
  return payload as ParticipantTokenPayload;
}
