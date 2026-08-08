import { useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';

import { useSendMagicLink } from '@/shared/hooks/use-host-auth';
import { ApiError } from '@/shared/lib/api-client';
import { ERROR_CODES } from '@/shared/lib/contracts';
import { AuthShell } from '@/shared/ui/auth-shell';
import { Button, Callout, Field, TextInput } from '@/shared/ui';

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
      if (err instanceof ApiError) {
        if (err.code === ERROR_CODES.RATE_LIMITED) {
          setState('rate-limited');
          setErrorMessage('Too many requests. Please wait a moment before trying again.');
        } else {
          setState('idle');
          setErrorMessage(err.message || 'Failed to send magic link.');
        }
      } else {
        setState('idle');
        setErrorMessage('Failed to send magic link. Please check your network connection.');
      }
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
        <div className="flex flex-col gap-3">
          <p className="font-[var(--font-mono)] text-xs font-bold tracking-[0.14em] text-[var(--color-primary)]">
            PASSWORDLESS HOST ACCESS
          </p>
          <h2 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
            Sign in to Pulse
          </h2>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            Enter your email and we will send a short-lived, single-use magic
            link.
          </p>
        </div>

        {state === 'rate-limited' ? (
          <Callout icon="alertCircle" title="Too many requests" tone="warning">
            Please wait a little before asking for another link. Your email is
            still saved below.
          </Callout>
        ) : null}

        {state === 'sent' ? (
          <div className="flex flex-col gap-4">
            <Callout icon="check" title="Magic link sent" tone="success">
              We sent a sign-in link to{' '}
              <span className="font-[var(--font-mono)] font-semibold text-[var(--color-text-primary)]">
                {email}
              </span>
              . It expires shortly and can only be used once.
            </Callout>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-text-on-primary)] transition-[filter,transform] hover:brightness-95 active:translate-y-px"
              href={`/host/magic-link?email=${encodeURIComponent(email)}`}
            >
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
              Continue to confirmation
            </a>
            <Button
              className="w-full"
              onClick={() => {
                setState('idle');
                setErrorMessage(null);
              }}
              type="button"
              variant="quiet"
            >
              Use a different email address
            </Button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={handleSubmit}
          >
            <Field
              error={emailError}
              hint="We will never use your email for participant access."
              id="host-email"
              label="Email address"
              required
            >
              <TextInput
                autoComplete="email"
                invalid={Boolean(emailError)}
                leadingIcon="mail"
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (state === 'invalid' || errorMessage) {
                    setState('idle');
                    setErrorMessage(null);
                  }
                }}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </Field>

            <Button
              className="w-full"
              disabled={isSending || isRateLimited}
              endIcon={isSending ? 'loaderCircle' : 'arrowRight'}
              size="lg"
              type="submit"
            >
              {isSending ? 'Sending link...' : 'Send magic link'}
            </Button>

            <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
              By continuing, you agree to receive a sign-in email from Pulse.
            </p>
          </form>
        )}

        <Callout icon="info" tone="info">
          Check your spam or junk folder if the email does not arrive.
        </Callout>

        <a
          className="text-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
          href="/join"
        >
          Joining a session? Use a Room Code instead.
        </a>
      </div>
    </AuthShell>
  );
}
