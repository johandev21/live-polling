import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  responseDraftForPoll,
  type ParticipantResponse,
  type ParticipantSessionSnapshot,
} from '../model/participant-session';
import { ParticipantAcceptedResponse } from './ParticipantResponseState';
import { ParticipantPoll, type ResponseDraft } from './ParticipantPoll';
import {
  ParticipantClosedPollState,
  ParticipantEndedSessionState,
  ParticipantWaitingState,
} from './ParticipantSessionState';
import {
  ParticipantBrand,
  ParticipantConnectionStatus,
} from './ParticipantSessionPrimitives';

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
  const [draftResponse, setDraftResponse] = useState<ResponseDraft>(() =>
    editableResponseFromStored(snapshot.response, snapshot.poll),
  );
  const [responseError, setResponseError] = useState<string>();
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  useEffect(() => {
    const { response, poll } = snapshotRef.current;
    setDraftResponse(editableResponseFromStored(response, poll));
    setResponseError(undefined);
    // Reset the draft when the active poll changes.
  }, [snapshot.poll.id]);

  function handleChangeDraft(nextResponse: ResponseDraft) {
    setDraftResponse(nextResponse);
    setResponseError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateDraft(snapshot, draftResponse);
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
      await onResponseSubmit(draftResponse);
    } catch (err) {
      setResponseError(
        err instanceof Error ? err.message : 'Failed to send response.',
      );
    }
  }

  function handleChangeResponse() {
    setDraftResponse(
      editableResponseFromStored(snapshot.response, snapshot.poll),
    );
    setResponseError(undefined);
  }

  if (isLoading) {
    return <SessionLoadingState />;
  }

  if (!initialSnapshot) {
    return <SessionUnavailableState />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <SessionHeader
          connectionState={snapshot.connectionState}
          sessionName={snapshot.sessionName}
        />

        <SessionError error={errorMessage || responseError} />

        <SessionStateView
          changeNameHref={changeNameHref}
          draftResponse={draftResponse}
          initialParticipantName={initialParticipantName}
          isSubmitting={isSubmitting}
          onChangeDraft={handleChangeDraft}
          onChangeResponse={handleChangeResponse}
          onSubmit={handleSubmit}
          responseError={responseError}
          snapshot={snapshot}
        />

        <SessionPrivacyNote />
      </div>
    </main>
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

function editableResponseFromStored(
  response: ParticipantResponse,
  poll: ParticipantSessionSnapshot['poll'],
): ResponseDraft {
  if (response === null) {
    return responseDraftForPoll(poll);
  }

  return typeof response === 'string' ? response : [...response];
}

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
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center py-20 text-sm font-semibold text-muted-foreground">
        Loading session snapshot...
      </div>
    </main>
  );
}

function SessionUnavailableState() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
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
    <header className="flex flex-wrap items-center justify-between gap-4 px-1">
      <ParticipantBrand aria-label="Pulse home" href="/" />
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
        <p className="max-w-48 truncate text-xs font-semibold text-muted-foreground sm:max-w-none">
          {sessionName}
        </p>
        <ParticipantConnectionStatus state={connectionState} />
      </div>
    </header>
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
  draftResponse: ResponseDraft;
  initialParticipantName?: string;
  isSubmitting: boolean;
  onChangeDraft: (response: ResponseDraft) => void;
  onChangeResponse: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  responseError?: string;
  snapshot: ParticipantSessionSnapshot;
}>;

function SessionStateView({
  changeNameHref,
  draftResponse,
  initialParticipantName,
  isSubmitting,
  onChangeDraft,
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
      draftResponse={draftResponse}
      onChangeDraft={onChangeDraft}
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
      Your display name is session-local. Participant results show
      aggregates only, never names or individual open-ended responses.
    </p>
  );
}
