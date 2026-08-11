import { useState } from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NumberInput } from '@/shared/ui/number-input';

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
  const [isCustomizing, setIsCustomizing] = useState(
    draft.responseLimit !== undefined && draft.responseLimit !== 500,
  );
  const responseLimit = draft.responseLimit ?? 500;

  function handleResetDefault() {
    onResponseLimitChange(undefined);
    setIsCustomizing(false);
  }

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-base font-bold tracking-tight text-foreground sm:text-lg">
        Open-ended response settings
      </legend>

      {!isCustomizing && draft.responseLimit === undefined ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground sm:text-sm">
              Character limit per response
            </span>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Default: 500 characters max
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(true)}
          >
            <SlidersHorizontal aria-hidden="true" size={14} />
            <span>Customize limit</span>
          </Button>
        </div>
      ) : (
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="response-limit" className="text-sm font-medium sm:text-base">
              Response limit (characters)
            </FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetDefault}
              className="h-8 text-xs text-muted-foreground hover:text-foreground sm:text-sm"
            >
              <RotateCcw aria-hidden="true" size={13} />
              <span>Use default (500)</span>
            </Button>
          </div>

          <div className="mt-1">
            <NumberInput
              id="response-limit"
              min={50}
              max={500}
              step={10}
              value={draft.responseLimit}
              placeholder="500"
              onChange={onResponseLimitChange}
            />
          </div>

          <FieldDescription className="text-xs sm:text-sm">
            Set a maximum length between 50 and 500 characters.
          </FieldDescription>

          {responseLimitError ? (
            <FieldError className="text-xs font-medium sm:text-sm">
              {responseLimitError}
            </FieldError>
          ) : null}
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="response-preview" className="text-sm font-medium sm:text-base">
          Participant response preview
        </FieldLabel>
        <div className="relative">
          <Textarea
            id="response-preview"
            aria-describedby="response-preview-count"
            className="max-h-48 break-all text-sm sm:text-base"
            maxLength={Math.max(responseLimit, responsePreview.length)}
            onChange={(event) => onResponsePreviewChange(event.target.value)}
            placeholder="Share a thought..."
            rows={4}
            value={responsePreview}
          />
          <span
            className="pointer-events-none absolute right-3 bottom-3 font-mono text-xs text-muted-foreground sm:text-sm"
            id="response-preview-count"
          >
            {responsePreview.length} / {responseLimit}
          </span>
        </div>
        <FieldDescription className="text-xs sm:text-sm">
          Test typing a response locally. This preview is not saved to the session.
        </FieldDescription>
      </Field>
    </fieldset>
  );
}
