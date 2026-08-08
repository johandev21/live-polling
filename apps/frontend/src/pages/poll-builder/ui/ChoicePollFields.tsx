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
      <OptionsLegend />
      {optionsError ? <OptionsErrorAlert message={optionsError} /> : null}
      <OptionList
        draft={draft}
        onOptionChange={onOptionChange}
        onRemoveOption={onRemoveOption}
        optionErrors={optionErrors}
        optionKeys={optionKeys}
      />
      <OptionActions canAdd={draft.options.length < 10} onAddOption={onAddOption} />
      {draft.type === 'multiple-choice' ? (
        <MaximumSelectionsField
          error={maximumSelectionsError}
          onChange={onMaximumSelectionsChange}
          value={draft.maximumSelections}
        />
      ) : null}
    </fieldset>
  );
}

function OptionsLegend() {
  return (
    <legend className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-foreground">
      <span>Options</span>
      <span className="font-mono text-[10px] text-muted-foreground">
        2-10 unique options
      </span>
    </legend>
  );
}

function OptionsErrorAlert({ message }: { message: string }) {
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

function OptionList({
  draft,
  onOptionChange,
  onRemoveOption,
  optionErrors,
  optionKeys,
}: {
  draft: PollDraft;
  onOptionChange: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
  optionErrors: readonly (string | undefined)[];
  optionKeys: readonly string[];
}) {
  return (
    <ol className="flex flex-col gap-3">
      {draft.options.map((option, index) => (
        <ChoiceOptionRow
          canRemove={draft.options.length > 1}
          index={index}
          key={optionKeys[index] ?? `option-fallback-${index}`}
          onOptionChange={onOptionChange}
          onRemoveOption={onRemoveOption}
          option={option}
          optionError={optionErrors[index]}
          optionKey={optionKeys[index] ?? `option-fallback-${index}`}
        />
      ))}
    </ol>
  );
}

function ChoiceOptionRow({
  canRemove,
  index,
  onOptionChange,
  onRemoveOption,
  option,
  optionError,
  optionKey,
}: {
  canRemove: boolean;
  index: number;
  onOptionChange: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
  option: string;
  optionError?: string;
  optionKey: string;
}) {
  const fieldId = `poll-option-${optionKey}`;
  return (
    <li>
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
            onChange={(event) => onOptionChange(index, event.target.value)}
            placeholder={`Option ${index + 1}`}
            value={option}
          />
          {optionError ? <FieldError>{optionError}</FieldError> : null}
        </Field>
        <button
          aria-label={`Remove option ${index + 1}`}
          className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canRemove}
          onClick={() => onRemoveOption(index)}
          type="button"
        >
          <X aria-hidden="true" size={17} />
        </button>
      </div>
    </li>
  );
}

function OptionActions({
  canAdd,
  onAddOption,
}: {
  canAdd: boolean;
  onAddOption: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        disabled={!canAdd}
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
  );
}

function MaximumSelectionsField({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (value: number | undefined) => void;
  value: number | undefined;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="maximum-selections">
        Maximum selections (optional)
      </FieldLabel>
      <select
        id="maximum-selections"
        className="min-h-12 w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus-visible:border-ring"
        onChange={(event) =>
          onChange(
            event.target.value ? Number(event.target.value) : undefined,
          )
        }
        value={value ?? ''}
      >
        <option value="">No limit</option>
        {selectionValues.map((selectionValue) => (
          <option key={selectionValue} value={selectionValue}>
            {selectionValue} selections
          </option>
        ))}
      </select>
      <FieldDescription>
        Leave this at No limit to allow any number of options.
      </FieldDescription>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
