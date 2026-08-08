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

function editableResponseFromStored(
  response: ParticipantResponse,
  poll: ParticipantSessionSnapshot['poll'],
): ResponseDraft {
  if (response === null) {
    return responseDraftForPoll(poll);
  }

  return typeof response === 'string' ? response : [...response];
}

export function ParticipantSessionPage({
  changeNameHref,
  errorMessage,
  initialParticipantName,
  initialSnapshot,
  isLoading = false,
  isSubmitting = false,
  onResponseSubmit,
}: ParticipantSessionPageProps) {
  const snapshot = initialSnapshot ?? {
    connectionState: 'stale' as const,
    participantCount: 0,
    poll: {
      id: '',
      options: [],
      prompt: '',
      results: [],
      totalResponses: 0,
      type: 'single-choice' as const,
    },
    pollLifecycle: 'none' as const,
    response: null,
    responseState: 'none' as const,
    resultVisibility: 'hidden' as const,
    sessionLifecycle: 'live' as const,
    sessionName: 'Session unavailable',
  };
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { poll } = snapshot;

    if (snapshot.pollLifecycle !== 'open') {
      setResponseError('This poll is no longer accepting responses.');
      return;
    }

    if (snapshot.connectionState === 'stale') {
      setResponseError('Refresh the session before sending a new response.');
      return;
    }

    if (poll.type === 'single-choice') {
      if (typeof draftResponse !== 'string' || !draftResponse) {
        setResponseError('Select one option before submitting.');
        return;
      }
    } else if (poll.type === 'multiple-choice') {
      if (!Array.isArray(draftResponse) || draftResponse.length === 0) {
        setResponseError('Select at least one option before submitting.');
        return;
      }

      if (poll.maxSelections && draftResponse.length > poll.maxSelections) {
        setResponseError(`Choose no more than ${poll.maxSelections} options.`);
        return;
      }
    } else {
      if (typeof draftResponse !== 'string' || !draftResponse.trim()) {
        setResponseError('Enter a response before submitting.');
        return;
      }

      if (draftResponse.length > (poll.responseLimit ?? 500)) {
        setResponseError(
          `Responses are limited to ${poll.responseLimit ?? 500} characters.`,
        );
        return;
      }
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
    setDraftResponse(editableResponseFromStored(snapshot.response, snapshot.poll));
    setResponseError(undefined);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center py-20 text-sm font-semibold text-muted-foreground">
          Loading session snapshot...
        </div>
      </main>
    );
  }

  if (!initialSnapshot) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center py-20 text-sm font-semibold text-destructive">
          This session could not be loaded. Check the Invitation Link and try
          again.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-4 px-1">
          <ParticipantBrand aria-label="Pulse home" href="/" />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <p className="max-w-48 truncate text-xs font-semibold text-muted-foreground sm:max-w-none">
              {snapshot.sessionName}
            </p>
            <ParticipantConnectionStatus state={snapshot.connectionState} />
          </div>
        </header>

        {errorMessage || responseError ? (
          <p
            aria-live="polite"
            className="text-sm font-semibold text-destructive"
          >
            {errorMessage || responseError}
          </p>
        ) : null}

        {snapshot.sessionLifecycle === 'ended' ? (
          <ParticipantEndedSessionState
            poll={snapshot.poll}
            resultVisibility={snapshot.resultVisibility}
          />
        ) : snapshot.pollLifecycle === 'none' ? (
          <ParticipantWaitingState
            connectionState={snapshot.connectionState}
            participantCount={snapshot.participantCount}
            response={snapshot.response}
            responseState={snapshot.responseState}
            sessionName={snapshot.sessionName}
          />
        ) : snapshot.pollLifecycle === 'closed' ? (
          <ParticipantClosedPollState
            poll={snapshot.poll}
            response={snapshot.response}
            responseState={snapshot.responseState}
            resultVisibility={snapshot.resultVisibility}
          />
        ) : snapshot.responseState === 'accepted' ? (
          <ParticipantAcceptedResponse
            changeNameHref={changeNameHref}
            connectionState={snapshot.connectionState}
            onChangeResponse={handleChangeResponse}
            participantName={initialParticipantName ?? ''}
            poll={snapshot.poll}
            response={snapshot.response}
            resultVisibility={snapshot.resultVisibility}
          />
        ) : (
          <ParticipantPoll
            changeNameHref={changeNameHref}
            connectionState={snapshot.connectionState}
            draftResponse={draftResponse}
            onChangeDraft={(nextResponse) => {
              setDraftResponse(nextResponse);
              setResponseError(undefined);
            }}
            onSubmit={handleSubmit}
            participantName={initialParticipantName ?? ''}
            poll={snapshot.poll}
            response={snapshot.response}
            responseError={responseError}
            responseState={
              isSubmitting ? 'pending' : snapshot.responseState
            }
            resultVisibility={snapshot.resultVisibility}
            sessionName={snapshot.sessionName}
          />
        )}

        <p className="px-1 text-center text-xs leading-5 text-muted-foreground">
          Your display name is session-local. Participant results show
          aggregates only, never names or individual open-ended responses.
        </p>
      </div>
    </main>
  );
}
