import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  Info,
  LoaderCircle,
  LockKeyhole,
  Mail,
  TriangleAlert,
} from 'lucide-react';

import { useSendMagicLink } from '@/shared/hooks/use-host-auth';
import { ApiError } from '@/shared/lib/api-client';
import { ERROR_CODES } from '@/shared/lib/contracts';
import { AuthShell } from '@/shared/ui/auth-shell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type HostEmailEntryState =
  | 'idle'
  | 'invalid'
  | 'rate-limited'
  | 'sending'
  | 'sent';

export type HostEmailEntryPageProps = Readonly<{
  initialEmail?: string;
  initialState?: HostEmailEntryState;
}>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function HostEmailEntryPage({
  initialEmail = '',
  initialState = 'idle',
}: HostEmailEntryPageProps = {}) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<HostEmailEntryState>(initialState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sendMagicLink = useSendMagicLink();

  const isSending = sendMagicLink.isPending || state === 'sending';
  const isRateLimited = state === 'rate-limited';

  const emailError =
    state === 'invalid'
      ? 'Enter a valid email address.'
      : errorMessage || undefined;

  function handleEmailChange(value: string) {
    setEmail(value);
    if (state === 'invalid' || errorMessage) {
      setState('idle');
      setErrorMessage(null);
    }
  }

  function handleUseDifferentEmail() {
    setState('idle');
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!emailPattern.test(trimmedEmail)) {
      setState('invalid');
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setErrorMessage(null);
    setState('sending');

    try {
      await sendMagicLink.mutateAsync({ email: trimmedEmail });
      setState('sent');
    } catch (err) {
      handleSendError(err);
    }
  }

  function handleSendError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.code === ERROR_CODES.RATE_LIMITED) {
        setState('rate-limited');
        setErrorMessage(
          'Too many requests. Please wait a moment before trying again.',
        );
      } else {
        setState('idle');
        setErrorMessage(err.message || 'Failed to send magic link.');
      }
    } else {
      setState('idle');
      setErrorMessage(
        'Failed to send magic link. Please check your network connection.',
      );
    }
  }

  return (
    <AuthShell
      footer="Passwordless access · secure magic link"
      footerIcon={LockKeyhole}
      body="Create a session, invite participants, and keep every response moving with you."
      eyebrow="HOST ACCESS"
      heading="Bring the room into focus."
    >
      <div className="flex flex-col gap-6">
        <HostEmailHeader />
        {isRateLimited ? <RateLimitedNotice /> : null}
        {state === 'sent' ? (
          <EmailSentState
            email={email}
            onChangeEmail={handleUseDifferentEmail}
          />
        ) : (
          <EmailEntryForm
            email={email}
            emailError={emailError}
            isRateLimited={isRateLimited}
            isSending={isSending}
            onEmailChange={handleEmailChange}
            onSubmit={handleSubmit}
          />
        )}
        <SpamNotice />
        <JoinAsParticipantLink />
      </div>
    </AuthShell>
  );
}

function HostEmailHeader() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs font-bold tracking-[0.14em] text-primary">
        PASSWORDLESS HOST ACCESS
      </p>
      <h2 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
        Sign in to Pulse
      </h2>
      <p className="text-sm leading-6 text-muted-foreground">
        Enter your email and we will send a short-lived, single-use magic
        link.
      </p>
    </div>
  );
}

function RateLimitedNotice() {
  return (
    <Alert
      className="border-border bg-muted"
      role="status"
    >
      <TriangleAlert />
      <AlertTitle>Too many requests</AlertTitle>
      <AlertDescription>
        Please wait a little before asking for another link. Your email is
        still saved below.
      </AlertDescription>
    </Alert>
  );
}

type EmailSentStateProps = Readonly<{
  email: string;
  onChangeEmail: () => void;
}>;

function EmailSentState({ email, onChangeEmail }: EmailSentStateProps) {
  return (
    <div className="flex flex-col gap-4">
      <Alert
        className="border-border bg-muted"
        role="status"
      >
        <Check />
        <AlertTitle>Magic link sent</AlertTitle>
        <AlertDescription>
          We sent a sign-in link to{' '}
          <span className="font-mono font-semibold text-foreground">
            {email}
          </span>
          . It expires shortly and can only be used once.
        </AlertDescription>
      </Alert>
      <a
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-95 active:translate-y-px"
        href={`/host/magic-link?email=${encodeURIComponent(email)}`}
      >
        <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
        Continue to confirmation
      </a>
      <Button
        className="w-full"
        onClick={onChangeEmail}
        type="button"
        variant="ghost"
      >
        Use a different email address
      </Button>
    </div>
  );
}

type EmailEntryFormProps = Readonly<{
  email: string;
  emailError?: string;
  isRateLimited: boolean;
  isSending: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>;

function EmailEntryForm({
  email,
  emailError,
  isRateLimited,
  isSending,
  onEmailChange,
  onSubmit,
}: EmailEntryFormProps) {
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={onSubmit}
    >
      <EmailInputField
        email={email}
        emailError={emailError}
        onChange={onEmailChange}
      />
      <SendMagicLinkButton
        disabled={isSending || isRateLimited}
        isSending={isSending}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        By continuing, you agree to receive a sign-in email from Pulse.
      </p>
    </form>
  );
}

type EmailInputFieldProps = Readonly<{
  email: string;
  emailError?: string;
  onChange: (value: string) => void;
}>;

function EmailInputField({ email, emailError, onChange }: EmailInputFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label htmlFor="host-email">
        Email address{' '}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </Label>
      <div className="relative">
        <Mail
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          autoComplete="email"
          aria-describedby={
            emailError
              ? 'host-email-hint host-email-error'
              : 'host-email-hint'
          }
          aria-invalid={Boolean(emailError)}
          className="h-12 pl-10"
          id="host-email"
          onChange={(event) => onChange(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
      </div>
      <p
        className="text-xs leading-5 text-muted-foreground"
        id="host-email-hint"
      >
        We will never use your email for participant access.
      </p>
      {emailError ? (
        <p
          className="text-xs leading-5 text-destructive"
          id="host-email-error"
          role="alert"
        >
          {emailError}
        </p>
      ) : null}
    </div>
  );
}

type SendMagicLinkButtonProps = Readonly<{
  disabled: boolean;
  isSending: boolean;
}>;

function SendMagicLinkButton({ disabled, isSending }: SendMagicLinkButtonProps) {
  return (
    <Button
      className="w-full"
      disabled={disabled}
      size="lg"
      type="submit"
    >
      {isSending ? (
        <>
          <LoaderCircle className="animate-spin" />
          Sending link...
        </>
      ) : (
        <>
          <ArrowRight />
          Send magic link
        </>
      )}
    </Button>
  );
}

function SpamNotice() {
  return (
    <Alert className="border-border bg-muted" role="note">
      <Info />
      <AlertDescription>
        Check your spam or junk folder if the email does not arrive.
      </AlertDescription>
    </Alert>
  );
}

function JoinAsParticipantLink() {
  return (
    <a
      className="text-center text-sm font-semibold text-primary hover:underline"
      href="/join"
    >
      Joining a session? Use a Room Code instead.
    </a>
  );
}
