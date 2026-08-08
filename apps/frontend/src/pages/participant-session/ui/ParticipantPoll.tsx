import type { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';

import { cx } from '@/shared/lib';
import { Button, Callout, StatusBadge, Surface, Textarea } from '@/shared/ui';

import type { ConnectionState } from '@/shared/ui';
import type {
  ParticipantPoll,
  ParticipantResponse,
  ParticipantResponseState,
  ParticipantResultVisibility,
} from '../model/participant-session';
import {
  ParticipantResults,
  ReconnectingResponseNotice,
  ResultsVisibilityNote,
  ResponseSubmissionStatus,
} from './ParticipantResponseState';

export type ResponseDraft = string | string[];

type ParticipantPollProps = Readonly<{
  changeNameHref?: string;
  connectionState: ConnectionState;
  draftResponse: ResponseDraft;
  onChangeDraft: (response: ResponseDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  participantName: string;
  poll: ParticipantPoll;
  response: ParticipantResponse;
  responseError?: string;
  responseState: ParticipantResponseState;
  resultVisibility: ParticipantResultVisibility;
  sessionName: string;
}>;

const optionBaseClassName = [
  'flex min-h-16 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3',
  'transition-[background-color,border-color,transform] hover:-translate-y-px',
  'has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:translate-y-0',
].join(' ');

const optionIdleClassName =
  'border-[var(--color-border)] bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]';
const optionSelectedClassName =
  'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]';

function pollInstruction(poll: ParticipantPoll, draftResponse: ResponseDraft) {
  if (poll.type === 'multiple-choice') {
    const count = Array.isArray(draftResponse) ? draftResponse.length : 0;
    return `Select one or more options · ${count} selected`;
  }

  if (poll.type === 'open-ended') {
    const value = typeof draftResponse === 'string' ? draftResponse : '';
    return `Share a response · ${value.length} / ${poll.responseLimit ?? 500} characters`;
  }

  return 'Select one option';
}

function ChoiceOptions({
  draftResponse,
  onChangeDraft,
  poll,
  responseState,
}: Readonly<{
  draftResponse: ResponseDraft;
  onChangeDraft: (response: ResponseDraft) => void;
  poll: ParticipantPoll;
  responseState: ParticipantResponseState;
}>) {
  const disabled = responseState === 'pending';
  const multiple = poll.type === 'multiple-choice';
  const selectedValues = Array.isArray(draftResponse) ? draftResponse : [];

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="sr-only">
        {multiple ? 'Choose one or more options' : 'Choose one option'}
      </legend>
      {poll.options.map((option) => {
        const selected = multiple
          ? selectedValues.includes(option.id)
          : draftResponse === option.id;
        const inputId = `${poll.id}-${option.id}`;

        return (
          <label
            className={cx(
              optionBaseClassName,
              selected ? optionSelectedClassName : optionIdleClassName,
            )}
            htmlFor={inputId}
            key={option.id}
          >
            <input
              checked={selected}
              className="size-5 shrink-0 accent-[var(--color-primary)]"
              id={inputId}
              name={poll.id}
              onChange={() => {
                if (multiple) {
                  const nextValues = selected
                    ? selectedValues.filter((value) => value !== option.id)
                    : [...selectedValues, option.id];
                  onChangeDraft(nextValues);
                  return;
                }

                onChangeDraft(option.id);
              }}
              type={multiple ? 'checkbox' : 'radio'}
              value={option.id}
            />
            <span className="min-w-0 break-words text-base font-semibold">
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function OpenEndedResponse({
  draftResponse,
  onChangeDraft,
  poll,
  responseState,
}: Readonly<{
  draftResponse: ResponseDraft;
  onChangeDraft: (response: ResponseDraft) => void;
  poll: ParticipantPoll;
  responseState: ParticipantResponseState;
}>) {
  const value = typeof draftResponse === 'string' ? draftResponse : '';
  const responseLimit = poll.responseLimit ?? 500;

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-sm font-semibold text-[var(--color-text-primary)]"
        htmlFor={`${poll.id}-response`}
      >
        Your response
      </label>
      <Textarea
        aria-describedby={`${poll.id}-response-hint ${poll.id}-response-count`}
        disabled={responseState === 'pending'}
        id={`${poll.id}-response`}
        maxLength={responseLimit}
        onChange={(event) => onChangeDraft(event.target.value)}
        placeholder="Share a thought..."
        rows={6}
        value={value}
      />
      <div className="flex items-start justify-between gap-4 text-xs leading-5 text-[var(--color-text-tertiary)]">
        <span id={`${poll.id}-response-hint`}>
          Responses must contain non-empty trimmed text.
        </span>
        <span
          className="shrink-0 font-[var(--font-mono)]"
          id={`${poll.id}-response-count`}
        >
          {value.length} / {responseLimit}
        </span>
      </div>
    </div>
  );
}

export function ParticipantPoll({
  changeNameHref,
  connectionState,
  draftResponse,
  onChangeDraft,
  onSubmit,
  participantName,
  poll,
  response,
  responseError,
  responseState,
  resultVisibility,
  sessionName,
}: ParticipantPollProps) {
  const isPending = responseState === 'pending';
  const submitDisabled = isPending || connectionState === 'stale';
  const hasExistingResponse = response !== null;
  const isChoicePoll = poll.type !== 'open-ended';

  return (
    <div className="flex flex-col gap-4">
      <Surface as="section" className="flex flex-col gap-5" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="font-[var(--font-mono)] text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            {sessionName}
          </p>
          <StatusBadge label="Open poll" tone="success" />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold leading-tight tracking-[-0.035em] text-[var(--color-text-primary)]">
            {poll.prompt}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {pollInstruction(poll, draftResponse)}
          </p>
        </div>

        {connectionState === 'stale' ? <ReconnectingResponseNotice /> : null}

        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          {isChoicePoll ? (
            <ChoiceOptions
              draftResponse={draftResponse}
              onChangeDraft={onChangeDraft}
              poll={poll}
              responseState={responseState}
            />
          ) : (
            <OpenEndedResponse
              draftResponse={draftResponse}
              onChangeDraft={onChangeDraft}
              poll={poll}
              responseState={responseState}
            />
          )}

          {responseError ? (
            <p
              className="text-sm font-semibold text-[var(--color-error)]"
              role="alert"
            >
              {responseError}
            </p>
          ) : null}

          <ResponseSubmissionStatus responseState={responseState} />

          <Button
            className="w-full"
            disabled={submitDisabled}
            endIcon={isPending ? 'loaderCircle' : 'arrowRight'}
            size="lg"
            type="submit"
          >
            {isPending
              ? 'Submitting response...'
              : responseState === 'rejected'
                ? 'Retry response'
                : hasExistingResponse
                  ? 'Update response'
                  : 'Submit response'}
          </Button>
        </form>

        <Callout icon="refreshCw" tone="neutral">
          {poll.type === 'multiple-choice'
            ? `You can change your response while this poll remains open. Maximum ${poll.maxSelections ?? 'no'} selections.`
            : poll.type === 'open-ended'
              ? `Responses must contain non-empty trimmed text and are limited to ${poll.responseLimit ?? 500} characters.`
              : 'You can change your response while this poll remains open. Your response is not accepted until the server confirms it.'}
        </Callout>

        <p className="text-center text-xs font-semibold text-[var(--color-text-tertiary)]">
          Joining as {participantName} ·{' '}
          {changeNameHref ? (
            <a className="text-[var(--color-primary)] hover:underline" href={changeNameHref}>
              Change display name
            </a>
          ) : null}
        </p>
      </Surface>

      {resultVisibility === 'revealed' ? (
        <ParticipantResults poll={poll} />
      ) : (
        <ResultsVisibilityNote resultVisibility={resultVisibility} />
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-tertiary)]">
        <ArrowRight aria-hidden="true" className="rotate-90" size={13} />
        <span>Keep this page open for the next poll.</span>
      </div>
    </div>
  );
}
