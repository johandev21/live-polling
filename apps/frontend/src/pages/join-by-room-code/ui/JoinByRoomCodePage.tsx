import { useState, type FormEvent } from 'react';
import { ArrowRight, RefreshCw, ShieldCheck, Zap } from 'lucide-react';

import { Brand, Button, Callout, Field, Surface, TextInput } from '@/shared/ui';

import {
  normalizeRoomCode,
  type RoomCodeStatus,
} from '../model/join-by-room-code';

export type JoinByRoomCodePageProps = Readonly<{
  errorMessage?: string | null;
  initialRoomCode?: string;
  isSubmitting?: boolean;
  onJoinSubmit?: (roomCode: string) => Promise<void> | void;
  statusOverride?: RoomCodeStatus;
}>;

const statusCopy = {
  draft: {
    body: 'This session is still being prepared by its host. Ask the host to start it before joining.',
    title: 'This session is not live yet',
    tone: 'warning',
  },
  ended: {
    body: 'This session has ended and no longer accepts new participants.',
    title: 'This session has ended',
    tone: 'neutral',
  },
  invalid: {
    body: 'Check the Room Code and try again. It should contain six letters or numbers.',
    title: 'We could not find that Room Code',
    tone: 'error',
  },
  unavailable: {
    body: 'The session service is temporarily unavailable. Keep the code and try again shortly.',
    title: 'The session is unavailable right now',
    tone: 'error',
  },
} satisfies Record<
  Exclude<RoomCodeStatus, 'idle' | 'ready'>,
  { body: string; title: string; tone: 'error' | 'neutral' | 'warning' }
>;

export function JoinByRoomCodePage({
  errorMessage,
  initialRoomCode = '',
  isSubmitting = false,
  onJoinSubmit,
  statusOverride,
}: JoinByRoomCodePageProps = {}) {
  const [roomCode, setRoomCode] = useState(() =>
    normalizeRoomCode(initialRoomCode),
  );
  const [status, setStatus] = useState<RoomCodeStatus>('idle');

  const activeStatus = statusOverride ?? status;
  const codeError = activeStatus === 'invalid' ? statusCopy.invalid.body : undefined;

  function handleRoomCodeChange(value: string) {
    setRoomCode(normalizeRoomCode(value));
    setStatus('idle');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized || normalized.length < 6) {
      setStatus('invalid');
      return;
    }

    if (onJoinSubmit) {
      try {
        await onJoinSubmit(normalized);
      } catch {
        setStatus('idle');
      }
    }
  }

  const invitationPath = roomCode
    ? `/join/invitation?roomCode=${encodeURIComponent(roomCode)}`
    : '/join/invitation';

  return (
    <main className="min-h-screen bg-[var(--color-bg-canvas)] px-4 py-8 sm:px-6 lg:grid lg:place-items-center lg:px-8">
      <Surface
        as="section"
        className="mx-auto grid w-full max-w-4xl overflow-hidden p-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]"
        elevation="card"
        padding="none"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-9">
          <Brand aria-label="Pulse home" href="/" size="lg" />
          <div className="flex flex-col gap-3">
            <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.15em] text-[var(--color-primary)]">
              PARTICIPANT ACCESS
            </p>
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
              Join a session
            </h1>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Enter the Room Code shared by your host. Room Codes are not
              case-sensitive.
            </p>
          </div>

          {errorMessage ? (
            <Callout icon="alertCircle" title="Unable to join" tone="error">
              {errorMessage}
            </Callout>
          ) : null}

          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={handleSubmit}
          >
            <Field
              error={codeError}
              hint="We will normalize the code to uppercase for readability."
              id="room-code"
              label="Room Code"
              required
            >
              <TextInput
                autoCapitalize="characters"
                autoComplete="off"
                className="font-[var(--font-mono)] text-lg font-bold tracking-[0.16em]"
                inputMode="text"
                invalid={Boolean(codeError)}
                maxLength={6}
                onChange={(event) => handleRoomCodeChange(event.target.value)}
                placeholder="e.g. 7K4P9D"
                spellCheck={false}
                value={roomCode}
              />
            </Field>

            <Button
              className="w-full"
              disabled={isSubmitting}
              endIcon={isSubmitting ? 'loaderCircle' : 'arrowRight'}
              size="lg"
              type="submit"
            >
              {isSubmitting ? 'Verifying code...' : 'Join session'}
            </Button>
          </form>

          {activeStatus === 'ready' ? (
            <Callout icon="check" title="Session found" tone="success">
              You are ready to choose a session-local display name before
              joining.
              <a
                className="mt-3 inline-flex items-center gap-2 font-semibold text-[var(--color-primary)] hover:underline"
                href={`/join/name?roomCode=${encodeURIComponent(roomCode)}`}
              >
                Continue to display name
                <ArrowRight aria-hidden="true" size={15} />
              </a>
            </Callout>
          ) : activeStatus !== 'idle' ? (
            <Callout
              icon={activeStatus === 'unavailable' ? 'wifiOff' : 'alertCircle'}
              title={statusCopy[activeStatus].title}
              tone={statusCopy[activeStatus].tone}
            >
              {statusCopy[activeStatus].body}
            </Callout>
          ) : null}

          <a
            className="text-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
            href={invitationPath}
          >
            Have an Invitation Link? Open it directly instead.
          </a>
        </div>

        <aside className="flex flex-col justify-between gap-10 bg-[var(--color-primary)] p-7 text-[var(--color-text-on-primary)] sm:p-9">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold tracking-[-0.03em]">
                No account needed.
              </h2>
              <p className="text-sm leading-6 text-[var(--color-text-on-primary-muted)]">
                Participants join with a session-local identity. Your display
                name is visible to the host, not to other participants.
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              <li className="flex items-center gap-3 text-sm font-semibold">
                <Zap
                  aria-hidden="true"
                  className="text-[var(--color-text-on-primary-soft)]"
                  size={17}
                />
                Join in seconds
              </li>
              <li className="flex items-center gap-3 text-sm font-semibold">
                <ShieldCheck
                  aria-hidden="true"
                  className="text-[var(--color-text-on-primary-soft)]"
                  size={17}
                />
                Private by default
              </li>
              <li className="flex items-center gap-3 text-sm font-semibold">
                <RefreshCw
                  aria-hidden="true"
                  className="text-[var(--color-text-on-primary-soft)]"
                  size={17}
                />
                Change responses while open
              </li>
            </ul>
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-on-primary-soft)]">
            You can use a different identity in another browser or device.
          </p>
        </aside>
      </Surface>
    </main>
  );
}
