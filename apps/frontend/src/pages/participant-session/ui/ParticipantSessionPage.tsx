import { useEffect, useState, type FormEvent } from 'react';

import { Brand, ConnectionStatus } from '@/shared/ui';
import type { ConnectionState } from '@/shared/ui';

import {
  demoResponseForPoll,
  participantFixtureSnapshot,
  participantPollFixtures,
  responseDraftForPoll,
  type ParticipantPollType,
  type ParticipantPollLifecycle,
  type ParticipantResponse,
  type ParticipantResponseState,
  type ParticipantResultVisibility,
  type ParticipantSessionLifecycle,
  type ParticipantSessionSnapshot,
} from '../model/participant-session';
import { ParticipantAcceptedResponse } from './ParticipantResponseState';
import { ParticipantPoll, type ResponseDraft } from './ParticipantPoll';
import {
  ParticipantClosedPollState,
  ParticipantEndedSessionState,
  ParticipantWaitingState,
} from './ParticipantSessionState';

export type ParticipantSessionPageProps = Readonly<{
  initialParticipantName?: string;
  initialSnapshot?: ParticipantSessionSnapshot;
}>;

const selectClassName = [
  'min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)]',
  'bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]',
  'focus-visible:border-[var(--color-primary)]',
].join(' ');

function cloneResponse(value: ResponseDraft): ParticipantResponse {
  return Array.isArray(value) ? [...value] : value;
}

function editableResponseFromStored(
  response: ParticipantResponse,
  poll: ParticipantSessionSnapshot['poll'],
): ResponseDraft {
  if (response === null) {
    return responseDraftForPoll(poll);
  }

  return typeof response === 'string' ? response : [...response];
}

function demoDraftForState(
  state: ParticipantResponseState,
  poll: ParticipantSessionSnapshot['poll'],
): ResponseDraft {
  return state === 'none'
    ? responseDraftForPoll(poll)
    : demoResponseForPoll(poll);
}

function ParticipantStateControls({
  snapshot,
  onConnectionStateChange,
  onPollLifecycleChange,
  onPollTypeChange,
  onResponseStateChange,
  onResultVisibilityChange,
  onSessionLifecycleChange,
}: Readonly<{
  onConnectionStateChange: (state: ConnectionState) => void;
  onPollLifecycleChange: (lifecycle: ParticipantPollLifecycle) => void;
  onPollTypeChange: (type: ParticipantPollType) => void;
  onResponseStateChange: (state: ParticipantResponseState) => void;
  onResultVisibilityChange: (visibility: ParticipantResultVisibility) => void;
  onSessionLifecycleChange: (lifecycle: ParticipantSessionLifecycle) => void;
  snapshot: ParticipantSessionSnapshot;
}>) {
  return (
    <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <summary className="cursor-pointer text-sm font-bold text-[var(--color-text-primary)]">
        Explore participant states
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          Session lifecycle
          <select
            className={selectClassName}
            onChange={(event) =>
              onSessionLifecycleChange(
                event.target.value as ParticipantSessionLifecycle,
              )
            }
            value={snapshot.sessionLifecycle}
          >
            <option value="live">Live session</option>
            <option value="ended">Ended session</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          Poll lifecycle
          <select
            className={selectClassName}
            onChange={(event) =>
              onPollLifecycleChange(
                event.target.value as ParticipantPollLifecycle,
              )
            }
            value={snapshot.pollLifecycle}
          >
            <option value="none">Waiting - no active poll</option>
            <option value="open">Open poll</option>
            <option value="closed">Closed poll</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          Poll type
          <select
            className={selectClassName}
            onChange={(event) =>
              onPollTypeChange(event.target.value as ParticipantPollType)
            }
            value={snapshot.poll.type}
          >
            <option value="single-choice">Single-choice</option>
            <option value="multiple-choice">Multiple-choice</option>
            <option value="open-ended">Open-ended</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          Result visibility
          <select
            className={selectClassName}
            onChange={(event) =>
              onResultVisibilityChange(
                event.target.value as ParticipantResultVisibility,
              )
            }
            value={snapshot.resultVisibility}
          >
            <option value="hidden">Hidden from participants</option>
            <option value="revealed">Revealed to participants</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          Response state
          <select
            className={selectClassName}
            onChange={(event) =>
              onResponseStateChange(
                event.target.value as ParticipantResponseState,
              )
            }
            value={snapshot.responseState}
          >
            <option value="none">No accepted response</option>
            <option value="pending">Pending confirmation</option>
            <option value="accepted">Accepted by server</option>
            <option value="rejected">Rejected - retry needed</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          Connection state
          <select
            className={selectClassName}
            onChange={(event) =>
              onConnectionStateChange(event.target.value as ConnectionState)
            }
            value={snapshot.connectionState}
          >
            <option value="connected">Connected</option>
            <option value="synchronized">Reconnected and synchronized</option>
            <option value="reconnecting">Reconnecting</option>
            <option value="stale">Refresh needed</option>
            <option value="connecting">Connecting</option>
          </select>
        </label>
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--color-text-tertiary)]">
        These local controls model session, poll, result, response, and
        connection values independently. Reconnecting never changes an accepted
        response.
      </p>
    </details>
  );
}

export function ParticipantSessionPage({
  initialParticipantName = 'Avery',
  initialSnapshot,
}: ParticipantSessionPageProps = {}) {
  const initial = initialSnapshot ?? participantFixtureSnapshot;
  const [snapshot, setSnapshot] = useState<ParticipantSessionSnapshot>(initial);
  const [draftResponse, setDraftResponse] = useState<ResponseDraft>(() =>
    editableResponseFromStored(initial.response, initial.poll),
  );
  const [responseError, setResponseError] = useState<string>();

  useEffect(() => {
    if (snapshot.responseState !== 'pending') {
      return;
    }

    const submittedResponse = cloneResponse(draftResponse);
    const timeoutId = globalThis.setTimeout(() => {
      setSnapshot((current) =>
        current.responseState === 'pending'
          ? {
              ...current,
              response: submittedResponse,
              responseState: 'accepted',
            }
          : current,
      );
    }, 850);

    return () => globalThis.clearTimeout(timeoutId);
  }, [draftResponse, snapshot.responseState]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    setSnapshot((current) => ({
      ...current,
      response: null,
      responseState: 'pending',
    }));
  }

  function handleChangeResponse() {
    setDraftResponse(
      editableResponseFromStored(snapshot.response, snapshot.poll),
    );
    setResponseError(undefined);
    setSnapshot((current) => ({
      ...current,
      response: null,
      responseState: 'none',
    }));
  }

  function handlePollTypeChange(type: ParticipantPollType) {
    const poll = participantPollFixtures[type];
    setDraftResponse(responseDraftForPoll(poll));
    setResponseError(undefined);
    setSnapshot((current) => ({
      ...current,
      poll,
      response: null,
      responseState: 'none',
    }));
  }

  function handleResponseStateChange(responseState: ParticipantResponseState) {
    const nextDraft = demoDraftForState(responseState, snapshot.poll);
    setDraftResponse(nextDraft);
    setResponseError(undefined);
    setSnapshot((current) => ({
      ...current,
      response: responseState === 'accepted' ? cloneResponse(nextDraft) : null,
      responseState,
    }));
  }

  function handlePollLifecycleChange(pollLifecycle: ParticipantPollLifecycle) {
    setResponseError(undefined);
    setSnapshot((current) => ({ ...current, pollLifecycle }));
  }

  function handleSessionLifecycleChange(
    sessionLifecycle: ParticipantSessionLifecycle,
  ) {
    setResponseError(undefined);
    setSnapshot((current) => ({ ...current, sessionLifecycle }));
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-canvas)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-4 px-1">
          <Brand aria-label="Pulse home" href="/" size="md" />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <p className="max-w-48 truncate text-xs font-semibold text-[var(--color-text-secondary)] sm:max-w-none">
              {snapshot.sessionName}
            </p>
            <ConnectionStatus state={snapshot.connectionState} />
          </div>
        </header>

        <ParticipantStateControls
          onConnectionStateChange={(connectionState) =>
            setSnapshot((current) => ({ ...current, connectionState }))
          }
          onPollLifecycleChange={handlePollLifecycleChange}
          onPollTypeChange={handlePollTypeChange}
          onResponseStateChange={handleResponseStateChange}
          onResultVisibilityChange={(resultVisibility) =>
            setSnapshot((current) => ({ ...current, resultVisibility }))
          }
          onSessionLifecycleChange={handleSessionLifecycleChange}
          snapshot={snapshot}
        />

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
            connectionState={snapshot.connectionState}
            onChangeResponse={handleChangeResponse}
            participantName={initialParticipantName}
            poll={snapshot.poll}
            response={snapshot.response}
            resultVisibility={snapshot.resultVisibility}
          />
        ) : (
          <ParticipantPoll
            connectionState={snapshot.connectionState}
            draftResponse={draftResponse}
            onChangeDraft={(nextResponse) => {
              setDraftResponse(nextResponse);
              setResponseError(undefined);
            }}
            onSubmit={handleSubmit}
            participantName={initialParticipantName}
            poll={snapshot.poll}
            response={snapshot.response}
            responseError={responseError}
            responseState={snapshot.responseState}
            resultVisibility={snapshot.resultVisibility}
            sessionName={snapshot.sessionName}
          />
        )}

        <p className="px-1 text-center text-xs leading-5 text-[var(--color-text-tertiary)]">
          Your display name is session-local. Participant results show
          aggregates only, never names or individual open-ended responses.
        </p>
      </div>
    </main>
  );
}
