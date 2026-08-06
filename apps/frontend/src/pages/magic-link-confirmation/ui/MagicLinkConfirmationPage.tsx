import { useEffect, useState } from 'react';
import { MailCheck, ShieldCheck } from 'lucide-react';

import { AuthShell } from '@/shared/ui/auth-shell';
import { Button, Callout } from '@/shared/ui';

export type MagicLinkConfirmationPageProps = Readonly<{
  email?: string;
  initialCooldownSeconds?: number;
}>;

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export function MagicLinkConfirmationPage({
  email = 'you@example.com',
  initialCooldownSeconds = 42,
}: MagicLinkConfirmationPageProps = {}) {
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);
  const [openEmailNotice, setOpenEmailNotice] = useState(false);
  const [requestedAgain, setRequestedAgain] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const intervalId = globalThis.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => globalThis.clearInterval(intervalId);
  }, [cooldown]);

  function requestNewLink() {
    if (cooldown > 0) {
      return;
    }

    setCooldown(60);
    setRequestedAgain(true);
  }

  return (
    <AuthShell
      footer="Short-lived · single-use · secure"
      footerIcon={ShieldCheck}
      body="No passwords to remember. Just a secure link when you need it."
      eyebrow="ONE SMALL STEP"
      heading="Your way into the room is on its way."
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <MailCheck aria-hidden="true" size={30} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
            Check your inbox
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            We sent a sign-in link to
          </p>
          <p className="break-all font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-primary)]">
            {email}
          </p>
        </div>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          The link is short-lived and can only be used once. Check your spam or
          junk folder if you do not see it soon.
        </p>

        {openEmailNotice ? (
          <Callout icon="mail" role="status" tone="info">
            Open your email app and look for the newest message from Pulse.
          </Callout>
        ) : null}
        {requestedAgain ? (
          <Callout icon="check" role="status" tone="success">
            A fresh link was requested for {email}.
          </Callout>
        ) : null}

        <Button
          className="w-full"
          onClick={() => setOpenEmailNotice(true)}
          size="lg"
          startIcon="mail"
          type="button"
        >
          Open your email
        </Button>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Did not receive it?
          </p>
          <Button
            className="px-2"
            disabled={cooldown > 0}
            onClick={requestNewLink}
            type="button"
            variant="quiet"
          >
            {cooldown > 0
              ? `Request a new link in ${formatCooldown(cooldown)}`
              : 'Request a new link'}
          </Button>
          <p
            aria-live="polite"
            className="text-xs text-[var(--color-text-tertiary)]"
          >
            {cooldown > 0
              ? 'You can request another link when the cooldown ends.'
              : 'The new link will also be short-lived and single-use.'}
          </p>
        </div>

        <a
          className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
          href="/host/email"
        >
          Use a different email address
        </a>
      </div>
    </AuthShell>
  );
}
