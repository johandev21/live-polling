import { useState } from 'react';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import type { SubmitEvent } from 'react';

import { ModeToggle } from '@/components/mode-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Brand } from '@/shared/ui/brand';
import { GlassHeader } from '@/shared/ui/glass-header';


import {
  type PollDraft,
  type PollType,
} from '../model/poll-builder';
import { ChoicePollFields } from './ChoicePollFields';
import { OpenEndedPollFields } from './OpenEndedPollFields';
import { PollTypeTabs } from './PollTypeTabs';

export type PollBuilderPageProps = Readonly<{
  errorMessage?: string | null;
  initialDraft?: PollDraft;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSave?: (draft: PollDraft) => void;
  onSavePollSubmit?: (draft: PollDraft) => Promise<void> | void;
}>;

const typeLabels: Record<PollType, string> = {
  'multiple-choice': 'MULTIPLE CHOICE',
  'open-ended': 'OPEN-ENDED',
  'single-choice': 'SINGLE CHOICE',
};

const typeDescriptions: Record<PollType, string> = {
  'multiple-choice': 'Select one or more options',
  'open-ended': 'Write a response',
  'single-choice': 'Select one option',
};

const emptyDraft: PollDraft = {
  type: 'single-choice',
  text: '',
  options: ['', ''],
};

export function PollBuilderPage({
  errorMessage,
  initialDraft = emptyDraft,
  isSubmitting = false,
  onCancel,
  onSave,
  onSavePollSubmit,
}: PollBuilderPageProps) {
  const [draft, setDraft] = useState<PollDraft>(() => ({
    ...initialDraft,
    options: [...initialDraft.options],
  }));
  const [optionKeys, setOptionKeys] = useState<readonly string[]>(() =>
    initialDraft.options.map((_, index) => `option-${index + 1}`),
  );
  const [nextOptionNumber, setNextOptionNumber] = useState(
    initialDraft.options.length + 1,
  );
  const [responsePreview, setResponsePreview] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const validation = usePollValidation(draft, hasSubmitted);

  function updateDraftText(value: string) {
    setDraft((current) => ({ ...current, text: value }));
    if (actionMessage) {
      setActionMessage(null);
    }
  }

  function updateOption(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    }));
  }

  function addOption() {
    const optionKey = `option-${nextOptionNumber}`;
    setNextOptionNumber((current) => current + 1);
    setOptionKeys((current) => [...current, optionKey]);
    setDraft((current) => ({
      ...current,
      options: [...current.options, ''],
    }));
  }

  function removeOption(index: number) {
    setOptionKeys((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    );
    setDraft((current) => ({
      ...current,
      options: current.options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }));
  }

  function handleTypeChange(type: PollType) {
    setDraft((current) => ({ ...current, type }));
    setActionMessage(null);
  }

  function updateMaximumSelections(value: number | undefined) {
    setDraft((current) => ({ ...current, maximumSelections: value }));
  }

  function updateResponseLimit(value: number | undefined) {
    setDraft((current) => ({ ...current, responseLimit: value }));
  }

  async function handleSave(event: SubmitEvent<HTMLElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    if (validation.hasErrors) {
      setActionMessage(
        'Review the highlighted fields before saving this poll.',
      );
      return;
    }

    if (onSavePollSubmit) {
      try {
        await onSavePollSubmit(draft);
      } catch (err) {
        setActionMessage(
          err instanceof Error ? err.message : 'Failed to save poll.',
        );
        return;
      }
    }

    setActionMessage('Poll saved to the session draft.');
    onSave?.(draft);
  }

  return (
    <div className="min-h-screen bg-mist-50 font-sans text-foreground dark:bg-background">
      <Header onCancel={onCancel} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="flex flex-col gap-4">
          <PollBuilderHeading type={draft.type} />
          <PollTypeTabs onChange={handleTypeChange} value={draft.type} />
        </section>

        {errorMessage ? <SaveErrorAlert message={errorMessage} /> : null}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="p-6 sm:p-8">
            <form
              className="flex flex-col gap-7"
              id="poll-builder-form"
              onSubmit={handleSave}
            >
              <PollTextField
                draft={draft}
                onTextChange={updateDraftText}
                pollTextError={validation.pollTextError}
              />

              {draft.type === 'open-ended' ? (
                <OpenEndedPollFields
                  draft={draft}
                  onResponseLimitChange={updateResponseLimit}
                  onResponsePreviewChange={setResponsePreview}
                  responseLimitError={validation.responseLimitError}
                  responsePreview={responsePreview}
                />
              ) : (
                <ChoicePollFields
                  draft={draft}
                  maximumSelectionsError={validation.maximumSelectionsError}
                  onAddOption={addOption}
                  onMaximumSelectionsChange={updateMaximumSelections}
                  onOptionChange={updateOption}
                  onRemoveOption={removeOption}
                  optionKeys={optionKeys}
                  optionErrors={validation.optionErrors}
                  optionsError={validation.optionsError}
                />
              )}

              <PollActionBar isSubmitting={isSubmitting} onCancel={onCancel} />
              <FormMessage
                hasErrors={validation.hasErrors}
                hasSubmitted={hasSubmitted}
                message={actionMessage}
              />
            </form>
          </Card>

          <aside className="lg:sticky lg:top-20">
            <ParticipantPreview
              draft={draft}
              optionKeys={optionKeys}
              responsePreview={responsePreview}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

function usePollValidation(draft: PollDraft, hasSubmitted: boolean) {
  const optionCounts = normalizedOptionCounts(draft.options);
  const invalidOptionFlags = draft.options.map((option) =>
    isInvalidOption(option, optionCounts),
  );
  const invalidOptionCount = isInvalidOptionCount(draft);
  const invalidMaximumSelections = isInvalidMaximumSelections(draft);
  const invalidResponseLimit = isInvalidResponseLimit(draft);

  const optionErrors = draft.options.map((option) =>
    getOptionError(option, optionCounts, hasSubmitted),
  );
  const optionsError = hasSubmitted
    ? getOptionsError(draft, invalidOptionCount)
    : undefined;
  const pollTextError =
    hasSubmitted && !draft.text.trim() ? 'Poll text is required.' : undefined;
  const maximumSelectionsError =
    hasSubmitted && invalidMaximumSelections
      ? 'Maximum selections must be between 2 and the number of options.'
      : undefined;
  const responseLimitError =
    hasSubmitted && invalidResponseLimit
      ? 'Response limit must be between 50 and 500 characters.'
      : undefined;

  const hasErrors = Boolean(
    !draft.text.trim() ||
      invalidOptionCount ||
      (draft.type !== 'open-ended' && invalidOptionFlags.some(Boolean)) ||
      invalidMaximumSelections ||
      invalidResponseLimit,
  );

  return {
    optionErrors,
    optionsError,
    pollTextError,
    maximumSelectionsError,
    responseLimitError,
    hasErrors,
  };
}

function Header({ onCancel }: { onCancel?: () => void }) {
  return (
    <GlassHeader>
      <nav
        aria-label="Poll builder navigation"
        className="flex w-full items-center justify-between"
      >
        <a
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground sm:text-base"
          href="/session-editor"
          onClick={onCancel}
        >
          <ArrowLeft aria-hidden="true" size={16} />
          <span>Session editor</span>
        </a>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Brand aria-label="Pulse home" href="/" size="sm" />
        </div>
      </nav>
    </GlassHeader>
  );
}

function PollBuilderHeading({ type }: { type: PollType }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:text-sm">
        NEW POLL - {typeLabels[type]}
      </p>
      <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Build a poll
      </h1>
    </div>
  );
}

function SaveErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error saving poll</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function PollTextField({
  draft,
  onTextChange,
  pollTextError,
}: {
  draft: PollDraft;
  onTextChange: (value: string) => void;
  pollTextError?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="poll-text" className="text-sm font-medium sm:text-base">
        Poll text <span aria-hidden="true" className="text-destructive">*</span>
      </FieldLabel>
      <Textarea
        id="poll-text"
        className="max-h-48 text-sm break-all sm:text-base"
        maxLength={500}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="What would you like to ask?"
        rows={4}
        value={draft.text}
      />
      <FieldDescription className="text-xs sm:text-sm">
        {draft.type === 'open-ended'
          ? `${draft.text.length} / 500 characters`
          : 'Ask one clear prompt.'}
      </FieldDescription>
      {pollTextError ? <FieldError className="text-xs font-medium sm:text-sm">{pollTextError}</FieldError> : null}
    </Field>
  );
}

function PollActionBar({
  isSubmitting,
  onCancel,
}: {
  isSubmitting: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <Button onClick={onCancel} type="button" variant="ghost">
        Cancel
      </Button>
      <Button disabled={isSubmitting} type="submit" size="lg">
        <Check aria-hidden="true" size={16} />
        <span>{isSubmitting ? 'Saving poll...' : 'Save poll'}</span>
      </Button>
    </div>
  );
}

function FormMessage({
  hasErrors,
  hasSubmitted,
  message,
}: {
  hasErrors: boolean;
  hasSubmitted: boolean;
  message: string | null;
}) {
  if (!message) {
    return null;
  }
  return (
    <p
      aria-live="polite"
      className={getMessageClassName(hasSubmitted, hasErrors)}
    >
      {message}
    </p>
  );
}

function ParticipantPreview({
  draft,
  optionKeys,
  responsePreview,
}: {
  draft: PollDraft;
  optionKeys: readonly string[];
  responsePreview: string;
}) {
  return (
    <Card
      aria-labelledby="participant-preview-heading"
      className="flex flex-col gap-5 p-6 sm:p-7"
    >
      <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:text-sm">
        PARTICIPANT PREVIEW
      </p>
      <h2
        className="text-xl leading-tight font-bold wrap-break-word text-foreground sm:text-2xl"
        id="participant-preview-heading"
      >
        {draft.text.trim() || 'Your poll text'}
      </h2>
      <p className="text-xs text-muted-foreground sm:text-sm">
        {typeDescriptions[draft.type]}
      </p>
      {draft.type === 'open-ended' ? (
        <OpenEndedPreview draft={draft} responsePreview={responsePreview} />
      ) : (
        <ChoicePreview draft={draft} optionKeys={optionKeys} />
      )}
    </Card>
  );
}

function OpenEndedPreview({
  draft,
  responsePreview,
}: {
  draft: PollDraft;
  responsePreview: string;
}) {
  return (
    <>
      <div className="relative">
        <div className="min-h-36 rounded-md border border-border bg-background px-4 py-3 text-sm wrap-break-word whitespace-pre-wrap text-muted-foreground sm:text-base">
          {responsePreview || 'Share a thought...'}
        </div>
        <span className="pointer-events-none absolute right-3 bottom-3 font-mono text-xs text-muted-foreground sm:text-sm">
          {responsePreview.length} / {draft.responseLimit ?? 500}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Responses are anonymous to participants and visible to the host.
      </p>
    </>
  );
}

function ChoicePreview({
  draft,
  optionKeys,
}: {
  draft: PollDraft;
  optionKeys: readonly string[];
}) {
  return (
    <>
      <PreviewOptionList draft={draft} optionKeys={optionKeys} />
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {draft.type === 'multiple-choice'
          ? 'Participants may select more than one option. Results may total more than 100%.'
          : 'Participants see this poll after the host opens it.'}
      </p>
    </>
  );
}

function PreviewOptionList({
  draft,
  optionKeys,
}: {
  draft: PollDraft;
  optionKeys: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {draft.options.length > 0 ? (
        draft.options.map((option, index) => (
          <div key={optionKeys[index] ?? `preview-option-${index}`}>
            <PreviewOption
              option={option}
              type={
                draft.type === 'multiple-choice'
                  ? 'multiple-choice'
                  : 'single-choice'
              }
            />
          </div>
        ))
      ) : (
        <p className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground sm:text-sm">
          Add options to preview the participant choices.
        </p>
      )}
    </div>
  );
}

function PreviewOption({
  option,
  type,
}: {
  option: string;
  type: 'multiple-choice' | 'single-choice';
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-4 shrink-0 items-center justify-center border border-border bg-background',
          type === 'multiple-choice' ? 'rounded-[4px]' : 'rounded-full',
        )}
      />
      <span className="min-w-0 text-sm wrap-break-word text-foreground sm:text-base">
        {option || 'Untitled option'}
      </span>
    </div>
  );
}

function normalizedOptionCounts(options: readonly string[]) {
  const counts = new Map<string, number>();
  for (const option of options) {
    const normalized = option.trim().toLocaleLowerCase();
    if (normalized) {
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return counts;
}

function isInvalidOption(option: string, counts: Map<string, number>) {
  const normalized = option.trim().toLocaleLowerCase();
  if (!normalized) {
    return true;
  }
  return (counts.get(normalized) ?? 0) > 1;
}

function getOptionError(
  option: string,
  counts: Map<string, number>,
  hasSubmitted: boolean,
): string | undefined {
  if (!hasSubmitted) {
    return undefined;
  }
  const normalized = option.trim().toLocaleLowerCase();
  if (!normalized) {
    return 'Option is required.';
  }
  if ((counts.get(normalized) ?? 0) > 1) {
    return 'Options must be unique.';
  }
  return undefined;
}

function isInvalidOptionCount(draft: PollDraft) {
  return (
    draft.type !== 'open-ended' &&
    (draft.options.length < 2 || draft.options.length > 10)
  );
}

function getOptionsError(draft: PollDraft, invalidOptionCount: boolean) {
  if (!invalidOptionCount) {
    return undefined;
  }
  return draft.options.length < 2
    ? 'Add at least two options.'
    : 'Use no more than ten options.';
}

function isInvalidMaximumSelections(draft: PollDraft) {
  return (
    draft.type === 'multiple-choice' &&
    draft.maximumSelections !== undefined &&
    (draft.maximumSelections < 2 ||
      draft.maximumSelections > draft.options.length)
  );
}

function isInvalidResponseLimit(draft: PollDraft) {
  return (
    draft.type === 'open-ended' &&
    draft.responseLimit !== undefined &&
    (draft.responseLimit < 50 || draft.responseLimit > 500)
  );
}

function getMessageClassName(hasSubmitted: boolean, hasErrors: boolean) {
  return cn(
    'text-sm font-semibold sm:text-base',
    hasSubmitted && hasErrors ? 'text-destructive' : 'text-muted-foreground',
  );
}
