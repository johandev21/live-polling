import { useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Info } from 'lucide-react';
import type { SubmitEvent } from 'react';

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

function Header({ onCancel }: { onCancel?: () => void }) {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Poll builder navigation"
        className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-between p-4 sm:px-6 lg:px-16"
      >
        <a
          className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-muted-foreground hover:text-foreground"
          href="/session-editor"
          onClick={onCancel}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Session editor
        </a>
        <Brand aria-label="Pulse home" href="/" size="sm" />
      </nav>
    </header>
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
    <div className="flex min-h-13 items-center gap-3 rounded-sm border border-border bg-background px-4 py-3">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-5 shrink-0 items-center justify-center border border-border bg-background',
          type === 'multiple-choice' ? 'rounded-[4px]' : 'rounded-full',
        )}
      />
      <span className="min-w-0 text-sm wrap-break-word text-foreground">
        {option || 'Untitled option'}
      </span>
    </div>
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
      className="flex h-fit flex-col gap-5 p-6 sm:p-7 lg:sticky lg:top-6"
    >
      <p className="text-xs font-bold tracking-[0.14em] text-foreground">
        PARTICIPANT PREVIEW
      </p>
      <h2
        className="text-2xl leading-tight font-bold wrap-break-word text-foreground"
        id="participant-preview-heading"
      >
        {draft.text.trim() || 'Your poll text'}
      </h2>
      <p className="text-sm text-muted-foreground">
        {typeDescriptions[draft.type]}
      </p>
      {draft.type === 'open-ended' ? (
        <>
          <div className="relative">
            <div className="min-h-36 rounded-sm border border-border bg-background px-4 py-3 text-sm wrap-break-word whitespace-pre-wrap text-muted-foreground">
              {responsePreview || 'Share a thought...'}
            </div>
            <span className="absolute right-3 bottom-3 font-mono text-[10px] text-muted-foreground">
              {responsePreview.length} / {draft.responseLimit ?? 500}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Responses are anonymous to participants and visible to the host.
          </p>
        </>
      ) : (
        <>
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
              <p className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">
                Add options to preview the participant choices.
              </p>
            )}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {draft.type === 'multiple-choice'
              ? 'Participants may select more than one option. Results may total more than 100%.'
              : 'Participants see this poll after the host opens it.'}
          </p>
        </>
      )}
    </Card>
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

  const optionCounts = normalizedOptionCounts(draft.options);
  const invalidOptionFlags = draft.options.map((option) => {
    const normalized = option.trim().toLocaleLowerCase();
    if (!normalized) {
      return true;
    }
    if ((optionCounts.get(normalized) ?? 0) > 1) {
      return true;
    }
    return false;
  });
  const optionErrors = draft.options.map((option) => {
    const normalized = option.trim().toLocaleLowerCase();
    if (!hasSubmitted) {
      return undefined;
    }
    if (!normalized) {
      return 'Option is required.';
    }
    if ((optionCounts.get(normalized) ?? 0) > 1) {
      return 'Options must be unique.';
    }
    return undefined;
  });
  const invalidOptionCount =
    draft.type !== 'open-ended' &&
    (draft.options.length < 2 || draft.options.length > 10);
  const optionsError =
    hasSubmitted && invalidOptionCount
      ? draft.options.length < 2
        ? 'Add at least two options.'
        : 'Use no more than ten options.'
      : undefined;
  const pollTextError =
    hasSubmitted && !draft.text.trim() ? 'Poll text is required.' : undefined;
  const invalidMaximumSelections =
    draft.type === 'multiple-choice' &&
    draft.maximumSelections !== undefined &&
    (draft.maximumSelections < 2 ||
      draft.maximumSelections > draft.options.length);
  const maximumSelectionsError =
    hasSubmitted && invalidMaximumSelections
      ? 'Maximum selections must be between 2 and the number of options.'
      : undefined;
  const invalidResponseLimit =
    draft.type === 'open-ended' &&
    draft.responseLimit !== undefined &&
    (draft.responseLimit < 50 || draft.responseLimit > 500);
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

  async function handleSave(event: SubmitEvent<HTMLElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    if (hasErrors) {
      setActionMessage(
        'Review the highlighted fields before saving this poll.',
      );
      return;
    }

    if (onSavePollSubmit) {
      try {
        await onSavePollSubmit(draft);
      } catch (err) {
        setActionMessage(err instanceof Error ? err.message : 'Failed to save poll.');
        return;
      }
    }

    setActionMessage('Poll saved to the session draft.');
    onSave?.(draft);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCancel={onCancel} />
      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-16">
        <section className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-foreground">
              NEW POLL - {typeLabels[draft.type]}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
              Build a poll
            </h1>
          </div>
          <PollTypeTabs onChange={handleTypeChange} value={draft.type} />
        </section>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Error saving poll</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,720px)_minmax(320px,520px)]">
          <Card className="p-6 sm:p-7">
            <form className="flex flex-col gap-7" id="poll-builder-form" onSubmit={handleSave}>
              <Field>
                <FieldLabel htmlFor="poll-text">
                  Poll text <span aria-hidden="true" className="text-destructive">*</span>
                </FieldLabel>
                <Textarea
                  id="poll-text"
                  maxLength={500}
                  onChange={(event) => updateDraftText(event.target.value)}
                  placeholder="What would you like to ask?"
                  rows={4}
                  value={draft.text}
                />
                <FieldDescription>
                  {draft.type === 'open-ended'
                    ? `${draft.text.length} / 500 characters`
                    : 'Ask one clear prompt.'}
                </FieldDescription>
                {pollTextError ? <FieldError>{pollTextError}</FieldError> : null}
              </Field>

            {draft.type === 'open-ended' ? (
              <OpenEndedPollFields
                draft={draft}
                onResponseLimitChange={(value) =>
                  setDraft((current) => ({ ...current, responseLimit: value }))
                }
                onResponsePreviewChange={setResponsePreview}
                responseLimitError={responseLimitError}
                responsePreview={responsePreview}
              />
            ) : (
              <ChoicePollFields
                draft={draft}
                maximumSelectionsError={maximumSelectionsError}
                onAddOption={addOption}
                onMaximumSelectionsChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    maximumSelections: value,
                  }))
                }
                onOptionChange={updateOption}
                onRemoveOption={removeOption}
                optionKeys={optionKeys}
                optionErrors={optionErrors}
                optionsError={optionsError}
              />
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button onClick={onCancel} type="button" variant="ghost">
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit">
                <Check aria-hidden="true" className="mr-2" size={16} />
                {isSubmitting ? 'Saving poll...' : 'Save poll'}
              </Button>
            </div>
            {actionMessage ? (
              <p
                aria-live="polite"
                className={cn(
                  'text-sm font-semibold',
                  hasSubmitted && hasErrors
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {actionMessage}
              </p>
            ) : null}
            </form>
          </Card>

          <ParticipantPreview
            draft={draft}
            optionKeys={optionKeys}
            responsePreview={responsePreview}
          />
        </div>

        {draft.type === 'multiple-choice' ? (
          <Alert role="note">
            <Info />
            <AlertDescription>
            Maximum selections is kept with this draft and will be enforced when
            the poll is open.
            </AlertDescription>
          </Alert>
        ) : draft.type === 'open-ended' ? (
          <Alert role="note">
            <Info />
            <AlertDescription>
            Open-ended responses are visible to the host and kept within the
            response limit you set.
            </AlertDescription>
          </Alert>
        ) : null}
      </main>
    </div>
  );
}
