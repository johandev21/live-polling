import { Clock3, LockKeyhole } from 'lucide-react';

import { Callout, ConnectionStatus, StatusBadge, Surface } from '@/shared/ui';
import type { ConnectionState } from '@/shared/ui';

import type {
  ParticipantPoll,
  ParticipantResponse,
  ParticipantResponseState,
  ParticipantResultVisibility,
} from '../model/participant-session';
import { participantResponseLabel } from '../model/participant-session';
import {
  ParticipantResults,
  ResultsVisibilityNote,
} from './ParticipantResponseState';

type ParticipantWaitingStateProps = Readonly<{
  connectionState: ConnectionState;
  participantCount: number;
  response: ParticipantResponse;
  responseState: ParticipantResponseState;
  sessionName: string;
}>;

export function ParticipantWaitingState({
  connectionState,
  participantCount,
  response,
  responseState,
  sessionName,
}: ParticipantWaitingStateProps) {
  return (
    <Surface
      as="section"
      className="flex flex-col items-center gap-5 text-center"
      elevation="card"
      padding="lg"
    >
      <p className="font-[var(--font-mono)] text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
        {sessionName}
      </p>
      <div className="flex size-18 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Clock3 aria-hidden="true" size={34} strokeWidth={1.8} />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
          You are in. Hang tight.
        </h1>
        <p className="max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">
          The host has not opened a poll yet. When the next poll is ready, it
          will appear here.
        </p>
      </div>
      <ConnectionStatus
        label={
          connectionState === 'connected' ? 'Connected and waiting' : undefined
        }
        state={connectionState}
      />
      <p className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
        About {participantCount} participants are connected
      </p>
      {responseState === 'accepted' && response !== null ? (
        <Callout
          icon="check"
          title="Your previous response remains accepted"
          tone="success"
        >
          The session is waiting for its next active poll. Your accepted
          response remains saved.
        </Callout>
      ) : null}
      <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
        There is nothing to answer right now. Keep this page open for the next
        poll.
      </p>
    </Surface>
  );
}

type ClosedPollStateProps = Readonly<{
  poll: ParticipantPoll;
  response: ParticipantResponse;
  responseState: ParticipantResponseState;
  resultVisibility: ParticipantResultVisibility;
}>;

export function ParticipantClosedPollState({
  poll,
  response,
  responseState,
  resultVisibility,
}: ClosedPollStateProps) {
  return (
    <div className="flex flex-col gap-4">
      <Surface
        as="section"
        className="flex flex-col items-center gap-5 text-center"
        padding="lg"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <StatusBadge label="Poll closed" tone="neutral" />
          <span className="font-[var(--font-mono)] text-[0.68rem] text-[var(--color-text-tertiary)]">
            No new responses
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
            This poll is closed.
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            The host is no longer accepting responses.
          </p>
        </div>

        {responseState === 'accepted' ? (
          <Surface
            className="w-full bg-[var(--color-primary-soft)]"
            padding="md"
          >
            <div className="flex flex-col items-start gap-2 text-left">
              <p className="text-sm font-bold text-[var(--color-success)]">
                Your response was accepted before closing.
              </p>
              <p className="break-words text-base font-bold text-[var(--color-text-primary)]">
                {participantResponseLabel(poll, response)}
              </p>
            </div>
          </Surface>
        ) : responseState === 'pending' ? (
          <Callout
            icon="loaderCircle"
            title="Response confirmation is still pending"
            tone="warning"
          >
            The poll is closed while the server finishes confirming the request.
            No accepted response is shown until the server confirms it.
          </Callout>
        ) : responseState === 'rejected' ? (
          <Callout
            icon="alertCircle"
            title="Your response was not accepted"
            tone="error"
          >
            The poll closed before that response was accepted. No response was
            recorded for this poll.
          </Callout>
        ) : (
          <Callout icon="info" title="No response was accepted" tone="neutral">
            This poll closed without an accepted response for you.
          </Callout>
        )}
      </Surface>

      {resultVisibility === 'revealed' ? (
        <ParticipantResults poll={poll} />
      ) : (
        <ResultsVisibilityNote resultVisibility={resultVisibility} />
      )}
      <p className="text-center text-xs text-[var(--color-text-tertiary)]">
        Waiting for the next active poll.
      </p>
    </div>
  );
}

export function ParticipantEndedSessionState({
  poll,
  resultVisibility,
}: Readonly<{
  poll: ParticipantPoll;
  resultVisibility: ParticipantResultVisibility;
}>) {
  return (
    <div className="flex flex-col gap-4">
      <Surface
        as="section"
        className="flex flex-col items-center gap-5 text-center"
        padding="lg"
      >
        <StatusBadge label="Ended session" tone="neutral" />
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
          <LockKeyhole aria-hidden="true" size={28} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
            This session has ended.
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            No more responses can be submitted.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Final results are available only for polls the host revealed.
        </p>
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          Individual responses and participant names are never shown.
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
