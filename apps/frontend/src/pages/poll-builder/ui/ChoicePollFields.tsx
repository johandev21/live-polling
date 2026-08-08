import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import type { PollDraft } from '../model/poll-builder';

export type ChoicePollFieldsProps = Readonly<{
  draft: PollDraft;
  maximumSelectionsError?: string;
  onAddOption: () => void;
  onMaximumSelectionsChange: (value: number | undefined) => void;
  onOptionChange: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
  optionKeys: readonly string[];
  optionErrors: readonly (string | undefined)[];
  optionsError?: string;
}>;

const selectionValues = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function ChoicePollFields({
  draft,
  maximumSelectionsError,
  onAddOption,
  onMaximumSelectionsChange,
  onOptionChange,
  onRemoveOption,
  optionKeys,
  optionErrors,
  optionsError,
}: ChoicePollFieldsProps) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-foreground">
        <span>Options</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          2-10 unique options
        </span>
      </legend>
      {optionsError ? (
        <p className="text-xs text-destructive" role="alert">
          {optionsError}
        </p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {draft.options.map((option, index) => {
          const optionKey = optionKeys[index] ?? `option-fallback-${index}`;
          const fieldId = `poll-option-${optionKey}`;
          return (
            <li key={optionKey}>
              <div className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-foreground"
                >
                  {index + 1}
                </span>
                <Field className="min-w-0 flex-1">
                  <FieldLabel htmlFor={fieldId}>{`Option ${index + 1}`}</FieldLabel>
                  <Input
                    id={fieldId}
                    aria-label={`Option ${index + 1}`}
                    maxLength={120}
                    onChange={(event) =>
                      onOptionChange(index, event.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    value={option}
                  />
                  {optionErrors[index] ? <FieldError>{optionErrors[index]}</FieldError> : null}
                </Field>
                <button
                  aria-label={`Remove option ${index + 1}`}
                  className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={draft.options.length <= 1}
                  onClick={() => onRemoveOption(index)}
                  type="button"
                >
                  <X aria-hidden="true" size={17} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          disabled={draft.options.length >= 10}
          onClick={onAddOption}
          size="sm"
          variant="ghost"
        >
          <Plus aria-hidden="true" className="mr-2" size={15} />
          Add option
        </Button>
        <span className="text-xs text-muted-foreground">
          Each option must be non-empty and unique.
        </span>
      </div>
      {draft.type === 'multiple-choice' ? (
        <Field>
          <FieldLabel htmlFor="maximum-selections">Maximum selections (optional)</FieldLabel>
          <select
            id="maximum-selections"
            className="min-h-12 w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus-visible:border-ring"
            onChange={(event) =>
              onMaximumSelectionsChange(
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            value={draft.maximumSelections ?? ''}
          >
            <option value="">No limit</option>
            {selectionValues.map((value) => (
              <option key={value} value={value}>
                {value} selections
              </option>
            ))}
          </select>
          <FieldDescription>Leave this at No limit to allow any number of options.</FieldDescription>
          {maximumSelectionsError ? <FieldError>{maximumSelectionsError}</FieldError> : null}
        </Field>
      ) : null}
    </fieldset>
  );
}
