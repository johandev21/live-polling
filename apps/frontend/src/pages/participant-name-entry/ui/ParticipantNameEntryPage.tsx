import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brand } from '@/shared/ui';

export type ParticipantNameEntryState = 'idle' | 'joined' | 'joining';

export type ParticipantNameEntryPageProps = Readonly<{
  errorMessage?: string | null;
  initialName?: string;
  initialState?: ParticipantNameEntryState;
  isSubmitting?: boolean;
  joinedHref?: string;
  onJoinSubmit?: (name: string) => Promise<void> | void;
  roomCode?: string;
  sessionName?: string;
}>;

export function ParticipantNameEntryPage({
  errorMessage,
  initialName = '',
  initialState = 'idle',
  isSubmitting = false,
  joinedHref,
  onJoinSubmit,
  roomCode,
  sessionName,
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
        setError(
          err instanceof Error ? err.message : 'Failed to join session.',
        );
      }
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:grid lg:place-items-center lg:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <Card className="grid w-full overflow-hidden p-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]">
          <div className="flex flex-col gap-6 p-6 sm:p-9">
            <Brand aria-label="Pulse home" href="/" size="lg" />
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs font-bold tracking-[0.15em] text-primary uppercase">
                {sessionName ?? 'Join a session'}
              </p>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
                What should we call you?
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Enter a display name to join the session. No account is
                required.
              </p>
            </div>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Error joining session</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {state === 'joined' ? (
              <div className="flex flex-col gap-4">
                <Alert
                  className="border-border bg-muted"
                  role="status"
                >
                  <Check />
                  <AlertTitle>You are ready to join</AlertTitle>
                  <AlertDescription>
                    You are joining as{' '}
                    <span className="font-semibold text-foreground">
                      {name}
                    </span>
                    . Your name is visible to the host only.
                  </AlertDescription>
                </Alert>
                {joinedHref ? (
                  <a
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-95 active:translate-y-px"
                    href={joinedHref}
                  >
                    <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
                    Open live session
                  </a>
                ) : null}
                <Button
                  className="w-full"
                  onClick={() => setState('idle')}
                  type="button"
                  variant="ghost"
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
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor="participant-name">
                    Display name{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </Label>
                  <Input
                    autoComplete="nickname"
                    aria-describedby={
                      error
                        ? 'participant-name-hint participant-name-error'
                        : 'participant-name-hint'
                    }
                    aria-invalid={Boolean(error)}
                    className="h-12"
                    id="participant-name"
                    maxLength={40}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError(undefined);
                    }}
                    placeholder="e.g. Avery"
                    value={name}
                  />
                  <p
                    className="text-xs leading-5 text-muted-foreground"
                    id="participant-name-hint"
                  >
                    Names do not need to be unique. You can change yours later.
                  </p>
                  {error ? (
                    <p
                      className="text-xs leading-5 text-destructive"
                      id="participant-name-error"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>

                <Button
                  className="w-full"
                  disabled={state === 'joining' || isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {state === 'joining' || isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      Joining session...
                    </>
                  ) : (
                    <>
                      <ArrowRight />
                      Join session
                    </>
                  )}
                </Button>

                <p className="text-center text-xs leading-5 text-muted-foreground">
                  Your display name can be changed later during the live
                  session.
                </p>
              </form>
            )}

            <a
              className="text-center text-sm font-semibold text-primary hover:underline"
              href={`/join?roomCode=${encodeURIComponent(roomCode ?? '')}`}
            >
              Use a different Room Code
            </a>
          </div>

          <aside className="flex flex-col justify-between gap-10 bg-primary p-7 text-primary-foreground sm:p-9">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-bold tracking-[-0.03em]">
                  Your name is visible to the host.
                </h2>
                <p className="text-sm leading-6 text-primary-foreground/80">
                  Other participants will not see your display name or your
                  individual responses.
                </p>
              </div>
              <div className="flex gap-3 rounded-lg bg-foreground/10 p-4">
                <EyeOff
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary-foreground/80"
                  size={18}
                />
                <p className="text-sm leading-5 text-primary-foreground">
                  Your identity is session-local and not verified.
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold">
                <ShieldCheck
                  aria-hidden="true"
                  className="text-primary-foreground/80"
                  size={18}
                />
                Duplicate names are allowed.
              </div>
            </div>
            <p className="text-xs leading-5 text-primary-foreground/80">
              You can use a different display name in another browser or device.
            </p>
          </aside>
        </Card>
      </section>
    </main>
  );
}
