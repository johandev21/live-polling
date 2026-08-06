import { Plus, X } from 'lucide-react';

import { Button, Field, TextInput } from '@/shared/ui';

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
      <legend className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
        <span>Options</span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
          2-10 unique options
        </span>
      </legend>
      {optionsError ? (
        <p className="text-xs text-[var(--color-error)]" role="alert">
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
                  className="mt-2.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] font-[var(--font-mono)] text-xs font-bold text-[var(--color-primary)]"
                >
                  {index + 1}
                </span>
                <Field
                  className="min-w-0 flex-1"
                  error={optionErrors[index]}
                  id={fieldId}
                  label={`Option ${index + 1}`}
                >
                  <TextInput
                    aria-label={`Option ${index + 1}`}
                    maxLength={120}
                    onChange={(event) =>
                      onOptionChange(index, event.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    value={option}
                  />
                </Field>
                <button
                  aria-label={`Remove option ${index + 1}`}
                  className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-40"
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
          variant="quiet"
        >
          <Plus aria-hidden="true" className="mr-2" size={15} />
          Add option
        </Button>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          Each option must be non-empty and unique.
        </span>
      </div>
      {draft.type === 'multiple-choice' ? (
        <Field
          error={maximumSelectionsError}
          hint="Leave this at No limit to allow any number of options."
          id="maximum-selections"
          label="Maximum selections (optional)"
        >
          <select
            className="min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-canvas)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus-visible:border-[var(--color-primary)]"
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
        </Field>
      ) : null}
    </fieldset>
  );
}
