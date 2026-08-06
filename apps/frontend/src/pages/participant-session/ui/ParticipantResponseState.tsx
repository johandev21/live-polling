import { RefreshCw } from 'lucide-react';

import { Button, Callout, ResultBar, StatusBadge, Surface } from '@/shared/ui';
import type { ConnectionState } from '@/shared/ui';

import type {
  ParticipantPoll,
  ParticipantResponse,
  ParticipantResponseState as ResponseState,
  ParticipantResultVisibility,
} from '../model/participant-session';
import { participantResponseLabel } from '../model/participant-session';

type ParticipantResponseStateProps = Readonly<{
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
    <Callout icon="info" title="Results are hidden" tone="neutral">
      Results will appear when the host reveals them. Participants never see
      names or individual open-ended responses.
    </Callout>
  );
}

export function ParticipantResults({
  poll,
}: Readonly<{ poll: ParticipantPoll }>) {
  if (poll.type === 'open-ended') {
    return (
      <Surface as="section" className="flex flex-col gap-5" padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-[var(--font-mono)] text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              Aggregate view
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
              Results are available
            </h2>
          </div>
          <StatusBadge label="Results revealed" tone="success" />
        </div>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          The host can review open-ended response text. Participant results keep
          individual responses private.
        </p>
        <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-4">
          <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Total responses
          </span>
          <strong className="font-[var(--font-mono)] text-2xl text-[var(--color-primary)]">
            {poll.totalResponses}
          </strong>
        </div>
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          No participant names or individual open-ended response text is shown
          here.
        </p>
      </Surface>
    );
  }

  return (
    <Surface as="section" className="flex flex-col gap-5" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[var(--font-mono)] text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            Aggregate view
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
            Results revealed
          </h2>
        </div>
        <StatusBadge label="Visible to participants" tone="success" />
      </div>
      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
        Results from {poll.totalResponses} effective responses.
      </p>
      <ul className="flex flex-col gap-4">
        {poll.results.map((result) => (
          <li key={result.id}>
            <ResultBar
              ariaLabel={`${result.label}: ${result.percentage}% and ${result.count} responses`}
              count={result.count}
              label={result.label}
              percentage={result.percentage}
            />
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-4">
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Total responses
        </span>
        <strong className="font-[var(--font-mono)] text-2xl text-[var(--color-primary)]">
          {poll.totalResponses}
        </strong>
      </div>
      {poll.type === 'multiple-choice' ? (
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          Multiple-choice percentages can add up to more than 100% because
          participants may select more than one option.
        </p>
      ) : null}
      <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
        Only aggregate results are shown. Participant names and individual
        responses are never displayed.
      </p>
    </Surface>
  );
}

export function ParticipantAcceptedResponse({
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
      <Surface
        as="section"
        className="flex flex-col items-center gap-5 text-center"
        padding="lg"
      >
        <StatusBadge icon="check" label="Response accepted" tone="success" />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
            Your response is in.
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            The server confirmed your response to this poll.
          </p>
        </div>

        <Surface className="w-full bg-[var(--color-primary-soft)]" padding="md">
          <div className="flex flex-col items-start gap-2 text-left">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Current response
            </p>
            <p className="break-words text-lg font-bold text-[var(--color-primary)]">
              {participantResponseLabel(poll, response)}
            </p>
          </div>
        </Surface>

        <Button
          className="w-full"
          onClick={onChangeResponse}
          size="lg"
          startIcon="refreshCw"
          type="button"
        >
          Change response
        </Button>
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          You can change your response while the poll remains open.
        </p>

        {liveUpdatesRecovering ? (
          <Callout
            icon="refreshCw"
            title="Your response is still accepted"
            tone="warning"
          >
            Live updates are reconnecting, but your response is safely saved.
            You do not need to submit again.
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-warning)]">
              <div className="h-full w-2/5 rounded-full bg-[var(--color-warning)]" />
            </div>
          </Callout>
        ) : null}

        <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">
          Joining as {participantName} ·{' '}
          <a
            className="text-[var(--color-primary)] hover:underline"
            href="/participant/name"
          >
            Change display name
          </a>
        </p>
      </Surface>

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
      <Callout
        icon="loaderCircle"
        title="Waiting for confirmation"
        tone="neutral"
      >
        Your response is being sent. It is not accepted until the server
        confirms it.
      </Callout>
    );
  }

  if (responseState === 'rejected') {
    return (
      <Callout
        icon="alertCircle"
        title="Your response was not accepted"
        tone="error"
      >
        The session did not accept that response. Check the selection and retry
        while the poll is open.
      </Callout>
    );
  }

  return null;
}

export function ReconnectingResponseNotice() {
  return (
    <Callout
      icon="refreshCw"
      title="Live updates are reconnecting"
      tone="warning"
    >
      Keep this page open while we refresh the session. An accepted response
      remains accepted.
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-warning)]">
        <RefreshCw aria-hidden="true" size={14} />
        Restoring the session view automatically
      </div>
    </Callout>
  );
}
