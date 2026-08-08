import { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Brand } from '@/shared/ui/brand';

import {
  emptyCreateSessionDraft,
  type CreateSessionDraft,
} from '../model/create-session';

export type CreateSessionPageProps = Readonly<{
  errorMessage?: string | null;
  initialDraft?: CreateSessionDraft;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onContinue?: (draft: CreateSessionDraft) => void;
  onCreateSessionSubmit?: (name: string) => Promise<void> | void;
}>;

export function CreateSessionPage({
  errorMessage,
  initialDraft = emptyCreateSessionDraft,
  isSubmitting = false,
  onCancel,
  onContinue,
  onCreateSessionSubmit,
}: CreateSessionPageProps) {
  const [sessionName, setSessionName] = useState(initialDraft.name);
  const [nameError, setNameError] = useState<string | undefined>();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const draft: CreateSessionDraft = {
    ...initialDraft,
    lifecycle: 'draft',
    name: sessionName,
  };
  const displayName = draft.name.trim() || 'Your session name';

  function handleNameChange(value: string) {
    setSessionName(value);
    if (nameError && value.trim()) {
      setNameError(undefined);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = sessionName.trim();

    if (!trimmedName) {
      setNameError(
        'Add a name so participants know what this session is about.',
      );
      return;
    }

    setNameError(undefined);

    if (onCreateSessionSubmit) {
      try {
        await onCreateSessionSubmit(trimmedName);
      } catch (err) {
        setNameError(
          err instanceof Error ? err.message : 'Failed to create session.',
        );
        return;
      }
    }

    const nextDraft: CreateSessionDraft = {
      ...draft,
      name: trimmedName,
    };
    setActionMessage('Draft session created. Add your first poll to continue.');
    onContinue?.(nextDraft);
  }

  function handleCancel() {
    setActionMessage('Session creation cancelled.');
    onCancel?.();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCancel={handleCancel} />
      <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,600px)_minmax(320px,440px)] lg:items-start lg:gap-16 lg:px-10">
        <section className="flex flex-col gap-7">
          <CreateSessionIntro />
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Error creating session</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <SessionNameForm
            isSubmitting={isSubmitting}
            nameError={nameError}
            onCancel={handleCancel}
            onNameChange={handleNameChange}
            onSubmit={handleSubmit}
            sessionName={sessionName}
          />
          <DraftSessionNotice />
          {actionMessage ? (
            <p
              aria-live="polite"
              className="text-sm font-semibold text-muted-foreground"
            >
              {actionMessage}
            </p>
          ) : null}
        </section>

        <SessionPreviewCard displayName={displayName} draft={draft} />
      </main>
    </div>
  );
}

function CreateSessionIntro() {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.16em] text-foreground">
        NEW SESSION
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
        Create a session
      </h1>
      <p className="mt-3 max-w-xl text-base leading-6 text-muted-foreground">
        Give your session a clear name. You can add polls and arrange them
        next.
      </p>
    </div>
  );
}

function SessionNameForm({
  isSubmitting,
  nameError,
  onCancel,
  onNameChange,
  onSubmit,
  sessionName,
}: {
  isSubmitting: boolean;
  nameError?: string;
  onCancel: () => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  sessionName: string;
}) {
  return (
    <Card className="p-6 sm:p-7">
      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <Field>
          <FieldLabel htmlFor="session-name">
            Session name <span aria-hidden="true" className="text-destructive">*</span>
          </FieldLabel>
          <Input
            autoComplete="off"
            maxLength={120}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Team offsite - June 2025"
            value={sessionName}
          />
          <FieldDescription>Required - up to 120 characters</FieldDescription>
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Button onClick={onCancel} type="button" variant="outline" size="lg">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit" size="lg">
            <ArrowRight aria-hidden="true" size={16} />
            {isSubmitting ? 'Creating session...' : 'Add your first poll'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DraftSessionNotice() {
  return (
    <Alert role="note">
      <Info />
      <AlertTitle>Draft Session</AlertTitle>
      <AlertDescription>
        This session starts as a Draft Session. Participants cannot join
        until you add at least one poll and start it.
      </AlertDescription>
    </Alert>
  );
}

function SessionPreviewCard({
  displayName,
  draft,
}: {
  displayName: string;
  draft: CreateSessionDraft;
}) {
  return (
    <Card
      aria-labelledby="session-preview-heading"
      className="flex flex-col gap-6 p-6 sm:p-7 lg:sticky lg:top-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary" role="status">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          Draft Session
        </Badge>
        <span className="text-xs text-muted-foreground">Not joinable</span>
      </div>
      <div>
        <h2
          className="text-2xl font-bold wrap-break-word text-foreground"
          id="session-preview-heading"
        >
          {displayName}
        </h2>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          Your polls will appear here in the order you create them.
        </p>
      </div>
      <Separator />
      <dl className="flex items-center justify-between gap-4">
        <dt className="text-sm text-muted-foreground">Polls</dt>
        <dd className="font-mono text-2xl font-bold text-foreground">
          {draft.polls.length}
        </dd>
      </dl>
      <PollPreviewList polls={draft.polls} />
      <p className="text-xs leading-5 text-muted-foreground">
        Participants cannot join yet
      </p>
    </Card>
  );
}

function PollPreviewList({ polls }: { polls: CreateSessionDraft['polls'] }) {
  if (polls.length === 0) {
    return (
      <div className="rounded-md bg-muted p-4">
        <p className="text-sm font-semibold text-foreground">No polls yet</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Save this draft to open the poll builder and define the first
          response.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2" aria-label="Draft poll preview">
      {polls.map((poll) => (
        <li
          className="rounded-sm border border-border p-3 text-sm text-foreground"
          key={poll.id}
        >
          {poll.text}
        </li>
      ))}
    </ul>
  );
}

function Header({ onCancel }: { onCancel?: () => void }) {
  function handleBackToDashboard(event: React.MouseEvent<HTMLAnchorElement>) {
    if (onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Create session navigation"
        className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center justify-between p-4 sm:px-6 lg:px-16"
      >
        <a
          className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-muted-foreground hover:text-foreground"
          href="/host/dashboard"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Your sessions
        </a>
        <Brand aria-label="Pulse home" href="/" size="sm" />
      </nav>
    </header>
  );
}
