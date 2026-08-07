export const POLL_TYPES = [
  'single_choice',
  'multiple_choice',
  'open_ended',
] as const;

export type PollType = (typeof POLL_TYPES)[number];

export const MIN_POLL_TEXT = 1;
export const MAX_POLL_TEXT = 500;
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 10;
export const MAX_OPTION_TEXT = 120;
export const MIN_MAX_SELECTIONS = 2;
export const MAX_MAX_SELECTIONS = 10;

export class InvalidPollError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPollError';
  }
}

export function normalizeOptions(options: readonly string[]): string[] {
  return options.map((option) => option.trim());
}

export function validateOptions(options: readonly string[]): string[] {
  if (options.length < MIN_POLL_OPTIONS || options.length > MAX_POLL_OPTIONS) {
    throw new InvalidPollError(
      `options must contain between ${MIN_POLL_OPTIONS} and ${MAX_POLL_OPTIONS} items`,
    );
  }
  const normalized = normalizeOptions(options);
  if (normalized.some((option) => option.length === 0)) {
    throw new InvalidPollError('options must not be empty');
  }
  if (normalized.some((option) => option.length > MAX_OPTION_TEXT)) {
    throw new InvalidPollError(
      `option text must be at most ${MAX_OPTION_TEXT} characters`,
    );
  }
  const unique = new Set(normalized.map((option) => option.toLowerCase()));
  if (unique.size !== normalized.length) {
    throw new InvalidPollError('options must be unique');
  }
  return normalized;
}

export function validateMaxSelections(
  maxSelections: number | null | undefined,
  options: readonly string[],
): number | null {
  if (maxSelections === null || maxSelections === undefined) return null;
  if (
    maxSelections < MIN_MAX_SELECTIONS ||
    maxSelections > MAX_MAX_SELECTIONS
  ) {
    throw new InvalidPollError(
      `maxSelections must be between ${MIN_MAX_SELECTIONS} and ${MAX_MAX_SELECTIONS}`,
    );
  }
  if (maxSelections > options.length) {
    throw new InvalidPollError(
      'maxSelections cannot exceed the number of options',
    );
  }
  return maxSelections;
}

export function normalizePollInput(
  type: PollType,
  text: string,
  options: readonly string[] | undefined,
  maxSelections: number | null | undefined,
): { text: string; options: string[]; maxSelections: number | null } {
  const normalizedText = text.trim();
  if (
    normalizedText.length < MIN_POLL_TEXT ||
    normalizedText.length > MAX_POLL_TEXT
  ) {
    throw new InvalidPollError(
      `poll text must be between ${MIN_POLL_TEXT} and ${MAX_POLL_TEXT} characters`,
    );
  }
  if (type === 'open_ended') {
    if (options !== undefined && options.length > 0) {
      throw new InvalidPollError('open-ended polls cannot have options');
    }
    if (maxSelections !== null && maxSelections !== undefined) {
      throw new InvalidPollError('open-ended polls cannot have maxSelections');
    }
    return { text: normalizedText, options: [], maxSelections: null };
  }
  if (options === undefined) {
    throw new InvalidPollError('choice polls require options');
  }
  const normalizedOptions = validateOptions(options);
  if (type === 'single_choice') {
    if (maxSelections !== null && maxSelections !== undefined) {
      throw new InvalidPollError(
        'single-choice polls cannot have maxSelections',
      );
    }
    return {
      text: normalizedText,
      options: normalizedOptions,
      maxSelections: null,
    };
  }
  return {
    text: normalizedText,
    options: normalizedOptions,
    maxSelections: validateMaxSelections(maxSelections, normalizedOptions),
  };
}
