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

  function handleNameChange(value: string) {
    setName(value);
    setError(undefined);
  }

  function handleChangeName() {
    setState('idle');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const validationError = validateName(trimmedName);
    if (validationError) {
      setError(validationError);
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
    <main className="min-h-screen bg-mist-50 dark:bg-background px-4 py-8 sm:px-6 lg:grid lg:place-items-center lg:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <Card className="grid w-full overflow-hidden p-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]">
          <NameEntryPanel
            error={error}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            joinedHref={joinedHref}
            name={name}
            onChangeName={handleChangeName}
            onNameChange={handleNameChange}
            onSubmit={handleSubmit}
            roomCode={roomCode}
            sessionName={sessionName}
            state={state}
          />
          <NamePrivacyAside />
        </Card>
      </section>
    </main>
  );
}

function validateName(name: string): string | undefined {
  if (!name) {
    return 'Enter a display name to join the session.';
  }
  if (name.length > 40) {
    return 'Display names must be 40 characters or fewer.';
  }
  return undefined;
}

type NameEntryPanelProps = Readonly<{
  error?: string;
  errorMessage?: string | null;
  isSubmitting: boolean;
  joinedHref?: string;
  name: string;
  onChangeName: () => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  roomCode?: string;
  sessionName?: string;
  state: ParticipantNameEntryState;
}>;

function NameEntryPanel({
  error,
  errorMessage,
  isSubmitting,
  joinedHref,
  name,
  onChangeName,
  onNameChange,
  onSubmit,
  roomCode,
  sessionName,
  state,
}: NameEntryPanelProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-9">
      <Brand aria-label="Pulse home" href="/" size="lg" />
      <NameEntryHeader sessionName={sessionName} />
      {errorMessage ? <JoinErrorAlert errorMessage={errorMessage} /> : null}
      {state === 'joined' ? (
        <JoinedStateCard
          joinedHref={joinedHref}
          name={name}
          onChangeName={onChangeName}
        />
      ) : (
        <NameEntryForm
          error={error}
          isSubmitting={isSubmitting}
          name={name}
          onNameChange={onNameChange}
          onSubmit={onSubmit}
          state={state}
        />
      )}
      <DifferentRoomCodeLink roomCode={roomCode} />
    </div>
  );
}

function NameEntryHeader({ sessionName }: { sessionName?: string }) {
  return (
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
  );
}

function JoinErrorAlert({ errorMessage }: { errorMessage: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error joining session</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}

type JoinedStateCardProps = Readonly<{
  joinedHref?: string;
  name: string;
  onChangeName: () => void;
}>;

function JoinedStateCard({
  joinedHref,
  name,
  onChangeName,
}: JoinedStateCardProps) {
  return (
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
        onClick={onChangeName}
        type="button"
        variant="ghost"
      >
        Change display name
      </Button>
    </div>
  );
}

type NameEntryFormProps = Readonly<{
  error?: string;
  isSubmitting: boolean;
  name: string;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  state: ParticipantNameEntryState;
}>;

function NameEntryForm({
  error,
  isSubmitting,
  name,
  onNameChange,
  onSubmit,
  state,
}: NameEntryFormProps) {
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={onSubmit}
    >
      <NameInputField
        error={error}
        name={name}
        onNameChange={onNameChange}
      />
      <NameSubmitButton isSubmitting={isSubmitting} state={state} />
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Your display name can be changed later during the live
        session.
      </p>
    </form>
  );
}

type NameInputFieldProps = Readonly<{
  error?: string;
  name: string;
  onNameChange: (value: string) => void;
}>;

function NameInputField({ error, name, onNameChange }: NameInputFieldProps) {
  return (
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
        onChange={(event) => onNameChange(event.target.value)}
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
  );
}

type NameSubmitButtonProps = Readonly<{
  isSubmitting: boolean;
  state: ParticipantNameEntryState;
}>;

function NameSubmitButton({ isSubmitting, state }: NameSubmitButtonProps) {
  const isBusy = state === 'joining' || isSubmitting;
  return (
    <Button
      className="w-full"
      disabled={isBusy}
      size="lg"
      type="submit"
    >
      {isBusy ? (
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
  );
}

function DifferentRoomCodeLink({ roomCode }: { roomCode?: string }) {
  return (
    <a
      className="text-center text-sm font-semibold text-primary hover:underline"
      href={`/join?roomCode=${encodeURIComponent(roomCode ?? '')}`}
    >
      Use a different Room Code
    </a>
  );
}

function NamePrivacyAside() {
  return (
    <aside className="flex flex-col justify-between gap-10 bg-muted/60 p-7 text-foreground sm:p-9">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">
            Your name is visible to the host.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Other participants will not see your display name or your
            individual responses.
          </p>
        </div>
        <div className="flex gap-3 rounded-lg bg-muted p-4">
          <EyeOff
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-muted-foreground"
            size={18}
          />
          <p className="text-sm leading-5 text-foreground">
            Your identity is session-local and not verified.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <ShieldCheck
            aria-hidden="true"
            className="text-muted-foreground"
            size={18}
          />
          <span>Private participant session</span>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Identity is remembered on this browser until the session ends.
      </p>
    </aside>
  );
}
