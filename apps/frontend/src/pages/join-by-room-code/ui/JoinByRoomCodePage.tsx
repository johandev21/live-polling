import { useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  WifiOff,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brand } from '@/shared/ui';

import {
  normalizeRoomCode,
  type RoomCodeStatus,
} from '../model/join-by-room-code';

export type JoinByRoomCodePageProps = Readonly<{
  errorMessage?: string | null;
  initialRoomCode?: string;
  isSubmitting?: boolean;
  onJoinSubmit?: (roomCode: string) => Promise<void> | void;
  statusOverride?: RoomCodeStatus;
}>;

const statusCopy = {
  draft: {
    body: 'This session is still being prepared by its host. Ask the host to start it before joining.',
    title: 'This session is not live yet',
    tone: 'warning',
  },
  ended: {
    body: 'This session has ended and no longer accepts new participants.',
    title: 'This session has ended',
    tone: 'neutral',
  },
  invalid: {
    body: 'Check the Room Code and try again. It should contain six letters or numbers.',
    title: 'We could not find that Room Code',
    tone: 'error',
  },
  unavailable: {
    body: 'The session service is temporarily unavailable. Keep the code and try again shortly.',
    title: 'The session is unavailable right now',
    tone: 'error',
  },
} satisfies Record<
  Exclude<RoomCodeStatus, 'idle' | 'ready'>,
  { body: string; title: string; tone: 'error' | 'neutral' | 'warning' }
>;

export function JoinByRoomCodePage({
  errorMessage,
  initialRoomCode = '',
  isSubmitting = false,
  onJoinSubmit,
  statusOverride,
}: JoinByRoomCodePageProps = {}) {
  const [roomCode, setRoomCode] = useState(() =>
    normalizeRoomCode(initialRoomCode),
  );
  const [status, setStatus] = useState<RoomCodeStatus>('idle');

  const activeStatus = statusOverride ?? status;
  const codeError =
    activeStatus === 'invalid' ? statusCopy.invalid.body : undefined;

  function handleRoomCodeChange(value: string) {
    setRoomCode(normalizeRoomCode(value));
    setStatus('idle');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized || normalized.length < 6) {
      setStatus('invalid');
      return;
    }

    if (onJoinSubmit) {
      try {
        await onJoinSubmit(normalized);
      } catch {
        setStatus('idle');
      }
    }
  }

  const invitationPath = roomCode
    ? `/join/invitation?roomCode=${encodeURIComponent(roomCode)}`
    : '/join/invitation';

  return (
    <main className="min-h-screen bg-mist-50 dark:bg-background px-4 py-8 sm:px-6 lg:grid lg:place-items-center lg:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <Card className="grid w-full overflow-hidden p-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]">
          <JoinPanel
            activeStatus={activeStatus}
            codeError={codeError}
            errorMessage={errorMessage}
            invitationPath={invitationPath}
            isSubmitting={isSubmitting}
            onRoomCodeChange={handleRoomCodeChange}
            onSubmit={handleSubmit}
            roomCode={roomCode}
          />
          <BenefitsAside />
        </Card>
      </section>
    </main>
  );
}

type JoinPanelProps = Readonly<{
  activeStatus: RoomCodeStatus;
  codeError?: string;
  errorMessage?: string | null;
  invitationPath: string;
  isSubmitting: boolean;
  onRoomCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  roomCode: string;
}>;

function JoinPanel({
  activeStatus,
  codeError,
  errorMessage,
  invitationPath,
  isSubmitting,
  onRoomCodeChange,
  onSubmit,
  roomCode,
}: JoinPanelProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-9">
      <Brand aria-label="Pulse home" href="/" size="lg" />
      <JoinHeader />
      {errorMessage ? <JoinErrorAlert errorMessage={errorMessage} /> : null}
      <JoinForm
        codeError={codeError}
        isSubmitting={isSubmitting}
        onRoomCodeChange={onRoomCodeChange}
        onSubmit={onSubmit}
        roomCode={roomCode}
      />
      <RoomCodeStatusAlert activeStatus={activeStatus} roomCode={roomCode} />
      <InvitationLink invitationPath={invitationPath} />
    </div>
  );
}

function JoinHeader() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs font-bold tracking-[0.15em] text-primary">
        PARTICIPANT ACCESS
      </p>
      <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
        Join a session
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Enter the Room Code shared by your host. Room Codes are not
        case-sensitive.
      </p>
    </div>
  );
}

function JoinErrorAlert({ errorMessage }: { errorMessage: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Unable to join</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}

type JoinFormProps = Readonly<{
  codeError?: string;
  isSubmitting: boolean;
  onRoomCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  roomCode: string;
}>;

function JoinForm({
  codeError,
  isSubmitting,
  onRoomCodeChange,
  onSubmit,
  roomCode,
}: JoinFormProps) {
  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
      <RoomCodeInput
        codeError={codeError}
        onChange={onRoomCodeChange}
        value={roomCode}
      />
      <JoinSubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}

type RoomCodeInputProps = Readonly<{
  codeError?: string;
  onChange: (value: string) => void;
  value: string;
}>;

function RoomCodeInput({ codeError, onChange, value }: RoomCodeInputProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label htmlFor="room-code">
        Room Code{' '}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </Label>
      <Input
        autoCapitalize="characters"
        autoComplete="off"
        aria-describedby={
          codeError
            ? 'room-code-hint room-code-error'
            : 'room-code-hint'
        }
        aria-invalid={Boolean(codeError)}
        className="h-12 font-mono text-lg font-bold tracking-[0.16em]"
        id="room-code"
        inputMode="text"
        maxLength={6}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. 7K4P9D"
        spellCheck={false}
        value={value}
      />
      <p
        className="text-xs leading-5 text-muted-foreground"
        id="room-code-hint"
      >
        We will normalize the code to uppercase for readability.
      </p>
      {codeError ? (
        <p
          className="text-xs leading-5 text-destructive"
          id="room-code-error"
          role="alert"
        >
          {codeError}
        </p>
      ) : null}
    </div>
  );
}

function JoinSubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button
      className="w-full"
      disabled={isSubmitting}
      size="lg"
      type="submit"
    >
      {isSubmitting ? (
        <>
          <LoaderCircle className="animate-spin" />
          Verifying code...
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

type RoomCodeStatusAlertProps = Readonly<{
  activeStatus: RoomCodeStatus;
  roomCode: string;
}>;

function RoomCodeStatusAlert({
  activeStatus,
  roomCode,
}: RoomCodeStatusAlertProps) {
  if (activeStatus === 'idle') {
    return null;
  }
  if (activeStatus === 'ready') {
    return <SessionFoundAlert roomCode={roomCode} />;
  }
  return <StatusNotice status={activeStatus} />;
}

function SessionFoundAlert({ roomCode }: { roomCode: string }) {
  return (
    <Alert
      className="border-border bg-muted"
      role="status"
    >
      <Check />
      <AlertTitle>Session found</AlertTitle>
      <AlertDescription>
        You are ready to choose a session-local display name before
        joining.
        <a
          className="mt-3 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          href={`/join/name?roomCode=${encodeURIComponent(roomCode)}`}
        >
          Continue to display name
          <ArrowRight aria-hidden="true" size={15} />
        </a>
      </AlertDescription>
    </Alert>
  );
}

function StatusNotice({
  status,
}: {
  status: Exclude<RoomCodeStatus, 'idle' | 'ready'>;
}) {
  const copy = statusCopy[status];
  return (
    <Alert
      variant={copy.tone === 'error' ? 'destructive' : undefined}
    >
      {status === 'unavailable' ? <WifiOff /> : <AlertCircle />}
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription>{copy.body}</AlertDescription>
    </Alert>
  );
}

function InvitationLink({ invitationPath }: { invitationPath: string }) {
  return (
    <a
      className="text-center text-sm font-semibold text-primary hover:underline"
      href={invitationPath}
    >
      Have an Invitation Link? Open it directly instead.
    </a>
  );
}

function BenefitsAside() {
  return (
    <aside className="flex flex-col justify-between gap-10 bg-muted/60 p-7 text-foreground sm:p-9">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">
            No account needed.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Participants join with a session-local identity. Your display
            name is visible to the host, not to other participants.
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          <BenefitItem icon={Zap}>Join in seconds</BenefitItem>
          <BenefitItem icon={ShieldCheck}>Private by default</BenefitItem>
          <BenefitItem icon={RefreshCw}>
            Change responses while open
          </BenefitItem>
        </ul>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        You can use a different identity in another browser or device.
      </p>
    </aside>
  );
}

function BenefitItem({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <li className="flex items-center gap-3 text-sm font-semibold">
      <Icon
        aria-hidden="true"
        className="text-primary-foreground/80"
        size={17}
      />
      {children}
    </li>
  );
}
