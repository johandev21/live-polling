export const MAX_OPEN_RESPONSE_TEXT = 500;
export const MAX_IDEMPOTENCY_KEY_LENGTH = 64;

export class InvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}

export type ChoicePollShape = {
  type: 'single_choice' | 'multiple_choice';
  maxSelections: number | null;
};

export function normalizeOpenText(text: string | undefined): string {
  if (text === undefined) {
    throw new InvalidResponseError('open-ended responses require text');
  }
  const normalized = text.trim();
  if (normalized.length === 0 || normalized.length > MAX_OPEN_RESPONSE_TEXT) {
    throw new InvalidResponseError(
      `open-ended response text must be between 1 and ${MAX_OPEN_RESPONSE_TEXT} characters`,
    );
  }
  return normalized;
}

export function normalizeIdempotencyKey(key: string): string {
  const normalized = key.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    throw new InvalidResponseError('idempotencyKey is required');
  }
  return normalized;
}

export function validateChoiceSelection(
  optionIds: string[] | undefined,
  poll: ChoicePollShape,
  validOptionIds: readonly string[],
): string[] {
  if (optionIds === undefined) {
    throw new InvalidResponseError('choice responses require optionIds');
  }
  const unique = new Set(optionIds);
  if (unique.size !== optionIds.length) {
    throw new InvalidResponseError('optionIds must be unique');
  }
  const valid = new Set(validOptionIds);
  if (optionIds.some((optionId) => !valid.has(optionId))) {
    throw new InvalidResponseError(
      'optionIds must reference options belonging to the poll',
    );
  }
  if (poll.type === 'single_choice') {
    if (optionIds.length !== 1) {
      throw new InvalidResponseError(
        'single-choice responses select exactly one option',
      );
    }
    return optionIds;
  }
  const limit = poll.maxSelections ?? validOptionIds.length;
  if (optionIds.length < 1 || optionIds.length > limit) {
    throw new InvalidResponseError(
      `multiple-choice responses select between 1 and ${limit} options`,
    );
  }
  return optionIds;
}

export function canSubmit(
  sessionStatus: 'draft' | 'live' | 'ended',
  pollIsOpen: boolean,
): { allowed: boolean; reason?: 'session' | 'poll' } {
  if (sessionStatus !== 'live') return { allowed: false, reason: 'session' };
  if (!pollIsOpen) return { allowed: false, reason: 'poll' };
  return { allowed: true };
}
