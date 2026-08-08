import { Clock3, LockKeyhole } from 'lucide-react';

import type {
  ConnectionState,
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
import {
  ParticipantCallout,
  ParticipantCard,
  ParticipantConnectionStatus,
  ParticipantStatusBadge,
} from './ParticipantSessionPrimitives';

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
    <ParticipantCard
      className="flex flex-col items-center gap-5 text-center"
      padding="lg"
    >
      <p className="font-mono text-xs font-bold tracking-[0.14em] text-primary uppercase">
        {sessionName}
      </p>
      <WaitingIntro />
      <ParticipantConnectionStatus
        label={
          connectionState === 'connected' ? 'Connected and waiting' : undefined
        }
        state={connectionState}
      />
      <p className="font-mono text-xs text-muted-foreground">
        About {participantCount} participants are connected
      </p>
      {responseState === 'accepted' && response !== null ? (
        <PreviousResponseAcceptedCallout />
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">
        There is nothing to answer right now. Keep this page open for the next
        poll.
      </p>
    </ParticipantCard>
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
      <ParticipantCard
        className="flex flex-col items-center gap-5 text-center"
        padding="lg"
      >
        <ClosedPollHeading />

        <ClosedPollResponseStatus
          poll={poll}
          response={response}
          responseState={responseState}
        />
      </ParticipantCard>

      <PollResultsSection poll={poll} resultVisibility={resultVisibility} />

      <p className="text-center text-xs text-muted-foreground">
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
      <ParticipantCard
        className="flex flex-col items-center gap-5 text-center"
        padding="lg"
      >
        <ParticipantStatusBadge label="Ended session" tone="neutral" />
        <EndedSessionHeading />
        <p className="text-sm font-semibold text-muted-foreground">
          Final results are available only for polls the host revealed.
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Individual responses and participant names are never shown.
        </p>
      </ParticipantCard>

      <PollResultsSection poll={poll} resultVisibility={resultVisibility} />
    </div>
  );
}

function WaitingIntro() {
  return (
    <>
      <div className="flex size-18 items-center justify-center rounded-full bg-secondary text-primary">
        <Clock3 aria-hidden="true" size={34} strokeWidth={1.8} />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
          You are in. Hang tight.
        </h1>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          The host has not opened a poll yet. When the next poll is ready, it
          will appear here.
        </p>
      </div>
    </>
  );
}

function PreviousResponseAcceptedCallout() {
  return (
    <ParticipantCallout
      icon="check"
      title="Your previous response remains accepted"
      tone="success"
    >
      The session is waiting for its next active poll. Your accepted
      response remains saved.
    </ParticipantCallout>
  );
}

function ClosedPollHeading() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ParticipantStatusBadge label="Poll closed" tone="neutral" />
        <span className="font-mono text-xs text-muted-foreground">
          No new responses
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
          This poll is closed.
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          The host is no longer accepting responses.
        </p>
      </div>
    </>
  );
}

function ClosedPollResponseStatus({
  poll,
  response,
  responseState,
}: Readonly<{
  poll: ParticipantPoll;
  response: ParticipantResponse;
  responseState: ParticipantResponseState;
}>) {
  if (responseState === 'accepted') {
    return <AcceptedResponsePanel poll={poll} response={response} />;
  }

  if (responseState === 'pending') {
    return <PendingResponseCallout />;
  }

  if (responseState === 'rejected') {
    return <RejectedResponseCallout />;
  }

  return <NoResponseCallout />;
}

function AcceptedResponsePanel({
  poll,
  response,
}: Readonly<{ poll: ParticipantPoll; response: ParticipantResponse }>) {
  return (
    <div className="w-full rounded-lg border border-transparent bg-secondary p-6">
      <div className="flex flex-col items-start gap-2 text-left">
        <p className="text-sm font-bold text-foreground">
          Your response was accepted before closing.
        </p>
        <p className="text-base font-bold wrap-break-word text-foreground">
          {participantResponseLabel(poll, response)}
        </p>
      </div>
    </div>
  );
}

function PendingResponseCallout() {
  return (
    <ParticipantCallout
      icon="loaderCircle"
      title="Response confirmation is still pending"
      tone="warning"
    >
      The poll is closed while the server finishes confirming the request.
      No accepted response is shown until the server confirms it.
    </ParticipantCallout>
  );
}

function RejectedResponseCallout() {
  return (
    <ParticipantCallout
      icon="alertCircle"
      title="Your response was not accepted"
      tone="error"
    >
      The poll closed before that response was accepted. No response was
      recorded for this poll.
    </ParticipantCallout>
  );
}

function NoResponseCallout() {
  return (
    <ParticipantCallout
      icon="info"
      title="No response was accepted"
      tone="neutral"
    >
      This poll closed without an accepted response for you.
    </ParticipantCallout>
  );
}

function EndedSessionHeading() {
  return (
    <>
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <LockKeyhole aria-hidden="true" size={28} strokeWidth={1.8} />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
          This session has ended.
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          No more responses can be submitted.
        </p>
      </div>
    </>
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
