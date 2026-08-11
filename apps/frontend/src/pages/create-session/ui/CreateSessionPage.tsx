import { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

import { ModeToggle } from '@/components/mode-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Brand } from '@/shared/ui/brand';
import { GlassHeader } from '@/shared/ui/glass-header';


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

const PRESET_SESSION_NAMES = [
  'Q3 Strategy & Team Offsite',
  'Sprint Retrospective',
  'Product Roadmap Feedback',
  'Live Workshop Q&A',
] as const;

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

  function handleNameChange(value: string) {
    setSessionName(value);
    if (nameError && value.trim()) {
      setNameError(undefined);
    }
  }

  function handlePresetSelect(preset: string) {
    setSessionName(preset);
    if (nameError) {
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
    <div className="min-h-screen bg-mist-50 font-sans text-foreground dark:bg-background">
      <Header onCancel={handleCancel} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Create a session
          </h1>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">
            Give your session a name to get started. You can add polls next.
          </p>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Error creating session</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit}>
          <CreateSessionCard
            isSubmitting={isSubmitting}
            nameError={nameError}
            onCancel={handleCancel}
            onNameChange={handleNameChange}
            onPresetSelect={handlePresetSelect}
            sessionName={sessionName}
          />
        </form>

        {actionMessage ? (
          <p
            aria-live="polite"
            className="text-sm font-semibold text-muted-foreground sm:text-base"
          >
            {actionMessage}
          </p>
        ) : null}
      </main>
    </div>
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
    <GlassHeader containerClassName="max-w-2xl px-4 sm:px-6">
      <nav
        aria-label="Create session navigation"
        className="flex w-full items-center justify-between"
      >
        <a
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground sm:text-base"
          href="/host/dashboard"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft aria-hidden="true" size={16} />
          <span>Your sessions</span>
        </a>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Brand aria-label="Pulse home" href="/" size="sm" />
        </div>
      </nav>
    </GlassHeader>
  );
}

function CreateSessionCard({
  isSubmitting,
  nameError,
  onCancel,
  onNameChange,
  onPresetSelect,
  sessionName,
}: {
  isSubmitting: boolean;
  nameError?: string;
  onCancel: () => void;
  onNameChange: (value: string) => void;
  onPresetSelect: (preset: string) => void;
  sessionName: string;
}) {
  const remainingChars = 120 - sessionName.length;

  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      {/* Session Name Input */}
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="session-name" className="text-sm font-medium sm:text-base">
            Session name <span aria-hidden="true" className="text-destructive">*</span>
          </FieldLabel>
          <span
            className={`text-xs font-mono sm:text-sm ${
              remainingChars < 10
                ? 'text-destructive font-bold'
                : 'text-muted-foreground'
            }`}
          >
            {sessionName.length}/120
          </span>
        </div>

        <Input
          id="session-name"
          autoComplete="off"
          className="h-auto py-2.5 text-xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 sm:text-2xl"
          maxLength={120}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Team offsite - June 2025"
          value={sessionName}
        />

        <FieldDescription className="text-xs sm:text-sm">
          Required, up to 120 characters
        </FieldDescription>

        {nameError ? <FieldError className="text-xs sm:text-sm font-medium">{nameError}</FieldError> : null}
      </Field>

      {/* Suggested Title Chips */}
      <PresetIdeas onSelectPreset={onPresetSelect} />

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Button onClick={onCancel} type="button" variant="outline" size="lg">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit" size="lg">
          <span>{isSubmitting ? 'Creating session...' : 'Add your first poll'}</span>
          <ArrowRight aria-hidden="true" size={16} />
        </Button>
      </div>
    </Card>
  );
}

function PresetIdeas({ onSelectPreset }: { onSelectPreset: (preset: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">Suggested names:</p>
      <div className="flex flex-wrap gap-2">
        {PRESET_SESSION_NAMES.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground sm:text-sm"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
