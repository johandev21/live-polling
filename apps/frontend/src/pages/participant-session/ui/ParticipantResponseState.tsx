import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type {
  ParticipantPoll,
  ParticipantResponse,
  ParticipantResponseState as ResponseState,
  ParticipantResultVisibility,
  ConnectionState,
} from '../model/participant-session';
import { participantResponseLabel } from '../model/participant-session';
import {
  ParticipantCallout,
  ParticipantCard,
  ParticipantResultBar,
  ParticipantStatusBadge,
} from './ParticipantSessionPrimitives';

type ParticipantResponseStateProps = Readonly<{
  changeNameHref?: string;
  connectionState: ConnectionState;
  onChangeResponse: () => void;
  participantName: string;
  poll: ParticipantPoll;
  response: ParticipantResponse;
  resultVisibility: ParticipantResultVisibility;
}>;

export function ParticipantAcceptedResponse({
  changeNameHref,
  connectionState,
  onChangeResponse,
  participantName,
  poll,
  response,
  resultVisibility,
}: ParticipantResponseStateProps) {
  const liveUpdatesRecovering =
    connectionState === 'reconnecting' || connectionState === 'stale';

  return (
    <div className="flex flex-col gap-4">
      <ParticipantCard
        className="flex flex-col items-center gap-5 text-center"
        padding="lg"
      >
        <ParticipantStatusBadge
          icon="check"
          label="Response accepted"
          tone="success"
        />

        <AcceptedResponseHeading />

        <CurrentResponsePanel poll={poll} response={response} />

        <Button
          className="w-full"
          onClick={onChangeResponse}
          size="lg"
          type="button"
        >
          <RefreshCw aria-hidden="true" />
          Change response
        </Button>

        <p className="text-xs leading-5 text-muted-foreground">
          You can change your response while the poll remains open.
        </p>

        {liveUpdatesRecovering ? <AcceptedResponseRecoveringCallout /> : null}

        <JoiningAsFootnote
          changeNameHref={changeNameHref}
          participantName={participantName}
        />
      </ParticipantCard>

      <PollResultsSection poll={poll} resultVisibility={resultVisibility} />
    </div>
  );
}

export function ParticipantResults({
  poll,
}: Readonly<{ poll: ParticipantPoll }>) {
  if (poll.type === 'open-ended') {
    return <OpenEndedResults poll={poll} />;
  }

  return <ChoiceResults poll={poll} />;
}

function OpenEndedResults({ poll }: Readonly<{ poll: ParticipantPoll }>) {
  return (
    <ParticipantCard className="flex flex-col gap-5">
      <ResultsHeader
        badgeLabel="Results revealed"
        title="Results are available"
      />
      <p className="text-sm leading-6 text-muted-foreground">
        The host can review open-ended response text. Participant results keep
        individual responses private.
      </p>
      <TotalResponsesRow total={poll.totalResponses} />
      <p className="text-xs leading-5 text-muted-foreground">
        No participant names or individual open-ended response text is shown
        here.
      </p>
    </ParticipantCard>
  );
}

function ChoiceResults({ poll }: Readonly<{ poll: ParticipantPoll }>) {
  return (
    <ParticipantCard className="flex flex-col gap-5">
      <ResultsHeader
        alignStart
        badgeLabel="Visible to participants"
        title="Results revealed"
      />
      <p className="text-sm leading-6 text-muted-foreground">
        Results from {poll.totalResponses} effective responses.
      </p>
      <ResultsList results={poll.results} />
      <TotalResponsesRow total={poll.totalResponses} />
      {poll.type === 'multiple-choice' ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Multiple-choice percentages can add up to more than 100% because
          participants may select more than one option.
        </p>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">
        Only aggregate results are shown. Participant names and individual
        responses are never displayed.
      </p>
    </ParticipantCard>
  );
}

function ResultsHeader({
  alignStart = false,
  badgeLabel,
  title,
}: Readonly<{
  alignStart?: boolean;
  badgeLabel: string;
  title: string;
}>) {
  return (
    <div
      className={`flex flex-wrap items-${alignStart ? 'start' : 'center'} justify-between gap-3`}
    >
      <div>
        <p className="font-mono text-xs font-bold tracking-[0.14em] text-primary uppercase">
          Aggregate view
        </p>
        <h2 className="mt-2 text-xl font-bold text-foreground">{title}</h2>
      </div>
      <ParticipantStatusBadge label={badgeLabel} tone="success" />
    </div>
  );
}

function TotalResponsesRow({ total }: Readonly<{ total: number }>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-secondary p-4">
      <span className="text-sm font-semibold text-muted-foreground">
        Total responses
      </span>
      <strong className="font-mono text-2xl text-primary">{total}</strong>
    </div>
  );
}

function ResultsList({
  results,
}: Readonly<{ results: ParticipantPoll['results'] }>) {
  return (
    <ul className="flex flex-col gap-4">
      {results.map((result) => (
        <li key={result.id}>
          <ParticipantResultBar
            ariaLabel={`${result.label}: ${result.percentage}% and ${result.count} responses`}
            count={result.count}
            label={result.label}
            percentage={result.percentage}
          />
        </li>
      ))}
    </ul>
  );
}

export function ResultsVisibilityNote({
  resultVisibility,
}: Readonly<{ resultVisibility: ParticipantResultVisibility }>) {
  if (resultVisibility === 'revealed') {
    return null;
  }

  return (
    <ParticipantCallout icon="info" title="Results are hidden" tone="neutral">
      Results will appear when the host reveals them. Participants never see
      names or individual open-ended responses.
    </ParticipantCallout>
  );
}

export function ResponseSubmissionStatus({
  responseState,
}: Readonly<{ responseState: ResponseState }>) {
  if (responseState === 'pending') {
    return (
      <ParticipantCallout
        icon="loaderCircle"
        title="Waiting for confirmation"
        tone="neutral"
      >
        Your response is being sent. It is not accepted until the server
        confirms it.
      </ParticipantCallout>
    );
  }

  if (responseState === 'rejected') {
    return (
      <ParticipantCallout
        icon="alertCircle"
        title="Your response was not accepted"
        tone="error"
      >
        The session did not accept that response. Check the selection and retry
        while the poll is open.
      </ParticipantCallout>
    );
  }

  return null;
}

export function ReconnectingResponseNotice() {
  return (
    <ParticipantCallout
      icon="refreshCw"
      title="Live updates are reconnecting"
      tone="warning"
    >
      Keep this page open while we refresh the session. An accepted response
      remains accepted.
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <RefreshCw aria-hidden="true" size={14} />
        Restoring the session view automatically
      </div>
    </ParticipantCallout>
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

function AcceptedResponseHeading() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
        Your response is in.
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        The server confirmed your response to this poll.
      </p>
    </div>
  );
}

function CurrentResponsePanel({
  poll,
  response,
}: Readonly<{ poll: ParticipantPoll; response: ParticipantResponse }>) {
  return (
    <div className="w-full rounded-lg border border-transparent bg-secondary p-6">
      <div className="flex flex-col items-start gap-2 text-left">
        <p className="text-xs text-muted-foreground">
          Current response
        </p>
        <p className="text-lg font-bold wrap-break-word text-primary">
          {participantResponseLabel(poll, response)}
        </p>
      </div>
    </div>
  );
}

function AcceptedResponseRecoveringCallout() {
  return (
    <ParticipantCallout
      icon="refreshCw"
      title="Your response is still accepted"
      tone="warning"
    >
      Live updates are reconnecting, but your response is safely saved.
      You do not need to submit again.
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-2/5 rounded-full bg-foreground" />
      </div>
    </ParticipantCallout>
  );
}

function JoiningAsFootnote({
  changeNameHref,
  participantName,
}: Readonly<{ changeNameHref?: string; participantName: string }>) {
  return (
    <p className="text-xs font-semibold text-muted-foreground">
      Joining as {participantName} ·{' '}
      {changeNameHref ? (
        <a className="text-primary hover:underline" href={changeNameHref}>
          Change display name
        </a>
      ) : null}
    </p>
  );
}
