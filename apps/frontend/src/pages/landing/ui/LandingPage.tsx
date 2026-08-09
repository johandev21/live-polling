import type { ReactNode } from 'react';
import { ArrowUpRight, LogIn } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Brand } from '@/shared/ui';

type PreviewResult = {
  count: number;
  id: string;
  label: string;
  percentage: number;
};

type WorkflowStep = {
  body: string;
  id: string;
  number: string;
  title: string;
};

const previewResults: readonly PreviewResult[] = [
  { count: 42, id: 'deep-work', label: 'Deep work', percentage: 58 },
  {
    count: 20,
    id: 'team-connection',
    label: 'Team connection',
    percentage: 27,
  },
  { count: 11, id: 'learning-time', label: 'Learning time', percentage: 15 },
];

const workflowSteps: readonly WorkflowStep[] = [
  {
    body: 'Add a name and your first poll.',
    id: 'create',
    number: '01',
    title: 'Create a session',
  },
  {
    body: 'Participants join from any phone, no account needed.',
    id: 'share',
    number: '02',
    title: 'Share the Room Code',
  },
  {
    body: "Keep control of the active poll and the room's attention.",
    id: 'move-on',
    number: '03',
    title: 'Open, reveal, move on',
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-background">
      <SiteHeader />
      <HeroSection />
      <ProofBar />
      <WorkflowSection />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 p-5 sm:px-8 lg:px-12">
      <Brand aria-label="Pulse home" href="/" size="lg" />

      <nav
        aria-label="Primary navigation"
        className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
      >
        <a className="transition-colors hover:text-foreground" href="#product">
          Product
        </a>
        <a className="transition-colors hover:text-foreground" href="#hosts">
          For hosts
        </a>
        <a
          className="transition-colors hover:text-foreground"
          href="#participants"
        >
          For participants
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <a
          className="hidden text-sm font-semibold text-foreground transition-colors hover:text-primary sm:inline-flex"
          href="/host/email"
        >
          Sign in
        </a>
        <PrimaryCta>
          <span className="hidden sm:inline">Create a session</span>
          <span className="sm:hidden">Create session</span>
        </PrimaryCta>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section
      aria-labelledby="landing-heading"
      className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pt-12 pb-20 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-16 lg:px-12 lg:pt-20 lg:pb-24"
      id="hosts"
    >
      <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-primary">
          LIVE POLLING, WITHOUT THE FRICTION
        </p>
        <h1
          className="max-w-xl text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.04em] text-foreground"
          id="landing-heading"
        >
          Make every voice part of the moment.
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Pulse helps hosts run focused, reliable polls while participants
          join in seconds - no account required.
        </p>
        <div className="flex w-full flex-wrap items-center justify-center gap-3 lg:justify-start">
          <PrimaryCta>Create a free session</PrimaryCta>
          <OutlineCta>Join with a Room Code</OutlineCta>
        </div>
      </div>

      <LivePollPreview />
    </section>
  );
}

function LivePollPreview() {
  return (
    <article aria-label="Live poll preview" className="w-full">
      <Card className="rounded-[1.5rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-primary"
              />
              <p className="min-w-0 text-sm font-semibold wrap-break-word text-foreground">
                Team offsite · Pulse session
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary">Open poll</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-[1.65rem]">
              What should we make more time for?
            </h2>
            <p className="font-mono text-[0.68rem] text-muted-foreground">
              Single-choice poll · 03:42 remaining
            </p>
          </div>

          <PreviewResultList />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="font-mono text-[0.68rem] text-muted-foreground">
              73 total responses
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Results hidden from participants
            </p>
          </div>
        </div>
      </Card>
    </article>
  );
}

function PreviewResultList() {
  return (
    <ul className="flex flex-col gap-3">
      {previewResults.map((result) => (
        <PreviewResultRow key={result.id} result={result} />
      ))}
    </ul>
  );
}

function PreviewResultRow({ result }: { result: PreviewResult }) {
  return (
    <li>
      <Card className="gap-2 rounded-lg p-4">
        <div
          aria-label={`${result.label}: ${result.percentage}%`}
          className="flex w-full flex-col gap-2"
          role="group"
        >
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 font-semibold wrap-break-word text-foreground">
              {result.label}
            </span>
            <span className="shrink-0 font-mono text-xs font-semibold text-primary">
              {result.percentage}%
            </span>
          </div>
          <Progress
            aria-label={`${result.label}: ${result.percentage}%`}
            className="h-2"
            value={result.percentage}
          />
          <span className="text-xs text-muted-foreground">
            {result.count} responses
          </span>
        </div>
      </Card>
    </li>
  );
}

function ProofBar() {
  return (
    <section
      aria-labelledby="proof-heading"
      className="bg-primary px-5 py-7 text-primary-foreground sm:px-8 lg:px-12"
      id="participants"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h2
          className="text-center text-lg font-semibold sm:text-left"
          id="proof-heading"
        >
          Designed for the room you are in.
        </h2>
        <dl className="grid grid-cols-3 gap-5 text-center sm:gap-8 sm:text-left">
          <Stat value="2 sec" label="to join" />
          <Stat value="0" label="accounts needed" />
          <Stat value="1" label="clear next action" />
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-lg font-bold">{value}</dt>
      <dd className="text-xs text-primary-foreground/80">{label}</dd>
    </div>
  );
}

function WorkflowSection() {
  return (
    <section
      aria-labelledby="workflow-heading"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 lg:px-12 lg:py-16"
      id="product"
    >
      <div>
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-primary">
          FROM PROMPT TO PARTICIPATION
        </p>
        <h2
          className="mt-3 text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl"
          id="workflow-heading"
        >
          A calmer way to keep a room moving.
        </h2>
      </div>
      <WorkflowSteps />
    </section>
  );
}

function WorkflowSteps() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {workflowSteps.map((step) => (
        <WorkflowStepCard key={step.id} step={step} />
      ))}
    </ol>
  );
}

function WorkflowStepCard({ step }: { step: WorkflowStep }) {
  return (
    <li>
      <Card className="min-h-36 gap-2 p-5">
        <span className="font-mono text-xs font-bold text-primary">
          {step.number}
        </span>
        <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
        <p className="text-sm leading-5 text-muted-foreground">{step.body}</p>
      </Card>
    </li>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-card px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <p className="text-lg font-bold text-foreground">
            Pulse for live moments.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Present clearly. Listen instantly. Move forward together.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <p className="font-mono text-xs text-muted-foreground">
            Ready when the room is.
          </p>
          <PrimaryCta>Create a free session</PrimaryCta>
        </div>
      </div>
    </footer>
  );
}

function PrimaryCta({ children }: { children: ReactNode }) {
  return (
    <a
      className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-5')}
      href="/host/email"
    >
      <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
      {children}
    </a>
  );
}

function OutlineCta({ children }: { children: ReactNode }) {
  return (
    <a
      className={cn(
        buttonVariants({ size: 'lg', variant: 'outline' }),
        'h-12 px-5',
      )}
      href="/join"
    >
      <LogIn aria-hidden="true" className="text-primary" size={16} />
      {children}
    </a>
  );
}
