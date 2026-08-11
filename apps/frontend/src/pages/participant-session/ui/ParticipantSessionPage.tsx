import { useState, type FormEvent } from 'react';

import {
  responseDraftFromForm,
  type ParticipantSessionSnapshot,
  type ResponseDraft,
} from '../model/participant-session';
import { ParticipantAcceptedResponse } from './ParticipantResponseState';
import { ParticipantPoll } from './ParticipantPoll';
import {
  ParticipantClosedPollState,
  ParticipantEndedSessionState,
  ParticipantWaitingState,
} from './ParticipantSessionState';
import { ModeToggle } from '@/components/mode-toggle';
import {
  ParticipantBrand,
  ParticipantConnectionStatus,
} from './ParticipantSessionPrimitives';
import { GlassHeader } from '@/shared/ui/glass-header';


export type ParticipantSessionPageProps = Readonly<{
  changeNameHref?: string;
  errorMessage?: string | null;
  initialParticipantName?: string;
  initialSnapshot?: ParticipantSessionSnapshot;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onResponseSubmit?: (draft: ResponseDraft) => Promise<void> | void;
}>;

export function ParticipantSessionPage({
  changeNameHref,
  errorMessage,
  initialParticipantName,
  initialSnapshot,
  isLoading = false,
  isSubmitting = false,
  onResponseSubmit,
}: ParticipantSessionPageProps) {
  const snapshot = initialSnapshot ?? unavailableSnapshot;
  const [responseError, setResponseError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draft = responseDraftFromForm(event.currentTarget, snapshot.poll);
    const error = validateDraft(snapshot, draft);
    if (error) {
      setResponseError(error);
      return;
    }

    setResponseError(undefined);

    if (!onResponseSubmit) {
      setResponseError('Submitting responses is unavailable.');
      return;
    }

    try {
      await onResponseSubmit(draft);
    } catch (err) {
      setResponseError(
        err instanceof Error ? err.message : 'Failed to send response.',
      );
    }
  }

  function handleChangeResponse() {
    setResponseError(undefined);
  }

  if (isLoading) {
    return <SessionLoadingState />;
  }

  if (!initialSnapshot) {
    return <SessionUnavailableState />;
  }

  return (
    <div className="min-h-screen bg-mist-50 font-sans text-foreground dark:bg-background">
      <SessionHeader
        connectionState={snapshot.connectionState}
        sessionName={snapshot.sessionName}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
        <SessionError error={errorMessage || responseError} />

        <SessionStateView
          changeNameHref={changeNameHref}
          initialParticipantName={initialParticipantName}
          isSubmitting={isSubmitting}
          onChangeResponse={handleChangeResponse}
          onSubmit={handleSubmit}
          responseError={responseError}
          snapshot={snapshot}
        />

        <SessionPrivacyNote />
      </main>
    </div>
  );
}

const unavailableSnapshot: ParticipantSessionSnapshot = {
  connectionState: 'stale',
  participantCount: 0,
  poll: {
    id: '',
    options: [],
    prompt: '',
    results: [],
    totalResponses: 0,
    type: 'single-choice',
  },
  pollLifecycle: 'none',
  response: null,
  responseState: 'none',
  resultVisibility: 'hidden',
  sessionLifecycle: 'live',
  sessionName: 'Session unavailable',
};

function validateDraft(
  snapshot: ParticipantSessionSnapshot,
  draftResponse: ResponseDraft,
): string | undefined {
  const { poll } = snapshot;

  if (snapshot.pollLifecycle !== 'open') {
    return 'This poll is no longer accepting responses.';
  }

  if (snapshot.connectionState === 'stale') {
    return 'Refresh the session before sending a new response.';
  }

  if (poll.type === 'single-choice') {
    if (typeof draftResponse !== 'string' || !draftResponse) {
      return 'Select one option before submitting.';
    }
  } else if (poll.type === 'multiple-choice') {
    if (!Array.isArray(draftResponse) || draftResponse.length === 0) {
      return 'Select at least one option before submitting.';
    }

    if (poll.maxSelections && draftResponse.length > poll.maxSelections) {
      return `Choose no more than ${poll.maxSelections} options.`;
    }
  } else {
    if (typeof draftResponse !== 'string' || !draftResponse.trim()) {
      return 'Enter a response before submitting.';
    }

    if (draftResponse.length > (poll.responseLimit ?? 500)) {
      return `Responses are limited to ${poll.responseLimit ?? 500} characters.`;
    }
  }

  return undefined;
}

function SessionLoadingState() {
  return (
    <main className="min-h-screen bg-mist-50 px-4 py-6 sm:px-6 sm:py-10 dark:bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center py-20 text-sm font-semibold text-muted-foreground">
        Loading session snapshot...
      </div>
    </main>
  );
}

function SessionUnavailableState() {
  return (
    <main className="min-h-screen bg-mist-50 px-4 py-6 sm:px-6 sm:py-10 dark:bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center py-20 text-sm font-semibold text-destructive">
        This session could not be loaded. Check the Invitation Link and try
        again.
      </div>
    </main>
  );
}

function SessionHeader({
  connectionState,
  sessionName,
}: Readonly<{
  connectionState: ParticipantSessionSnapshot['connectionState'];
  sessionName: string;
}>) {
  return (
    <GlassHeader containerClassName="max-w-3xl px-4 sm:px-6">
      <nav aria-label="Participant session navigation" className="flex w-full flex-wrap items-center justify-between gap-4">
        <ParticipantBrand aria-label="Pulse home" href="/" />
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
          <p className="max-w-48 truncate text-xs font-semibold text-muted-foreground sm:max-w-none">
            {sessionName}
          </p>
          <ParticipantConnectionStatus state={connectionState} />
          <ModeToggle />
        </div>
      </nav>
    </GlassHeader>
  );
}

function SessionError({ error }: Readonly<{ error?: string | null }>) {
  if (!error) {
    return null;
  }

  return (
    <p aria-live="polite" className="text-sm font-semibold text-destructive">
      {error}
    </p>
  );
}

type SessionStateViewProps = Readonly<{
  changeNameHref?: string;
  initialParticipantName?: string;
  isSubmitting: boolean;
  onChangeResponse: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  responseError?: string;
  snapshot: ParticipantSessionSnapshot;
}>;

function SessionStateView({
  changeNameHref,
  initialParticipantName,
  isSubmitting,
  onChangeResponse,
  onSubmit,
  responseError,
  snapshot,
}: SessionStateViewProps) {
  const {
    connectionState,
    participantCount,
    poll,
    pollLifecycle,
    response,
    responseState,
    resultVisibility,
    sessionLifecycle,
    sessionName,
  } = snapshot;

  if (sessionLifecycle === 'ended') {
    return (
      <ParticipantEndedSessionState
        poll={poll}
        resultVisibility={resultVisibility}
      />
    );
  }

  if (pollLifecycle === 'none') {
    return (
      <ParticipantWaitingState
        connectionState={connectionState}
        participantCount={participantCount}
        response={response}
        responseState={responseState}
        sessionName={sessionName}
      />
    );
  }

  if (pollLifecycle === 'closed') {
    return (
      <ParticipantClosedPollState
        poll={poll}
        response={response}
        responseState={responseState}
        resultVisibility={resultVisibility}
      />
    );
  }

  if (responseState === 'accepted') {
    return (
      <ParticipantAcceptedResponse
        changeNameHref={changeNameHref}
        connectionState={connectionState}
        onChangeResponse={onChangeResponse}
        participantName={initialParticipantName ?? ''}
        poll={poll}
        response={response}
        resultVisibility={resultVisibility}
      />
    );
  }

  return (
    <ParticipantPoll
      changeNameHref={changeNameHref}
      connectionState={connectionState}
      onSubmit={onSubmit}
      participantName={initialParticipantName ?? ''}
      poll={poll}
      response={response}
      responseError={responseError}
      responseState={isSubmitting ? 'pending' : responseState}
      resultVisibility={resultVisibility}
      sessionName={sessionName}
    />
  );
}

function SessionPrivacyNote() {
  return (
    <p className="px-1 text-center text-xs leading-5 text-muted-foreground">
      Your display name is session-local. Participant results show aggregates
      only, never names or individual open-ended responses.
    </p>
  );
}
