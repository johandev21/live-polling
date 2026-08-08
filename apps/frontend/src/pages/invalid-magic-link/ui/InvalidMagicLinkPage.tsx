import { useEffect, useState } from 'react';
import {
  Check,
  Link2Off,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { useSendMagicLink } from '@/shared/hooks/use-host-auth';
import { AuthShell } from '@/shared/ui/auth-shell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type InvalidMagicLinkKind = 'expired' | 'invalid';

export type InvalidMagicLinkPageProps = Readonly<{
  email?: string;
  initialCooldownSeconds?: number;
  initialKind?: InvalidMagicLinkKind;
}>;

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export function InvalidMagicLinkPage({
  email,
  initialCooldownSeconds = 0,
  initialKind = 'expired',
}: InvalidMagicLinkPageProps = {}) {
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);
  const [requested, setRequested] = useState(false);
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

    if (!email) {
      // If no email present in search, redirect to email entry
      window.location.href = '/host/email';
      return;
    }

    setErrorMessage(null);
    try {
      await sendMagicLink.mutateAsync({ email });
      setCooldown(60);
      setRequested(true);
    } catch {
      setErrorMessage(
        'Could not request a new link right now. Please try again.',
      );
    }
  }

  const title =
    initialKind === 'expired'
      ? 'This link has expired'
      : 'This link is not valid';
  const description =
    initialKind === 'expired'
      ? 'The magic link expired or has already been used.'
      : 'This magic link cannot be used. It may be incomplete or already used.';

  return (
    <AuthShell
      footer="No password needed · secure by default"
      footerIcon={ShieldCheck}
      body="Magic links expire quickly by design. Request another one and you will be back in your session shortly."
      eyebrow="LET'S GET YOU BACK IN"
      heading="A fresh link is all you need."
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Link2Off aria-hidden="true" size={30} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {requested ? (
          <Alert className="border-border bg-muted" role="status">
            <Check />
            <AlertTitle>Fresh link requested</AlertTitle>
            <AlertDescription>
              {email
                ? `We sent a new short-lived link to ${email}.`
                : 'Check your inbox for a new short-lived link.'}
            </AlertDescription>
          </Alert>
        ) : null}
        {errorMessage ? (
          <Alert variant="destructive" role="alert">
            <TriangleAlert />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="w-full"
          disabled={cooldown > 0 || sendMagicLink.isPending}
          onClick={requestNewLink}
          size="lg"
          type="button"
        >
          {sendMagicLink.isPending ? (
            <>
              <LoaderCircle className="animate-spin" />
              Requesting new link...
            </>
          ) : cooldown > 0 ? (
            `Request a new link in ${formatCooldown(cooldown)}`
          ) : (
            <>
              <RefreshCw />
              Request a new link
            </>
          )}
        </Button>
        <p
          aria-live="polite"
          className="text-xs leading-5 text-muted-foreground"
        >
          {cooldown > 0
            ? 'A short cooldown prevents duplicate emails.'
            : email
              ? 'We will send a fresh link to the email address you used.'
              : 'Return to email entry if you need to use a different address.'}
        </p>

        <a
          className="text-sm font-semibold text-primary hover:underline"
          href="/host/email"
        >
          Return to email entry
        </a>
      </div>
    </AuthShell>
  );
}
