import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <legend className="mb-1 text-base font-bold tracking-tight text-foreground sm:text-lg">
      Options
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
      <Field className="w-full">
        <FieldLabel htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">{`Option ${index + 1}`}</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id={fieldId}
            aria-label={`Option ${index + 1}`}
            maxLength={120}
            onChange={(event) => onOptionChange(index, event.target.value)}
            placeholder={`Option ${index + 1}`}
            value={option}
            className="flex-1 text-sm sm:text-base"
          />
          <button
            aria-label={`Remove option ${index + 1}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canRemove}
            onClick={() => onRemoveOption(index)}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
        {optionError ? <FieldError className="text-xs font-medium sm:text-sm">{optionError}</FieldError> : null}
      </Field>
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
      {!canAdd ? (
        <span className="text-xs font-medium text-muted-foreground sm:text-sm">
          Maximum limit of 10 options reached.
        </span>
      ) : (
        <span className="text-xs text-muted-foreground sm:text-sm">
          Each option must be non-empty and unique.
        </span>
      )}
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
  const stringValue = value !== undefined ? String(value) : 'none';

  return (
    <Field>
      <FieldLabel htmlFor="maximum-selections" className="text-sm font-medium sm:text-base">
        Maximum selections (optional)
      </FieldLabel>
      <Select
        value={stringValue}
        onValueChange={(val) => {
          if (!val || val === 'none') {
            onChange(undefined);
          } else {
            onChange(Number(val));
          }
        }}
      >
        <SelectTrigger id="maximum-selections" className="h-10 w-full text-sm sm:text-base">
          <SelectValue placeholder="No limit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No limit</SelectItem>
          {selectionValues.map((selectionValue) => (
            <SelectItem key={selectionValue} value={String(selectionValue)}>
              {selectionValue} selections
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription className="text-xs sm:text-sm">
        Leave this at No limit to allow any number of options.
      </FieldDescription>
      {error ? <FieldError className="text-xs font-medium sm:text-sm">{error}</FieldError> : null}
    </Field>
  );
}
