import { Field, TextInput, Textarea } from '@/shared/ui';

import type { PollDraft } from '../model/poll-builder';

export type OpenEndedPollFieldsProps = Readonly<{
  draft: PollDraft;
  onResponseLimitChange: (value: number | undefined) => void;
  onResponsePreviewChange: (value: string) => void;
  responseLimitError?: string;
  responsePreview: string;
}>;

export function OpenEndedPollFields({
  draft,
  onResponseLimitChange,
  onResponsePreviewChange,
  responseLimitError,
  responsePreview,
}: OpenEndedPollFieldsProps) {
  const responseLimit = draft.responseLimit ?? 500;
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="text-sm font-semibold text-[var(--color-text-primary)]">
        Open-ended response
      </legend>
      <Field
        error={responseLimitError}
        hint="Choose a limit between 50 and 500 characters."
        id="response-limit"
        label="Response limit"
      >
        <TextInput
          inputMode="numeric"
          max={500}
          min={50}
          onChange={(event) =>
            onResponseLimitChange(
              event.target.value ? Number(event.target.value) : undefined,
            )
          }
          type="number"
          value={draft.responseLimit ?? ''}
        />
      </Field>
      <Field
        hint="This local preview is not saved as a participant response."
        id="response-preview"
        label="Participant response preview"
      >
        <div className="relative">
          <Textarea
            aria-describedby="response-preview-count"
            maxLength={Math.max(responseLimit, responsePreview.length)}
            onChange={(event) => onResponsePreviewChange(event.target.value)}
            placeholder="Share a thought..."
            rows={5}
            value={responsePreview}
          />
          <span
            className="pointer-events-none absolute bottom-3 right-3 font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]"
            id="response-preview-count"
          >
            {responsePreview.length} / {responseLimit}
          </span>
        </div>
      </Field>
    </fieldset>
  );
}
