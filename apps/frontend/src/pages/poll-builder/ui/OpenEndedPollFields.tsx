import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
      <legend className="text-sm font-semibold text-foreground">
        Open-ended response
      </legend>
      <Field>
        <FieldLabel htmlFor="response-limit">Response limit</FieldLabel>
        <Input
          id="response-limit"
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
        <FieldDescription>Choose a limit between 50 and 500 characters.</FieldDescription>
        {responseLimitError ? <FieldError>{responseLimitError}</FieldError> : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="response-preview">Participant response preview</FieldLabel>
        <div className="relative">
          <Textarea
            id="response-preview"
            aria-describedby="response-preview-count"
            maxLength={Math.max(responseLimit, responsePreview.length)}
            onChange={(event) => onResponsePreviewChange(event.target.value)}
            placeholder="Share a thought..."
            rows={5}
            value={responsePreview}
          />
          <span
            className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-muted-foreground"
            id="response-preview-count"
          >
            {responsePreview.length} / {responseLimit}
          </span>
        </div>
        <FieldDescription>This local preview is not saved as a participant response.</FieldDescription>
      </Field>
    </fieldset>
  );
}
