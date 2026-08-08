import type { FormEvent } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  ParticipantPoll,
  ParticipantResponse,
  ParticipantResponseState,
  ParticipantResultVisibility,
  ConnectionState,
} from '../model/participant-session';
import {
  ParticipantResults,
  ReconnectingResponseNotice,
  ResultsVisibilityNote,
  ResponseSubmissionStatus,
} from './ParticipantResponseState';
import {
  ParticipantCallout,
  ParticipantCard,
  ParticipantStatusBadge,
} from './ParticipantSessionPrimitives';

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
  const isChoicePoll = poll.type !== 'open-ended';

  return (
    <div className="flex flex-col gap-4">
      <ParticipantCard className="flex flex-col gap-5" padding="lg">
        <PollHeader sessionName={sessionName} />

        <PollPrompt draftResponse={draftResponse} poll={poll} />

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

          {responseError ? <ResponseError message={responseError} /> : null}

          <ResponseSubmissionStatus responseState={responseState} />

          <SubmitActionButton
            connectionState={connectionState}
            hasExistingResponse={response !== null}
            responseState={responseState}
          />
        </form>

        <ParticipantCallout icon="refreshCw" tone="neutral">
          {responseNoteText(poll)}
        </ParticipantCallout>

        <JoiningAsFootnote
          changeNameHref={changeNameHref}
          participantName={participantName}
        />
      </ParticipantCard>

      <PollResultsSection poll={poll} resultVisibility={resultVisibility} />

      <NextPollHint />
    </div>
  );
}

const optionBaseClassName = [
  'flex min-h-16 cursor-pointer items-center gap-3 rounded-sm border px-4 py-3',
  'transition-[background-color,border-color,transform] hover:-translate-y-px',
  'has-disabled:cursor-not-allowed has-disabled:hover:translate-y-0',
].join(' ');

const optionIdleClassName =
  'border-border bg-background text-foreground';
const optionSelectedClassName =
  'border-primary bg-secondary text-primary';

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

function PollHeader({ sessionName }: Readonly<{ sessionName: string }>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className="font-mono text-xs font-bold tracking-[0.14em] text-primary uppercase">
        {sessionName}
      </p>
      <ParticipantStatusBadge label="Open poll" tone="success" />
    </div>
  );
}

function PollPrompt({
  draftResponse,
  poll,
}: Readonly<{ draftResponse: ResponseDraft; poll: ParticipantPoll }>) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl leading-tight font-bold tracking-[-0.035em] text-foreground">
        {poll.prompt}
      </h1>
      <p className="text-sm text-muted-foreground">
        {pollInstruction(poll, draftResponse)}
      </p>
    </div>
  );
}

function ResponseError({ message }: Readonly<{ message: string }>) {
  return (
    <p className="text-sm font-semibold text-destructive" role="alert">
      {message}
    </p>
  );
}

function SubmitActionButton({
  connectionState,
  hasExistingResponse,
  responseState,
}: Readonly<{
  connectionState: ConnectionState;
  hasExistingResponse: boolean;
  responseState: ParticipantResponseState;
}>) {
  const isPending = responseState === 'pending';
  const disabled = isPending || connectionState === 'stale';

  return (
    <Button className="w-full" disabled={disabled} size="lg" type="submit">
      {isPending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <ArrowRight aria-hidden="true" />
      )}
      {submitButtonLabel(responseState, hasExistingResponse)}
    </Button>
  );
}

function submitButtonLabel(
  responseState: ParticipantResponseState,
  hasExistingResponse: boolean,
): string {
  if (responseState === 'pending') {
    return 'Submitting response...';
  }

  if (responseState === 'rejected') {
    return 'Retry response';
  }

  return hasExistingResponse ? 'Update response' : 'Submit response';
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
      {multiple ? (
        poll.options.map((option) => (
          <MultipleChoiceOption
            key={option.id}
            onChangeDraft={onChangeDraft}
            option={option}
            poll={poll}
            selectedValues={selectedValues}
          />
        ))
      ) : (
        <RadioGroup
          onValueChange={onChangeDraft}
          value={typeof draftResponse === 'string' ? draftResponse : ''}
        >
          {poll.options.map((option) => (
            <SingleChoiceOption
              key={option.id}
              draftResponse={draftResponse}
              option={option}
              poll={poll}
            />
          ))}
        </RadioGroup>
      )}
    </fieldset>
  );
}

function MultipleChoiceOption({
  onChangeDraft,
  option,
  poll,
  selectedValues,
}: Readonly<{
  onChangeDraft: (response: ResponseDraft) => void;
  option: ParticipantPoll['options'][number];
  poll: ParticipantPoll;
  selectedValues: string[];
}>) {
  const selected = selectedValues.includes(option.id);
  const inputId = `${poll.id}-${option.id}`;

  return (
    <Label
      className={choiceOptionClass(selected)}
      htmlFor={inputId}
    >
      <Checkbox
        checked={selected}
        id={inputId}
        onCheckedChange={(checked) => {
          onChangeDraft(
            checked
              ? [...selectedValues, option.id]
              : selectedValues.filter((value) => value !== option.id),
          );
        }}
      />
      <span className="min-w-0 text-base font-semibold wrap-break-word">
        {option.label}
      </span>
    </Label>
  );
}

function SingleChoiceOption({
  draftResponse,
  option,
  poll,
}: Readonly<{
  draftResponse: ResponseDraft;
  option: ParticipantPoll['options'][number];
  poll: ParticipantPoll;
}>) {
  const selected = draftResponse === option.id;
  const inputId = `${poll.id}-${option.id}`;

  return (
    <Label
      className={choiceOptionClass(selected)}
      htmlFor={inputId}
    >
      <RadioGroupItem id={inputId} value={option.id} />
      <span className="min-w-0 text-base font-semibold wrap-break-word">
        {option.label}
      </span>
    </Label>
  );
}

function choiceOptionClass(selected: boolean): string {
  return cn(
    optionBaseClassName,
    selected ? optionSelectedClassName : optionIdleClassName,
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
      <Label className="text-sm font-semibold text-foreground" htmlFor={`${poll.id}-response`}>Your response</Label>
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
      <div className="flex items-start justify-between gap-4 text-xs leading-5 text-muted-foreground">
        <span id={`${poll.id}-response-hint`}>
          Responses must contain non-empty trimmed text.
        </span>
        <span
          className="shrink-0 font-mono"
          id={`${poll.id}-response-count`}
        >
          {value.length} / {responseLimit}
        </span>
      </div>
    </div>
  );
}

function responseNoteText(poll: ParticipantPoll): string {
  if (poll.type === 'multiple-choice') {
    return `You can change your response while this poll remains open. Maximum ${poll.maxSelections ?? 'no'} selections.`;
  }

  if (poll.type === 'open-ended') {
    return `Responses must contain non-empty trimmed text and are limited to ${poll.responseLimit ?? 500} characters.`;
  }

  return 'You can change your response while this poll remains open. Your response is not accepted until the server confirms it.';
}

function JoiningAsFootnote({
  changeNameHref,
  participantName,
}: Readonly<{ changeNameHref?: string; participantName: string }>) {
  return (
    <p className="text-center text-xs font-semibold text-muted-foreground">
      Joining as {participantName} ·{' '}
      {changeNameHref ? (
        <a className="text-primary hover:underline" href={changeNameHref}>
          Change display name
        </a>
      ) : null}
    </p>
  );
}

function PollResultsSection({
  poll,
  resultVisibility,
}: Readonly<{
  poll: ParticipantPoll;
  resultVisibility: ParticipantResultVisibility;
}>) {
  return resultVisibility === 'revealed' ? (
    <ParticipantResults poll={poll} />
  ) : (
    <ResultsVisibilityNote resultVisibility={resultVisibility} />
  );
}

function NextPollHint() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <ArrowRight aria-hidden="true" className="rotate-90" size={13} />
      <span>Keep this page open for the next poll.</span>
    </div>
  );
}
