import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, EyeOff, ShieldCheck } from 'lucide-react';

import { Brand, Button, Callout, Field, Surface, TextInput } from '@/shared/ui';

export type ParticipantNameEntryState = 'idle' | 'joined' | 'joining';

export type ParticipantNameEntryPageProps = Readonly<{
  errorMessage?: string | null;
  initialName?: string;
  initialState?: ParticipantNameEntryState;
  isSubmitting?: boolean;
  onJoinSubmit?: (name: string) => Promise<void> | void;
  roomCode?: string;
  sessionName?: string;
}>;

export function ParticipantNameEntryPage({
  errorMessage,
  initialName = '',
  initialState = 'idle',
  isSubmitting = false,
  onJoinSubmit,
  roomCode = '7K4P9D',
  sessionName = 'Team offsite · June 2025',
}: ParticipantNameEntryPageProps = {}) {
  const [name, setName] = useState(initialName);
  const [state, setState] = useState<ParticipantNameEntryState>(initialState);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (state !== 'joining') {
      return;
    }

    if (!onJoinSubmit) {
      const timeoutId = globalThis.setTimeout(() => setState('joined'), 750);
      return () => globalThis.clearTimeout(timeoutId);
    }
  }, [state, onJoinSubmit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Enter a display name to join the session.');
      return;
    }

    if (trimmedName.length > 40) {
      setError('Display names must be 40 characters or fewer.');
      return;
    }

    setName(trimmedName);
    setError(undefined);
    setState('joining');

    if (onJoinSubmit) {
      try {
        await onJoinSubmit(trimmedName);
        setState('joined');
      } catch (err) {
        setState('idle');
        setError(err instanceof Error ? err.message : 'Failed to join session.');
      }
    }
  }

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
            <p className="font-[var(--font-mono)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">
              {sessionName}
            </p>
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
              What should we call you?
            </h1>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Enter a display name to join the session. No account is required.
            </p>
          </div>

          {errorMessage ? (
            <Callout icon="alertCircle" title="Error joining session" tone="error">
              {errorMessage}
            </Callout>
          ) : null}

          {state === 'joined' ? (
            <div className="flex flex-col gap-4">
              <Callout
                icon="check"
                role="status"
                title="You are ready to join"
                tone="success"
              >
                You are joining as{' '}
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {name}
                </span>
                . Your name is visible to the host only.
              </Callout>
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-text-on-primary)] transition-[filter,transform] hover:brightness-95 active:translate-y-px"
                href={`/participant/session?roomCode=${encodeURIComponent(roomCode)}`}
              >
                <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
                Open live session
              </a>
              <Button
                className="w-full"
                onClick={() => setState('idle')}
                type="button"
                variant="quiet"
              >
                Change display name
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-5"
              noValidate
              onSubmit={handleSubmit}
            >
              <Field
                error={error}
                hint="Names do not need to be unique. You can change yours later."
                id="participant-name"
                label="Display name"
                required
              >
                <TextInput
                  autoComplete="nickname"
                  id="participant-name"
                  invalid={Boolean(error)}
                  maxLength={40}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(undefined);
                  }}
                  placeholder="e.g. Avery"
                  value={name}
                />
              </Field>

              <Button
                className="w-full"
                disabled={state === 'joining' || isSubmitting}
                endIcon={state === 'joining' || isSubmitting ? 'loaderCircle' : 'arrowRight'}
                size="lg"
                type="submit"
              >
                {state === 'joining' || isSubmitting ? 'Joining session...' : 'Join session'}
              </Button>

              <p className="text-center text-xs leading-5 text-[var(--color-text-tertiary)]">
                Your display name can be changed later during the live session.
              </p>
            </form>
          )}

          <a
            className="text-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
            href={`/join?roomCode=${encodeURIComponent(roomCode)}`}
          >
            Use a different Room Code
          </a>
        </div>

        <aside className="flex flex-col justify-between gap-10 bg-[var(--color-primary)] p-7 text-[var(--color-text-on-primary)] sm:p-9">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold tracking-[-0.03em]">
                Your name is visible to the host.
              </h2>
              <p className="text-sm leading-6 text-[var(--color-text-on-primary-muted)]">
                Other participants will not see your display name or your
                individual responses.
              </p>
            </div>
            <div className="flex gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-inverse-muted)] p-4">
              <EyeOff
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-text-on-primary-soft)]"
                size={18}
              />
              <p className="text-sm leading-5 text-[var(--color-text-on-primary)]">
                Your identity is session-local and not verified.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <ShieldCheck
                aria-hidden="true"
                className="text-[var(--color-text-on-primary-soft)]"
                size={18}
              />
              Duplicate names are allowed.
            </div>
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-on-primary-soft)]">
            You can use a different display name in another browser or device.
          </p>
        </aside>
      </Surface>
    </main>
  );
}
