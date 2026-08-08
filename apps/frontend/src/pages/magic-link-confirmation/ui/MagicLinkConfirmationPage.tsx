import { useEffect, useState } from 'react';
import {
  Check,
  Mail,
  MailCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { useSendMagicLink } from '@/shared/hooks/use-host-auth';
import { AuthShell } from '@/shared/ui/auth-shell';
import {
  Alert as AlertBox,
  AlertDescription as AlertText,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sendMagicLink = useSendMagicLink();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const intervalId = globalThis.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => globalThis.clearInterval(intervalId);
  }, [cooldown]);

  async function requestNewLink() {
    if (cooldown > 0 || sendMagicLink.isPending) {
      return;
    }

    setErrorMessage(null);
    try {
      await sendMagicLink.mutateAsync({ email });
      setCooldown(60);
      setRequestedAgain(true);
    } catch {
      setErrorMessage(
        'Could not request a new link right now. Please try again later.',
      );
    }
  }

  function handleOpenEmail() {
    setOpenEmailNotice(true);
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
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
          <MailCheck aria-hidden="true" size={30} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
            Check your inbox
          </h2>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to
          </p>
          <p className="font-mono text-sm font-bold break-all text-foreground">
            {email}
          </p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          The link is short-lived and can only be used once. Check your spam or
          junk folder if you do not see it soon.
        </p>

        <StatusCallout
          email={email}
          errorMessage={errorMessage}
          openEmailNotice={openEmailNotice}
          requestedAgain={requestedAgain}
        />

        <Button
          className="w-full"
          onClick={handleOpenEmail}
          size="lg"
          type="button"
        >
          <Mail />
          Open your email
        </Button>

        <RequestNewLinkActions
          cooldown={cooldown}
          isPending={sendMagicLink.isPending}
          onRequest={requestNewLink}
        />

        <a
          className="text-sm font-semibold text-primary hover:underline"
          href="/host/email"
        >
          Use a different email address
        </a>
      </div>
    </AuthShell>
  );
}

type StatusCalloutProps = Readonly<{
  email: string;
  errorMessage: string | null;
  openEmailNotice: boolean;
  requestedAgain: boolean;
}>;

function StatusCallout({
  email,
  errorMessage,
  openEmailNotice,
  requestedAgain,
}: StatusCalloutProps) {
  return (
    <>
      {openEmailNotice ? (
        <AlertBox className="border-border bg-muted" role="status">
          <Mail />
          <AlertText>
            Open your email app and look for the newest message from Pulse.
          </AlertText>
        </AlertBox>
      ) : null}
      {requestedAgain ? (
        <AlertBox className="border-border bg-muted" role="status">
          <Check />
          <AlertText>A fresh link was requested for {email}.</AlertText>
        </AlertBox>
      ) : null}
      {errorMessage ? (
        <AlertBox
          className="border-destructive/25 bg-destructive/10"
          role="alert"
          variant="destructive"
        >
          <TriangleAlert />
          <AlertText>{errorMessage}</AlertText>
        </AlertBox>
      ) : null}
    </>
  );
}

type RequestNewLinkActionsProps = Readonly<{
  cooldown: number;
  isPending: boolean;
  onRequest: () => void;
}>;

function RequestNewLinkActions({
  cooldown,
  isPending,
  onRequest,
}: RequestNewLinkActionsProps) {
  const buttonLabel = getRequestButtonLabel(cooldown, isPending);
  const hint =
    cooldown > 0
      ? 'You can request another link when the cooldown ends.'
      : 'The new link will also be short-lived and single-use.';

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">Did not receive it?</p>
      <Button
        className="px-2"
        disabled={cooldown > 0 || isPending}
        onClick={onRequest}
        type="button"
        variant="ghost"
      >
        {buttonLabel}
      </Button>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

function getRequestButtonLabel(cooldown: number, isPending: boolean) {
  if (isPending) {
    return 'Sending fresh link...';
  }
  if (cooldown > 0) {
    return `Request a new link in ${formatCooldown(cooldown)}`;
  }
  return 'Request a new link';
}
