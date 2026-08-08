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

export function ParticipantResults({
  poll,
}: Readonly<{ poll: ParticipantPoll }>) {
  if (poll.type === 'open-ended') {
    return (
      <ParticipantCard className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.14em] text-primary uppercase">
              Aggregate view
            </p>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              Results are available
            </h2>
          </div>
          <ParticipantStatusBadge label="Results revealed" tone="success" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          The host can review open-ended response text. Participant results keep
          individual responses private.
        </p>
        <div className="flex items-center justify-between gap-4 rounded-md bg-secondary p-4">
          <span className="text-sm font-semibold text-muted-foreground">
            Total responses
          </span>
          <strong className="font-mono text-2xl text-primary">
            {poll.totalResponses}
          </strong>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          No participant names or individual open-ended response text is shown
          here.
        </p>
      </ParticipantCard>
    );
  }

  return (
    <ParticipantCard className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.14em] text-primary uppercase">
            Aggregate view
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">
            Results revealed
          </h2>
        </div>
        <ParticipantStatusBadge label="Visible to participants" tone="success" />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Results from {poll.totalResponses} effective responses.
      </p>
      <ul className="flex flex-col gap-4">
        {poll.results.map((result) => (
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
      <div className="flex items-center justify-between gap-4 rounded-md bg-secondary p-4">
        <span className="text-sm font-semibold text-muted-foreground">
          Total responses
        </span>
        <strong className="font-mono text-2xl text-primary">
          {poll.totalResponses}
        </strong>
      </div>
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
        <ParticipantStatusBadge icon="check" label="Response accepted" tone="success" />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
            Your response is in.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The server confirmed your response to this poll.
          </p>
        </div>

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

        {liveUpdatesRecovering ? (
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
        ) : null}

        <p className="text-xs font-semibold text-muted-foreground">
          Joining as {participantName} ·{' '}
          {changeNameHref ? (
            <a className="text-primary hover:underline" href={changeNameHref}>
              Change display name
            </a>
          ) : null}
        </p>
      </ParticipantCard>

      {resultVisibility === 'revealed' ? (
        <ParticipantResults poll={poll} />
      ) : (
        <ResultsVisibilityNote resultVisibility={resultVisibility} />
      )}
    </div>
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
