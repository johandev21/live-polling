import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import {
  Brand,
  Button,
  Callout,
  Field,
  StatusBadge,
  Surface,
  TextInput,
} from '@/shared/ui';

import {
  emptyCreateSessionDraft,
  type CreateSessionDraft,
} from '../model/create-session';

export type CreateSessionPageProps = Readonly<{
  initialDraft?: CreateSessionDraft;
  onCancel?: () => void;
  onContinue?: (draft: CreateSessionDraft) => void;
}>;

function Header({ onCancel }: { onCancel?: () => void }) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <nav
        aria-label="Create session navigation"
        className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-16"
      >
        <a
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          href="/host-dashboard"
          onClick={onCancel}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Your sessions
        </a>
        <Brand aria-label="Pulse home" href="/" size="sm" />
      </nav>
    </header>
  );
}

export function CreateSessionPage({
  initialDraft = emptyCreateSessionDraft,
  onCancel,
  onContinue,
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = sessionName.trim();

    if (!trimmedName) {
      setNameError(
        'Add a name so participants know what this session is about.',
      );
      return;
    }

    const nextDraft: CreateSessionDraft = {
      ...draft,
      name: trimmedName,
    };
    setNameError(undefined);
    setActionMessage('Draft session created. Add your first poll to continue.');
    onContinue?.(nextDraft);
  }

  function handleCancel() {
    setActionMessage('Session creation cancelled.');
    onCancel?.();
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)]">
      <Header onCancel={handleCancel} />
      <main className="mx-auto grid w-full max-w-screen-xl gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,600px)_minmax(320px,440px)] lg:items-start lg:gap-16 lg:px-10">
        <section className="flex flex-col gap-7">
          <div>
            <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.16em] text-[var(--color-primary)]">
              NEW SESSION
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-4xl">
              Create a session
            </h1>
            <p className="mt-3 max-w-xl text-base leading-6 text-[var(--color-text-secondary)]">
              Give your session a clear name. You can add polls and arrange them
              next.
            </p>
          </div>

          <Surface as="section" className="p-6 sm:p-7" padding="none">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <Field
                error={nameError}
                hint="Required - up to 120 characters"
                id="session-name"
                label="Session name"
                required
              >
                <TextInput
                  autoComplete="off"
                  maxLength={120}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Team offsite - June 2025"
                  value={sessionName}
                />
              </Field>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={handleCancel}
                  type="button"
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <ArrowRight aria-hidden="true" className="mr-2" size={16} />
                  Add your first poll
                </Button>
              </div>
            </form>
          </Surface>

          <Callout icon="info" title="Draft Session" tone="info">
            This session starts as a Draft Session. Participants cannot join
            until you add at least one poll and start it.
          </Callout>

          {actionMessage ? (
            <p
              aria-live="polite"
              className="text-sm font-semibold text-[var(--color-success)]"
            >
              {actionMessage}
            </p>
          ) : null}
        </section>

        <Surface
          as="aside"
          aria-labelledby="session-preview-heading"
          className="flex flex-col gap-6 p-6 sm:p-7 lg:sticky lg:top-6"
          elevation="card"
          padding="none"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge label="Draft Session" showDot tone="warning" />
            <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
              Not joinable
            </span>
          </div>
          <div>
            <h2
              className="break-words text-2xl font-bold text-[var(--color-text-primary)]"
              id="session-preview-heading"
            >
              {displayName}
            </h2>
            <p className="mt-2 text-sm leading-5 text-[var(--color-text-secondary)]">
              Your polls will appear here in the order you create them.
            </p>
          </div>
          <div className="h-px w-full bg-[var(--color-border)]" />
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-sm text-[var(--color-text-secondary)]">
              Polls
            </dt>
            <dd className="font-[var(--font-mono)] text-2xl font-bold text-[var(--color-text-primary)]">
              {draft.polls.length}
            </dd>
          </dl>
          {draft.polls.length === 0 ? (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                No polls yet
              </p>
              <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">
                Save this draft to open the poll builder and define the first
                response.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Draft poll preview">
              {draft.polls.map((poll) => (
                <li
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-primary)]"
                  key={poll.id}
                >
                  {poll.text}
                </li>
              ))}
            </ul>
          )}
          <p className="font-[var(--font-mono)] text-xs leading-5 text-[var(--color-text-tertiary)]">
            Participants cannot join yet
          </p>
        </Surface>
      </main>
    </div>
  );
}
