import { useState, useId, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';

import { Label } from '@/components/ui/label';
import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';
import type {
  ConnectionState,
  ParticipantPoll,
  ParticipantResponse,
  ParticipantResponseState,
  ParticipantResultVisibility,
} from '../model/participant-session';
import { responseFieldName } from '../model/participant-session';
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

export type { ResponseDraft } from '../model/participant-session';

type ParticipantPollProps = Readonly<{
  changeNameHref?: string;
  connectionState: ConnectionState;
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
  onSubmit,
  participantName,
  poll,
  response,
  responseError,
  responseState,
  resultVisibility,
  sessionName,
}: ParticipantPollProps) {
  const titleId = useId();
  const isChoicePoll = poll.type !== 'open-ended';
  const isPending = responseState === 'pending';
  const isStale = connectionState === 'stale';
  const storedText = typeof response === 'string' ? response : '';
  const storedOptionIds = Array.isArray(response) ? response : [];
  const [responseLength, setResponseLength] = useState(storedText.length);

  return (
    <div className="flex flex-col gap-4">
      <ParticipantCard className="flex flex-col gap-5" padding="lg">
        <PollHeader sessionName={sessionName} />

        <Questionnaire
          items={questionnaireItems(poll)}
          key={poll.id}
          onSubmit={onSubmit}
        >
          <QuestionnaireItem
            aria-labelledby={titleId}
            multiple={poll.type === 'multiple-choice'}
            name={responseFieldName}
            required
          >
            <QuestionnaireTitle
              className="text-3xl leading-tight font-bold tracking-[-0.035em] text-foreground"
              id={titleId}
              render={<h1 />}
            >
              {poll.prompt}
            </QuestionnaireTitle>

            <QuestionnaireDescription>
              {isChoicePoll
                ? choiceInstruction(poll)
                : openEndedInstruction(poll, responseLength)}
            </QuestionnaireDescription>

            {connectionState === 'stale' ? (
              <ReconnectingResponseNotice />
            ) : null}

            {isChoicePoll ? (
              <QuestionnaireChoices>
                {poll.options.map((option) => (
                  <QuestionnaireChoice
                    defaultChecked={
                      storedOptionIds.includes(option.id) ||
                      storedText === option.id
                    }
                    disabled={isPending}
                    key={option.id}
                    value={option.id}
                  >
                    <span className="min-w-0 text-base font-medium wrap-break-word">
                      {option.label}
                    </span>
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
            ) : (
              <OpenEndedResponse
                isPending={isPending}
                onChange={(value) => setResponseLength(value.length)}
                poll={poll}
                responseLength={responseLength}
                storedText={storedText}
              />
            )}

            <QuestionnaireError>
              {requiredAnswerMessage(poll.type)}
            </QuestionnaireError>

            {responseError ? <ResponseError message={responseError} /> : null}
          </QuestionnaireItem>

          <ResponseSubmissionStatus responseState={responseState} />

          <QuestionnaireSubmit
            className="w-full"
            disabled={isPending || isStale}
            size="lg"
          >
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
            {submitButtonLabel(responseState, response !== null)}
          </QuestionnaireSubmit>
        </Questionnaire>

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

function questionnaireItems(poll: ParticipantPoll) {
  if (poll.type === 'open-ended') {
    return [{ name: responseFieldName, required: true }];
  }

  return [
    {
      name: responseFieldName,
      required: true,
      choices: poll.options.map((option) => ({ value: option.id })),
    },
  ];
}

function choiceInstruction(poll: ParticipantPoll): string {
  return poll.type === 'multiple-choice'
    ? 'Select one or more options'
    : 'Select one option';
}

function openEndedInstruction(
  poll: ParticipantPoll,
  responseLength: number,
): string {
  return `Share a response · ${responseLength} / ${poll.responseLimit ?? 500} characters`;
}

function requiredAnswerMessage(pollType: ParticipantPoll['type']): string {
  if (pollType === 'multiple-choice') {
    return 'Select at least one option before submitting.';
  }

  if (pollType === 'open-ended') {
    return 'Enter a response before submitting.';
  }

  return 'Select one option before submitting.';
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

function ResponseError({ message }: Readonly<{ message: string }>) {
  return (
    <p className="text-sm font-semibold text-destructive" role="alert">
      {message}
    </p>
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

function OpenEndedResponse({
  isPending,
  onChange,
  poll,
  responseLength,
  storedText,
}: Readonly<{
  isPending: boolean;
  onChange: (value: string) => void;
  poll: ParticipantPoll;
  responseLength: number;
  storedText: string;
}>) {
  const responseLimit = poll.responseLimit ?? 500;
  const inputId = `${poll.id}-response`;

  return (
    <QuestionnaireChoices>
      <Label
        className="text-sm font-semibold text-foreground"
        htmlFor={inputId}
      >
        Your response
      </Label>
      <QuestionnaireInput
        aria-describedby={`${inputId}-hint ${inputId}-count`}
        className="h-auto min-h-40 py-3 resize-none"
        defaultValue={storedText}
        disabled={isPending}
        id={inputId}
        maxLength={responseLimit}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Share a thought..."
        render={<textarea rows={6} />}
      />
      <div className="flex items-start justify-between gap-4 text-xs leading-5 text-muted-foreground">
        <span id={`${inputId}-hint`}>
          Responses must contain non-empty trimmed text.
        </span>
        <span className="shrink-0 font-mono" id={`${inputId}-count`}>
          {responseLength} / {responseLimit}
        </span>
      </div>
    </QuestionnaireChoices>
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
